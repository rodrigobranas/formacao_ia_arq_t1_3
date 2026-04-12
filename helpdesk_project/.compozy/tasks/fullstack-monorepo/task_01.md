---
status: completed
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

- [x] Create root `package.json` with workspaces declaration and private flag
- [x] Create `.gitignore` with standard Node.js, TypeScript, Docker, and OS exclusions
- [x] Create `Makefile` with placeholder targets (`setup`, `dev`, `test`, `db:reset`) containing echo statements
- [x] Verify `npm install` runs without errors at root level

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

- [x] Root `package.json` with correct workspaces configuration
- [x] `.gitignore` covering all relevant patterns
- [x] `Makefile` with skeleton targets
- [x] `npm install` completes successfully at the root

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
