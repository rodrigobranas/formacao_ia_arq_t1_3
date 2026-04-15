import { mkdir } from "node:fs/promises";

import { embedMany } from "ai";
import { MDocument } from "@mastra/rag";

import {
  CHUNKING_CONFIG,
  DATA_DIR,
  embedder,
  PAPERS_INDEX_NAME,
  type Paper,
  type PaperChunkMetadata,
  samplePapers,
  vectorStore,
} from "../mastra.js";
import { requireEnv } from "./rag-env.js";

// ------------------------------------------------------------
// HELPERS (ingestão)
// ------------------------------------------------------------

// Cria um token de citação único por chunk, ex: [attention-is-all-you-need#3].
// O agente usa esses tokens para referenciar trechos específicos na resposta.
function createCitation(paperId: string, chunkIndex: number) {
  // paperId costuma ser um slug estável; chunkIndex é 1-based entre chunks *indexados*.
  return `[${paperId}#${chunkIndex}]`;
}

// Normaliza o texto do chunk — colapsa espaços, tabs e quebras de linha repetidos
// em um único espaço. Isso evita que whitespace do PDF "suje" o embedding.
export function normaliseChunkText(text: string) {
  // \s+ cobre espaço, tab, \n, \r; trim remove espaços nas pontas após o colapso.
  return text.replaceAll(/\s+/g, " ").trim();
}

// Agrupa tudo o que queremos recuperar na busca: identidade do paper, citação legível
// e o texto bruto do chunk (também usado como input do embedding).
function createChunkMetadata(paper: Paper, chunkIndex: number, text: string): PaperChunkMetadata {
  return {
    citation: createCitation(paper.id, chunkIndex),
    paperId: paper.id,
    paperTitle: paper.title,
    paperUrl: paper.arxivUrl,
    chunkIndex,
    text,
  };
}

// Garante pasta local para artefatos (ex.: dados auxiliares). `recursive: true` não falha se já existir.
async function ensureDataDirectory() {
  await mkdir(DATA_DIR, { recursive: true });
}

// ------------------------------------------------------------
// ETAPA 1 — SCRAPING (PDF → Markdown)
// ------------------------------------------------------------

// Usa o Firecrawl para converter o PDF do artigo em Markdown limpo.
// Markdown é melhor que texto puro porque preserva a estrutura (títulos, listas)
// e ajuda o chunker a encontrar pontos de quebra naturais.
async function scrapePaperAsMarkdown(paper: Paper, firecrawlApiKey: string) {
  // API v2: passamos a URL do PDF; `formats: ["markdown"]` pede conversão para Markdown estruturado.
  const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firecrawlApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: paper.pdfUrl,
      formats: ["markdown"],
    }),
  });

  // HTTP 4xx/5xx: problema de rede, auth ou quota — não há corpo útil para seguir.
  if (!response.ok) {
    throw new Error(`Firecrawl request failed with status ${response.status} for ${paper.title}.`);
  }

  // O JSON segue o contrato do Firecrawl: success + data ou mensagem de erro.
  const body = (await response.json()) as {
    success: boolean;
    error?: string;
    data?: { markdown?: string };
  };

  // Validação explícita: às vezes HTTP 200 mas success=false (ex.: URL bloqueada).
  if (!body.success || !body.data?.markdown) {
    throw new Error(body.error ?? `Firecrawl did not return markdown for ${paper.title}.`);
  }

  return body.data.markdown;
}

// ------------------------------------------------------------
// ETAPA 2 — CHUNKING (Markdown → pedaços menores)
// ------------------------------------------------------------

// Divide o documento em pedaços menores (chunks) para indexação.
// Cada chunk vira um vetor independente no banco — na hora da busca,
// retornamos apenas os chunks mais relevantes, não o artigo inteiro.
// Chunks muito pequenos (< 200 chars) são descartados pois geralmente
// são cabeçalhos ou rodapés que não carregam contexto útil.
async function extractPaperChunks(paper: Paper, markdown: string) {
  // 1) Encapsula o Markdown no tipo de documento do Mastra RAG (MDocument).
  const document = MDocument.fromMarkdown(markdown);

  // 2) Aplica a estratégia de chunking (tamanho, overlap, etc.) definida em CHUNKING_CONFIG.
  //    Cada item retornado é um trecho bruto com `.text` ainda possivelmente "sujo" de whitespace.
  const chunks = await document.chunk(CHUNKING_CONFIG);

  // Só indexamos chunks que passam no filtro abaixo — mantém id estável (1, 2, 3…).
  const usableChunks: Array<{ id: string; metadata: PaperChunkMetadata }> = [];

  for (const chunk of chunks) {
    // Limpa espaços/quebras repetidos (ver comentário em normaliseChunkText).
    const text = normaliseChunkText(chunk.text);

    // Descarta trechos curtos (cabeçalhos, números de página soltos, etc.).
    if (text.length < 200) {
      continue;
    }

    // Índice humano e estável no metadata/citação: primeiro chunk válido = 1, segundo = 2, …
    const chunkIndex = usableChunks.length + 1;
    usableChunks.push({
      // ID único no store — combina o id do paper com a posição entre chunks *úteis*.
      id: `${paper.id}-chunk-${chunkIndex}`,
      metadata: createChunkMetadata(paper, chunkIndex, text),
    });
  }

  return usableChunks;
}

// ------------------------------------------------------------
// VECTOR INDEX (ingestão)
// ------------------------------------------------------------

// Recria o índice vetorial do zero a cada ingestão.
// "dimension" é o tamanho do vetor que o modelo de embedding retorna
// (ex: text-embedding-3-small = 1536 dimensões).
async function prepareVectorIndex(dimension: number) {
  // Lista índices no store (LibSQL) para saber se precisamos dropar o antigo.
  const existingIndexes = await vectorStore.listIndexes();

  // Recriação limpa: embeddings de outro modelo podem ter `dimension` diferente —
  // reaproveitar o índice com tamanho errado quebraria inserts/consultas.
  if (existingIndexes.includes(PAPERS_INDEX_NAME)) {
    await vectorStore.deleteIndex({ indexName: PAPERS_INDEX_NAME });
  }

  // `dimension` deve bater exatamente com o comprimento de cada vetor retornado pelo embedder.
  await vectorStore.createIndex({
    indexName: PAPERS_INDEX_NAME,
    dimension,
  });
}

// ------------------------------------------------------------
// FORMATAÇÃO (lista de papers — CLI)
// ------------------------------------------------------------

// Monta texto legível para CLI/logs: lista numerada com resumo e link do arXiv.
export function formatPaperList() {
  return samplePapers
    .map(
      (paper, index) => `${index + 1}. ${paper.title}\n   ${paper.summary}\n   ${paper.arxivUrl}`
    )
    .join("\n\n");
}

// ------------------------------------------------------------
// PIPELINE DE INGESTÃO (orquestra as 4 etapas do RAG)
// ------------------------------------------------------------

// Pipeline completo:
//   PDF → Markdown (scraping)
//     → Chunks (chunking)
//       → Vetores (embedding)
//         → Banco vetorial (indexação)
//
// Ao final, cada chunk fica salvo como um vetor no LibSQL com seus metadados
// (título, citação, texto original) para retrieval posterior.
export async function ingestSamplePapers() {
  // OpenAI: embeddings na etapa 3; Firecrawl: scraping na etapa 1.
  requireEnv("OPENAI_API_KEY");
  const firecrawlApiKey = requireEnv("FIRECRAWL_API_KEY");
  await ensureDataDirectory();

  // Etapas 1–2: por artigo, PDF→Markdown→chunks; acumulamos tudo num único array para um único batch de embeddings.
  const allChunks: Array<{ id: string; metadata: PaperChunkMetadata }> = [];

  for (const paper of samplePapers) {
    console.log(`- Scraping ${paper.title}`);
    const markdown = await scrapePaperAsMarkdown(paper, firecrawlApiKey);

    console.log(`- Chunking ${paper.title}`);
    const chunks = await extractPaperChunks(paper, markdown);
    allChunks.push(...chunks);
  }

  if (allChunks.length === 0) {
    throw new Error("No chunks were generated from the papers.");
  }

  // Etapa 3: embedding — converte cada chunk em um vetor numérico.
  // embedMany processa todos de uma vez para aproveitar batching da API.
  console.log(`- Embedding ${allChunks.length} chunks`);
  const { embeddings } = await embedMany({
    model: embedder,
    // Ordem de `values` alinha 1:1 com `allChunks` e com `vectors` no upsert abaixo.
    values: allChunks.map(chunk => chunk.metadata.text),
  });

  // Inferimos a dimensão a partir do primeiro vetor — deve ser homogênea para todo o lote.
  const dimension = embeddings[0]?.length;

  if (!dimension) {
    throw new Error("The embedding model did not return vectors.");
  }

  // Etapa 4: indexação — salva vetores + metadados no banco vetorial.
  // O upsert associa cada vetor ao seu ID e metadados (citação, texto, etc).
  await prepareVectorIndex(dimension);

  console.log("- Writing vectors to the local LibSQL index");
  // ids[i] ↔ vectors[i] ↔ metadata[i] — posição é o vínculo entre embedding e texto/citação.
  await vectorStore.upsert({
    indexName: PAPERS_INDEX_NAME,
    ids: allChunks.map(chunk => chunk.id),
    vectors: embeddings,
    metadata: allChunks.map(chunk => chunk.metadata),
  });

  return {
    papers: samplePapers.length,
    chunks: allChunks.length,
  };
}
