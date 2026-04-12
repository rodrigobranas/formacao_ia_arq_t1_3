# Implementation Task: task_01.md

## Task Context

- **Title**: Root project setup (package.json, .gitignore, Makefile skeleton)
- **Type**: infra
- **Complexity**: low


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
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/fullstack-monorepo/memory/task_01.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
title: "Root project setup (package.json, .gitignore, Makefile skeleton)"
type: infra
complexity: low
dependencies: []
---

# Root project setup (package.json, .gitignore, Makefile skeleton)

## Overview

Create the root-level project files that establish the npm workspaces monorepo structure. This task sets the foundation for all subsequent workspaces by declaring the workspace layout, providing a `.gitignore`, and scaffolding the Makefile that will serve as the primary command interface (per ADR-002).

<critical>
- Read the PRD and TechSpec before implementing
- Reference TechSpec "System Architecture" and "Implementation Design" sections for structure
- Focus on WHAT needs to be built, not HOW
- Minimize code — this is a skeleton, not a feature-rich application
- Tests required for every task (this task has no testable logic; validation is structural)
</critical>

<requirements>
1. Root `package.json` MUST declare `workspaces: ["frontend", "backend"]` and MUST NOT contain any scripts (per ADR-002).
2. Root `package.json` MUST set `"private": true` to prevent accidental publishing.
3. `.gitignore` MUST cover: `node_modules/`, `dist/`, `.env`, Docker volumes, and OS files.
4. `Makefile` MUST contain placeholder targets for `setup`, `dev`, `test`, and `db:reset`.
5. No dependencies SHOULD be declared in the root `package.json`.
</requirements>

## Subtasks

- [ ] Create root `package.json` with workspaces declaration and private flag
- [ ] Create `.gitignore` with standard Node.js, TypeScript, Docker, and OS exclusions
- [ ] Create `Makefile` with placeholder targets (`setup`, `dev`, `test`, `db:reset`) containing echo statements
- [ ] Verify `npm install` runs without errors at root level

## Implementation Details

Files to create:
- `package.json` (root) — workspaces declaration only
- `.gitignore` — standard exclusions
- `Makefile` — skeleton with placeholder targets

Integration points: None — this is the foundation task.

Reference TechSpec "Component Overview" for the project root structure and ADR-002 for the Makefile decision.

### Relevant Files

- No existing files — greenfield project root.

### Dependent Files

- `frontend/package.json` (task_04) — will be recognized as a workspace
- `backend/package.json` (task_03) — will be recognized as a workspace
- `Makefile` (task_05) — skeleton targets will be completed

### Related ADRs

- [ADR-001: Flat Monorepo Structure](adrs/adr-001.md) — defines the `frontend/` + `backend/` workspace layout
- [ADR-002: Makefile as Primary Command Interface](adrs/adr-002.md) — Makefile replaces root npm scripts

## Deliverables

- [ ] Root `package.json` with correct workspaces configuration
- [ ] `.gitignore` covering all relevant patterns
- [ ] `Makefile` with skeleton targets
- [ ] `npm install` completes successfully at the root

## Tests

### Unit Tests

- No unit tests applicable — this task produces configuration files only.

### Integration Tests

- Verify `npm install` exits with code 0 at the project root.
- Verify `make` prints help or placeholder messages without errors.

## Success Criteria

- Root `package.json` correctly declares both workspaces
- `.gitignore` prevents committing node_modules, dist, .env, and OS artifacts
- `make setup`, `make dev`, `make test`, `make db:reset` all execute without errors (placeholder output)
- All tests passing
- Test coverage >= 80% (N/A for config-only task)


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/fullstack-monorepo`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/fullstack-monorepo/task_01.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/fullstack-monorepo/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
