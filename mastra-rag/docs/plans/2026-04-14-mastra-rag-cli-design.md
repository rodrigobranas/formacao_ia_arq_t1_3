# Mastra RAG CLI Design

## Goal

Create a didactic example for an online course showing how to:

1. fetch a few arXiv AI papers with Firecrawl,
2. ingest them into a local RAG knowledge base,
3. ask questions about those papers from the terminal with `citty`,
4. answer with short citations.

## Accepted decisions

- Use `OpenAI` as the default provider.
- Remove `packages/frontend`.
- Keep the example backend-only and intentionally small.
- Optimize for readability over abstraction.

## Recommended shape

Keep a single package in `packages/backend` with these responsibilities:

- `src/cli.ts`: top-level CLI with subcommands.
- `src/commands/ingest.ts`: fetch + parse + chunk + embed + store.
- `src/commands/ask.ts`: run the Mastra agent against the local knowledge base.
- `src/mastra/agent.ts`: one teaching-focused agent definition.
- `src/lib/`: tiny wrappers for Firecrawl, storage, chunking, retrieval, and formatting.
- `src/data/papers.ts`: fixed list of sample arXiv papers.

## User flow

1. Configure `.env` with `OPENAI_API_KEY` and `FIRECRAWL_API_KEY`.
2. Run `bun run cli ingest`.
3. Run `bun run cli ask "What do the papers say about ...?"`.
4. Receive a concise answer plus cited paper chunks.

## Storage strategy

Use a local SQLite/LibSQL-backed vector store so the example stays self-contained and repeatable.

## Teaching goals

- Show the full RAG pipeline explicitly.
- Keep each file small and named after its role.
- Avoid unnecessary web/API layers.
- Prefer fixed paper inputs over dynamic discovery.
