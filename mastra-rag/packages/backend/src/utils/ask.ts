import {
  mastra,
  PAPERS_INDEX_NAME,
  searchPapersTool,
  type SearchResult,
  type SearchSource,
  vectorStore,
} from "../mastra.js";
import { requireEnv } from "./rag-env.js";

/** Quantos chunks mais similares à pergunta entram no retrieval (fixo para o exemplo). */
const SEARCH_TOP_K = 4;

// ------------------------------------------------------------
// PRÉ-CONDIÇÕES
// ------------------------------------------------------------

// Pré-condição para RAG: sem ingestão prévia não há vetores para comparar com a pergunta.
async function ensurePapersWereIndexed() {
  const existingIndexes = await vectorStore.listIndexes();

  if (!existingIndexes.includes(PAPERS_INDEX_NAME)) {
    throw new Error("No paper index found yet. Run `bun run ingest` first.");
  }
}

// ------------------------------------------------------------
// FORMATAÇÃO (resultados da busca — CLI)
// ------------------------------------------------------------

// Formata hits da busca vetorial para inspeção: citação, título, score de similaridade e preview do texto.
export function formatSearchSources(results: SearchSource[]) {
  return results
    .map(result => {
      // Fallbacks: metadata pode estar ausente em cenários de teste ou dados antigos.
      const citation = result.metadata?.citation ?? result.id;
      const paperTitle = result.metadata?.paperTitle ?? "Unknown paper";
      const preview = (result.metadata?.text ?? "").slice(0, 260).trim();

      // score costuma ser cosine similarity ou equivalente do backend do vector store.
      return `${citation} ${paperTitle} (score ${result.score.toFixed(3)})\n${preview}`;
    })
    .join("\n\n");
}

// ------------------------------------------------------------
// PERGUNTA-RESPOSTA (o "R-A-G" em ação)
// ------------------------------------------------------------

// 1. Retrieval: busca vetorial encontra os SEARCH_TOP_K chunks mais similares à pergunta
// 2. Augmented: os chunks recuperados são injetados no contexto do agente
// 3. Generation: o LLM gera a resposta baseada apenas nos chunks recuperados
export async function askQuestion(question: string) {
  requireEnv("OPENAI_API_KEY");
  await ensurePapersWereIndexed();

  // Retrieval explícito: executa a mesma tool de busca que o agente usa, para expor `sources` na resposta.
  // queryText é embedado e comparado aos vetores indexados; SEARCH_TOP_K limita quantos chunks voltam.
  const searchResult = (await searchPapersTool.execute?.(
    {
      queryText: question,
      topK: SEARCH_TOP_K,
    },
    { mastra }
  )) as SearchResult | undefined;

  if (!searchResult) {
    throw new Error("The search tool did not return any result.");
  }

  // Generation: o agente é forçado a chamar `searchPapers` (toolChoice + activeTools) para fundamentar a resposta.
  const agent = mastra.getAgentById("paper-research-agent");
  const answer = await agent.generate(question, {
    toolChoice: "required",
    activeTools: ["searchPapers"],
  });

  return {
    answer: answer.text,
    // Fontes vêm do passo de retrieval acima — útil para debug e UI sem depender do texto do agente.
    sources: searchResult.sources,
  };
}
