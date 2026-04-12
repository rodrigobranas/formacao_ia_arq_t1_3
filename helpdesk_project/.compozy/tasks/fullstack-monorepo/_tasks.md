# Fullstack Monorepo Base Architecture — Task List

## Tasks

| # | Title | Status | Complexity | Dependencies |
|---|-------|--------|------------|--------------|
| 01 | Root project setup (package.json, .gitignore, Makefile skeleton) | completed | low | — |
| 02 | Docker Compose with PostgreSQL and database init script | completed | low | task_01 |
| 03 | Backend workspace (Express + TypeScript + pg-promise + Jest test) | completed | high | task_01, task_02 |
| 04 | Frontend workspace (Vite + React + Tailwind + shadcn/ui + Vitest test) | completed | high | task_01 |
| 05 | Makefile finalization and end-to-end dev experience | completed | medium | task_03, task_04 |
