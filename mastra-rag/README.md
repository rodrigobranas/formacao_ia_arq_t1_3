# Mastra RAG CLI Example

Small, course-friendly example showing how to build a RAG flow with:

- `Mastra` agents
- `Firecrawl` for paper ingestion
- `citty` for the terminal interface
- `OpenAI` for chat and embeddings

## What this example does

1. Lists a fixed set of AI papers from arXiv.
2. Downloads those papers through Firecrawl.
3. Chunks and embeds the content locally.
4. Saves vectors in a local LibSQL database at `packages/backend/.data/papers.db`.
5. Answers questions about the indexed papers from the terminal.

## Setup

Copy the example env file and fill in your keys:

```bash
cp packages/backend/.env.example packages/backend/.env
```

Required variables:

- `OPENAI_API_KEY`
- `FIRECRAWL_API_KEY`

## Commands

List the papers:

```bash
bun run papers
```

Build the local index:

```bash
bun run ingest
```

Ask a question:

```bash
bun run ask -- "What does the RAG paper say about mixing retrieval with generation?"
```

## Project shape

- [packages/backend/src/cli.ts](packages/backend/src/cli.ts)
- [packages/backend/src/rag.ts](packages/backend/src/rag.ts)
- [packages/backend/src/rag.test.ts](packages/backend/src/rag.test.ts)

Most of the lesson now lives in `rag.ts` so the RAG flow is easy to follow in one place:

1. Firecrawl downloads the papers
2. `MDocument` chunks the markdown
3. `LibSQLVector` stores embeddings locally
4. `createVectorQueryTool()` powers retrieval for the agent
