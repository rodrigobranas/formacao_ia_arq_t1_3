# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State

- Task 01 established the monorepo root with `package.json`, `.gitignore`, `Makefile`, and generated a root `package-lock.json` from a successful `npm install`.

## Shared Decisions

- The root `package.json` follows ADR-002 and contains only `private` plus `workspaces`; root scripts remain excluded in favor of Make targets.
- The required `db:reset` Make target must be declared as `db\\:reset` in the Makefile source to stay compatible with GNU Make 3.81 while still being invoked as `make db:reset`.

## Shared Learnings

## Open Risks

## Handoffs
