globalThis.AI_SDK_LOG_WARNINGS = false;

import { defineCommand, runMain } from "citty";

import { askQuestion, formatSearchSources } from "@/utils/ask";
import { formatPaperList, ingestSamplePapers } from "@/utils/ingest";

// ------------------------------------------------------------
// PAPERS COMMAND
// ------------------------------------------------------------

const papersCommand = defineCommand({
  meta: {
    name: "papers",
    description: "List the sample papers included in the course example.",
  },
  run: async () => {
    console.log("Sample papers:\n");
    console.log(formatPaperList());
  },
});

// ------------------------------------------------------------
// INGEST COMMAND
// ------------------------------------------------------------

const ingestCommand = defineCommand({
  meta: {
    name: "ingest",
    description: "Download the sample papers with Firecrawl and build the local RAG index.",
  },
  run: async () => {
    const result = await ingestSamplePapers();
    console.log(
      `\nIngestion complete.\nIndexed ${result.chunks} chunks from ${result.papers} papers.`
    );
  },
});

// ------------------------------------------------------------
// ASK COMMAND
// ------------------------------------------------------------

const askCommand = defineCommand({
  meta: {
    name: "ask",
    description: "Ask a question about the indexed papers.",
  },
  args: {
    question: {
      type: "positional",
      description: "Question to ask about the papers",
      required: true,
    },
  },
  run: async ({ args }) => {
    const result = await askQuestion(String(args.question));

    console.log("\nAnswer:\n");
    console.log(result.answer);
    console.log("\nRetrieved chunks:\n");
    console.log(formatSearchSources(result.sources));
  },
});

// ------------------------------------------------------------
// MAIN
// ------------------------------------------------------------

const main = defineCommand({
  meta: {
    name: "paper-rag",
    version: "1.0.0",
    description: "Didactic Mastra RAG example for studying a few AI papers from the terminal.",
  },
  subCommands: {
    papers: papersCommand,
    ingest: ingestCommand,
    ask: askCommand,
  },
});

if (import.meta.main) {
  await runMain(main);
}

export { main };
