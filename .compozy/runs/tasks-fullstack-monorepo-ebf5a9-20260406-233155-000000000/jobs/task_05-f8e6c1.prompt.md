# Implementation Task: task_05.md

## Task Context

- **Title**: Makefile finalization and end-to-end dev experience
- **Type**: infra
- **Complexity**: medium
- **Dependencies**: task_03, task_04


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
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/fullstack-monorepo/memory/task_05.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
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

- [ ] Replace placeholder Makefile targets with fully functional implementations
- [ ] Implement `make setup` target (npm install + docker compose up)
- [ ] Implement `make dev` target (concurrent frontend + backend dev servers)
- [ ] Implement `make test` target (run both test suites)
- [ ] Implement `make db:reset` target (docker compose down -v + up)
- [ ] Verify complete end-to-end workflow: setup → dev → test → db:reset

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

- [ ] Fully functional Makefile with all targets implemented
- [ ] `make setup` provisions complete environment
- [ ] `make dev` starts both servers concurrently
- [ ] `make test` runs all test suites and reports results
- [ ] `make db:reset` cleanly resets database
- [ ] End-to-end workflow verified

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


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/fullstack-monorepo`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/fullstack-monorepo/task_05.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/fullstack-monorepo/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
