# Backend — Mastra RAG (papers)

CLI em terminal que indexa alguns papers de IA com **Firecrawl**, gera embeddings com **OpenAI** e guarda vetores em **LibSQL** local. Um agente **Mastra** responde perguntas só com base no que foi indexado.

## Pré-requisitos

- [Bun](https://bun.sh) (versão compatível com a do monorepo; ver `package.json` na raiz)
- Chave **OpenAI** (chat + embeddings)
- Chave **Firecrawl** (scrape dos PDFs em markdown)

## Configuração

Na pasta deste pacote:

```bash
cp .env.example .env
```

Preencha no `.env`:

| Variável            | Uso                                    |
| ------------------- | -------------------------------------- |
| `OPENAI_API_KEY`    | Embeddings e resposta do agente        |
| `FIRECRAWL_API_KEY` | Download/conversão dos papers (ingest) |

`ingest` e `ask` exigem `OPENAI_API_KEY`. `ingest` também exige `FIRECRAWL_API_KEY`.

## Como executar

### A partir da raiz do monorepo

```bash
bun run papers   # lista os papers de exemplo
bun run ingest   # baixa, chunka, embeda e grava o índice local
bun run ask -- "Sua pergunta sobre os papers indexados"
```

### A partir de `packages/backend`

```bash
bun run papers
bun run ingest
bun run ask -- "Sua pergunta sobre os papers indexados"
```

O `--` separa flags do Bun dos argumentos do CLI.

## Fluxo recomendado

1. **`papers`** — Confira quais arquivos entram no índice.
2. **`ingest`** — Gera/atualiza o índice vetorial (pode levar alguns minutos e consome API Firecrawl + OpenAI).
3. **`ask`** — Faça perguntas; o agente usa a ferramenta de busca vetorial antes de responder.

Os dados ficam em **`.data/papers.db`** (criado automaticamente neste diretório ao rodar o projeto).

## Scripts do pacote

| Script              | Descrição                                             |
| ------------------- | ----------------------------------------------------- |
| `bun run cli`       | Entrada do CLI (subcomandos abaixo)                   |
| `bun run papers`    | Lista os papers de exemplo                            |
| `bun run ingest`    | Constrói o índice RAG local                           |
| `bun run ask`       | Pergunta ao agente (requer índice; rode ingest antes) |
| `bun run dev`       | `bun --watch` no comando `papers` (desenvolvimento)   |
| `bun run build`     | Gera `dist/cli.js` para execução com `bun run start`  |
| `bun run typecheck` | Verificação TypeScript                                |
| `bun run test`      | Vitest (se houver testes configurados)                |

## Onde está o código

| Arquivo                | Conteúdo principal                                                |
| ---------------------- | ----------------------------------------------------------------- |
| `src/cli.ts`           | Comandos `papers`, `ingest`, `ask` (citty)                        |
| `src/mastra.ts`        | Papers de exemplo, LibSQL, embedder, tool de busca, agente Mastra |
| `src/utils/ingest.ts`  | Pipeline de ingestão (Firecrawl, chunking, embeddings, índice)    |
| `src/utils/ask.ts`     | Pergunta-resposta RAG, formatação de fontes da busca              |
| `src/utils/rag-env.ts` | `requireEnv` compartilhado entre ingest e ask                     |

## Problemas comuns

- **`No paper index found yet. Run ingest first`** — Rode `bun run ingest` depois de configurar o `.env`.
- **Erro de variável de ambiente** — Confira se o `.env` está em `packages/backend/` e se as chaves estão preenchidas.
- **Firecrawl / rate limit** — Ingest pode falhar por limite da API; tente de novo mais tarde.
