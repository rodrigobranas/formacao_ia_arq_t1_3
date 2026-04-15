ifneq (,$(wildcard .env))
include .env
export
endif

POSTGRES_CONTAINER ?= mastra-rag-postgres
POSTGRES_USER ?= postgres
POSTGRES_DB ?= mastra-rag

.PHONY: check test lint fmt fmt-check typecheck dev

check:
	bun run format
	bun run lint
	bun run typecheck
	bun run test

test:
	bun run test

lint:
	bun run lint

fmt:
	bun run format

fmt-check:
	bun run format:check

typecheck:
	bun run typecheck

dev:
	bun run dev
