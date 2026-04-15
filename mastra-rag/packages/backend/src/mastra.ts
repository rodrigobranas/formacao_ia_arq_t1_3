import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { LIBSQL_PROMPT, LibSQLVector } from "@mastra/libsql";
import { createVectorQueryTool } from "@mastra/rag";

// ------------------------------------------------------------
// TIPOS
// ------------------------------------------------------------

export type Paper = {
  id: string;
  title: string;
  summary: string;
  arxivUrl: string;
  pdfUrl: string;
};

export type PaperChunkMetadata = {
  citation: string;
  paperId: string;
  paperTitle: string;
  paperUrl: string;
  chunkIndex: number;
  text: string;
};

export type SearchSource = {
  id: string;
  score: number;
  metadata?: Partial<PaperChunkMetadata>;
};

export type SearchResult = {
  relevantContext: Array<Partial<PaperChunkMetadata>>;
  sources: SearchSource[];
};

// ------------------------------------------------------------
// CONSTANTES E CONFIGURAÇÃO
// ------------------------------------------------------------

const CHAT_MODEL = "openai/gpt-5.4-nano";
export const EMBEDDING_MODEL = "openai/text-embedding-3-small";
export const PAPERS_INDEX_NAME = "course_papers";
export const DATA_DIR = join(process.cwd(), ".data");

// Configuração do chunking — como o documento é fatiado antes de virar vetor.
// "recursive" tenta quebrar por parágrafos, depois frases, depois palavras.
// maxSize: tamanho máximo (em caracteres) de cada chunk.
// overlap: sobreposição entre chunks consecutivos para não perder contexto nas bordas.
export const CHUNKING_CONFIG = {
  strategy: "recursive" as const,
  maxSize: 2000,
  overlap: 200,
};

// ------------------------------------------------------------
// ARTIGOS DE EXEMPLO
// ------------------------------------------------------------

export const samplePapers: Paper[] = [
  {
    id: "attention-is-all-you-need",
    title: "Attention Is All You Need",
    summary: "The Transformer paper that replaced recurrence with self-attention.",
    arxivUrl: "https://arxiv.org/abs/1706.03762",
    pdfUrl: "https://arxiv.org/pdf/1706.03762",
  },
  {
    id: "rag-knowledge-intensive-nlp",
    title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
    summary: "The paper that popularized combining retrieval with sequence generation.",
    arxivUrl: "https://arxiv.org/abs/2005.11401",
    pdfUrl: "https://arxiv.org/pdf/2005.11401",
  },
  {
    id: "chain-of-thought-prompting",
    title: "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models",
    summary: "A foundational prompting paper showing reasoning gains from intermediate steps.",
    arxivUrl: "https://arxiv.org/abs/2201.11903",
    pdfUrl: "https://arxiv.org/pdf/2201.11903",
  },
];

// ------------------------------------------------------------
// EMBEDDING + VECTOR STORE
// ------------------------------------------------------------

mkdirSync(DATA_DIR, { recursive: true });

// Modelo de embedding — transforma texto em vetores numéricos (arrays de floats).
// Textos semanticamente parecidos geram vetores próximos no espaço vetorial.
export const embedder = new ModelRouterEmbeddingModel(EMBEDDING_MODEL);

// Vector store — banco local (SQLite/LibSQL) que armazena os vetores
// e faz busca por similaridade (cosine similarity) de forma eficiente.
export const vectorStore = new LibSQLVector({
  id: "paper-rag-vector",
  url: `file:${join(DATA_DIR, "papers.db")}`,
});

// ------------------------------------------------------------
// TOOL DE BUSCA VETORIAL (RETRIEVAL)
// ------------------------------------------------------------

// O agente chama essa ferramenta para encontrar os chunks mais relevantes
// para a pergunta do usuário — é o "R" (Retrieval) do RAG.
export const searchPapersTool = createVectorQueryTool({
  id: "search-papers",
  description:
    "Search the indexed course papers and return the most relevant chunks with citations.",
  vectorStoreName: "papers",
  indexName: PAPERS_INDEX_NAME,
  model: embedder,
  includeSources: true,
});

// ------------------------------------------------------------
// AGENTE RAG
// ------------------------------------------------------------

const paperResearchAgent = new Agent({
  id: "paper-research-agent",
  name: "Paper Research Agent",
  description: "Responde perguntas sobre alguns artigos de IA usando RAG local.",
  instructions: `
Você ajuda alunos a estudar um pequeno conjunto de artigos de IA.

Sempre utilize a ferramenta search-papers antes de responder.
Baseie a resposta apenas nos trechos de artigos recuperados.
Mantenha a resposta curta e didática.
Todo parágrafo factual deve citar o token de citação exato, como [attention-is-all-you-need#1].
Se os trechos recuperados não forem suficientes, informe que a resposta não está fundamentada nos artigos indexados.

A ferramenta de busca retorna objetos de metadados com:
- text
- citation
- paperTitle
- paperUrl

${LIBSQL_PROMPT}
`,
  model: CHAT_MODEL,
  tools: {
    searchPapers: searchPapersTool,
  },
});

// ------------------------------------------------------------
// INSTÂNCIA MASTRA
// ------------------------------------------------------------

// Registra agentes e vector stores.
// O nome "papers" no vectors precisa bater com o vectorStoreName da tool acima.
export const mastra = new Mastra({
  agents: { paperResearchAgent },
  vectors: { papers: vectorStore },
});
