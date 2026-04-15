# Mastra RAG CLI Implementation Plan

1. Install `@mastra/*`, `openai` provider support, Firecrawl SDK, `citty`, and any minimal local storage packages needed for a didactic RAG example.
2. Simplify the workspace to backend-only and update root/package scripts for CLI development and verification.
3. Replace the current backend HTTP-oriented structure with a small CLI-oriented structure.
4. Implement paper ingestion from a fixed arXiv list using Firecrawl, chunking, embeddings, and local persistence.
5. Implement a Mastra agent wired to the local retrieval tool and expose it via `citty`.
6. Add minimal tests around the non-network pieces and document the commands in README or package scripts.
7. Run `make check`, fix all issues, and only then report completion.
