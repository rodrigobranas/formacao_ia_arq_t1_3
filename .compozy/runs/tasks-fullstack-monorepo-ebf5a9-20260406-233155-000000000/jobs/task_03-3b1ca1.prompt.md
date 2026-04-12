# Implementation Task: task_03.md

## Task Context

- **Title**: Backend workspace (Express + TypeScript + pg-promise + Jest test)
- **Type**: backend
- **Complexity**: high
- **Dependencies**: task_01, task_02


<required_skills>
- `cy-workflow-memory`: required when workflow memory paths are provided for this task
- `cy-execute-task`: required end-to-end workflow for a PRD task
- `cy-final-verify`: required before any completion claim or automatic commit
</required_skills>

<critical>
- Use installed `cy-workflow-memory` before editing code when workflow memory paths are provided below.
- Use installed `cy-execute-task` as the execution workflow for this task.
- Read `AGENTS.md`, `CLAUDE.md`, and the PRD documents under `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/fullstack-monorepo` before editing code.
- Treat the task specification below plus the supporting PRD documents, especially `_techspec.md` and `_tasks.md`, as the source of truth.
- Keep scope tight to this task and record meaningful follow-up work instead of expanding scope silently.
- Use installed `cy-final-verify` before any completion claim or automatic commit.
- Automatic commits are disabled for this run (`--auto-commit=false`).
</critical>

## Workflow Memory

- Memory directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/fullstack-monorepo/memory`
- Shared workflow memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/fullstack-monorepo/memory/MEMORY.md`
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/fullstack-monorepo/memory/task_03.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
title: "Backend workspace (Express + TypeScript + pg-promise + Jest test)"
type: backend
complexity: high
dependencies: ["task_01", "task_02"]
---

# Backend workspace (Express + TypeScript + pg-promise + Jest test)

## Overview

Create the backend workspace with a fully configured Express server in TypeScript, connected to PostgreSQL via pg-promise. This workspace includes a `/health` endpoint that verifies server and database connectivity, a development workflow using tsx with watch mode (per ADR-003), and a Jest smoke test using supertest with a mocked database connection.

<critical>
- Read the PRD and TechSpec before implementing
- Reference TechSpec "Core Interfaces" and "API Endpoints" sections for exact implementation
- Focus on WHAT needs to be built, not HOW
- Minimize code — only the health endpoint, no additional routes
- Tests required — Jest smoke test with supertest is mandatory
</critical>

<requirements>
1. `backend/package.json` MUST declare dependencies: `express`, `cors`, `pg-promise`, `dotenv` and dev dependencies: `tsx`, `jest`, `ts-jest`, `supertest`, `@types/express`, `@types/cors`, `@types/supertest`, `typescript`.
2. `backend/package.json` MUST include a `"dev"` script using `tsx watch src/index.ts` (per ADR-003).
3. `backend/package.json` MUST include a `"test"` script using `jest`.
4. `backend/tsconfig.json` MUST target ES2020+ with strict mode enabled.
5. `backend/src/database.ts` MUST export a pg-promise connection using environment variables with defaults matching Docker Compose credentials (host=localhost, port=5432, database=app, user=postgres, password=postgres).
6. `backend/src/index.ts` MUST create an Express server on port 3000 (configurable via PORT env var) with CORS enabled for `http://localhost:5173`.
7. `backend/src/index.ts` MUST expose a `GET /health` endpoint that queries the database with `SELECT NOW()` and returns `{ "status": "ok", "time": "<timestamp>" }`.
8. `backend/.env.example` MUST contain all database environment variables with default values.
9. `backend/src/health.test.ts` MUST test GET `/health` returns 200 status using supertest with the database connection mocked.
10. `jest.config.ts` MUST use `ts-jest` preset for TypeScript support.
</requirements>

## Subtasks

- [ ] Create `backend/package.json` with all dependencies and scripts (dev, test)
- [ ] Create `backend/tsconfig.json` and `backend/jest.config.ts` configuration files
- [ ] Create `backend/src/database.ts` with pg-promise connection using env vars with defaults
- [ ] Create `backend/src/index.ts` with Express server, CORS, JSON middleware, and `/health` endpoint
- [ ] Create `backend/.env.example` with database connection variables
- [ ] Create `backend/src/health.test.ts` with supertest smoke test (mocked DB)
- [ ] Run `npm install` from root and verify Jest test passes

## Implementation Details

Files to create:
- `backend/package.json` — workspace package with dependencies and scripts
- `backend/tsconfig.json` — TypeScript configuration for Node.js
- `backend/jest.config.ts` — Jest with ts-jest preset
- `backend/.env.example` — environment variable template
- `backend/src/index.ts` — Express server entry point with health endpoint
- `backend/src/database.ts` — pg-promise database connection
- `backend/src/health.test.ts` — supertest smoke test

Reference TechSpec "Core Interfaces" section for exact code patterns for `database.ts` and `index.ts`. Reference TechSpec "Testing Approach" for the test strategy (mock DB, test Express routing).

### Relevant Files

- `docker-compose.yml` (task_02) — PostgreSQL credentials must match database.ts defaults
- `database/init.sql` (task_02) — schema that the health endpoint queries against

### Dependent Files

- `Makefile` (task_05) — `dev` and `test` targets will invoke backend scripts
- `frontend/` (task_04) — CORS origin must match frontend dev server port (5173)

### Related ADRs

- [ADR-003: tsx for Backend Development Runtime](adrs/adr-003.md) — tsx watch for dev script
- [ADR-001: Flat Monorepo Structure](adrs/adr-001.md) — self-contained workspace in `backend/`

## Deliverables

- [ ] `backend/` workspace with all configuration files
- [ ] Express server with `/health` endpoint returning JSON with DB timestamp
- [ ] pg-promise database connection with env-var-based configuration
- [ ] `.env.example` with documented defaults
- [ ] Jest smoke test passing with mocked database
- [ ] Test coverage >= 80% for health endpoint logic

## Tests

### Unit Tests

- GET `/health` with mocked database returns HTTP 200 with `{ "status": "ok", "time": "<timestamp>" }`.
- GET `/health` with failing database mock returns an appropriate error response.

### Integration Tests

- `npm test --workspace=backend` executes Jest and all tests pass.
- Backend starts with `npx tsx src/index.ts` without errors (manual verification with Docker running).

## Success Criteria

- `npm install` from root provisions backend dependencies
- `npm test --workspace=backend` runs Jest and all tests pass
- `npx tsx watch backend/src/index.ts` starts the server on port 3000
- GET `http://localhost:3000/health` returns 200 with status and time (when Docker DB is running)
- All tests passing
- Test coverage >= 80%


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/fullstack-monorepo`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/fullstack-monorepo/task_03.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/fullstack-monorepo/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
