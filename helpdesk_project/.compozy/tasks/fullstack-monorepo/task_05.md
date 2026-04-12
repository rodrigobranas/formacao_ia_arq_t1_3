---
status: completed
title: "Makefile finalization and end-to-end dev experience"
type: infra
complexity: medium
dependencies: ["task_03", "task_04"]
---

# Makefile finalization and end-to-end dev experience

## Overview

Complete the Makefile with fully functional targets that orchestrate both workspaces, replacing the placeholder targets from task_01. This task ensures the end-to-end development experience works as described in the PRD: `make setup` provisions everything, `make dev` starts both servers concurrently, `make test` runs both test suites, and `make db:reset` cleanly resets the database.

<critical>
- Read the PRD and TechSpec before implementing
- Reference TechSpec "Development Sequencing" and PRD "User Experience" sections
- Focus on WHAT needs to be built, not HOW
- Minimize code — Makefile targets should be concise and readable
- Tests required — end-to-end workflow verification
</critical>

<requirements>
1. `make setup` MUST run `npm install` and `docker compose up -d` to provision the full environment.
2. `make dev` MUST start both frontend (Vite) and backend (tsx watch) dev servers concurrently.
3. `make test` MUST run Vitest in the frontend workspace and Jest in the backend workspace.
4. `make db:reset` MUST tear down Docker volumes and recreate the PostgreSQL container with a fresh schema (`docker compose down -v && docker compose up -d`).
5. Each Makefile target MUST be readable and self-explanatory for beginner students.
6. The Makefile SHOULD include a `.PHONY` declaration for all targets.
7. `make dev` SHOULD use background processes or `&` to run both servers concurrently within a single target.
</requirements>

## Subtasks

- [x] Replace placeholder Makefile targets with fully functional implementations
- [x] Implement `make setup` target (npm install + docker compose up)
- [x] Implement `make dev` target (concurrent frontend + backend dev servers)
- [x] Implement `make test` target (run both test suites)
- [x] Implement `make db:reset` target (docker compose down -v + up)
- [x] Verify complete end-to-end workflow: setup → dev → test → db:reset

## Implementation Details

Files to modify:
- `Makefile` (root) — replace placeholder targets with real implementations

The `dev` target needs to run both servers concurrently. Use `&` to background the first process and `wait` or a trap to clean up. Alternatively, use `npm run dev --workspace=frontend & npm run dev --workspace=backend` pattern.

Reference TechSpec "Development Sequencing" step 7 for the exact targets needed. Reference PRD "User Experience" for the expected developer workflow.

### Relevant Files

- `Makefile` (root) — created in task_01 with placeholder targets
- `frontend/package.json` (task_04) — dev and test scripts to invoke
- `backend/package.json` (task_03) — dev and test scripts to invoke
- `docker-compose.yml` (task_02) — referenced by setup and db:reset targets

### Dependent Files

- None — this is the final integration task.

### Related ADRs

- [ADR-002: Makefile as Primary Command Interface](adrs/adr-002.md) — Makefile replaces root npm scripts for explicit orchestration

## Deliverables

- [x] Fully functional Makefile with all targets implemented
- [x] `make setup` provisions complete environment
- [x] `make dev` starts both servers concurrently
- [x] `make test` runs all test suites and reports results
- [x] `make db:reset` cleanly resets database
- [x] End-to-end workflow verified

## Tests

### Unit Tests

- No unit tests applicable — Makefile orchestration only.

### Integration Tests

- `make setup` installs dependencies and starts Docker without errors.
- `make test` runs both Vitest and Jest, all tests pass.
- `make dev` starts both dev servers (frontend on 5173, backend on 3000).
- `make db:reset` drops and recreates the database with the init schema.
- Full workflow: `make setup` → `make dev` → verify endpoints → `make test` → `make db:reset`.

## Success Criteria

- All Makefile targets execute successfully
- Students can go from clone to running project with: `make setup` then `make dev`
- `make test` reports all tests passing across both workspaces
- `make db:reset` cleanly resets PostgreSQL with fresh schema
- All tests passing
- Test coverage >= 80% (N/A for Makefile-only task)
