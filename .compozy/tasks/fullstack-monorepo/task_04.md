---
status: completed
title: "Frontend workspace (Vite + React + Tailwind + shadcn/ui + Vitest test)"
type: frontend
complexity: high
dependencies: ["task_01"]
---

# Frontend workspace (Vite + React + Tailwind + shadcn/ui + Vitest test)

## Overview

Create the frontend workspace with a Vite-powered React application in TypeScript, styled with Tailwind CSS and shadcn/ui initialized for component usage. Vitest is configured with @testing-library/react for unit testing. A minimal landing page confirms the setup works, and a smoke test verifies the App component mounts correctly.

<critical>
- Read the PRD and TechSpec before implementing
- Reference TechSpec "System Architecture" for frontend file structure
- Focus on WHAT needs to be built, not HOW
- Minimize code — a single landing page, no routing or state management
- Tests required — Vitest smoke test with @testing-library/react is mandatory
</critical>

<requirements>
1. Frontend MUST be scaffolded as a Vite + React + TypeScript project.
2. `frontend/package.json` MUST include a `"dev"` script for Vite dev server (port 5173).
3. `frontend/package.json` MUST include a `"test"` script using `vitest`.
4. Tailwind CSS MUST be configured with `tailwind.config.js` and `postcss.config.js`.
5. `src/index.css` MUST include Tailwind directives (`@tailwind base`, `@tailwind components`, `@tailwind utilities`).
6. shadcn/ui MUST be initialized and ready for component usage.
7. `src/App.tsx` MUST render a minimal landing page confirming the frontend setup works (heading + brief text).
8. `src/App.test.tsx` MUST verify the App component renders without errors using `@testing-library/react` and Vitest.
9. Vitest MUST be configured in `vite.config.ts` with jsdom environment for DOM testing.
10. `src/main.tsx` MUST be the application entry point rendering App into `index.html`.
</requirements>

## Subtasks

- [x] Scaffold Vite + React + TypeScript project in `frontend/` with package.json and config files
- [x] Configure Tailwind CSS with PostCSS and add directives to index.css
- [x] Initialize shadcn/ui for component usage
- [x] Create minimal `App.tsx` landing page and `main.tsx` entry point
- [x] Configure Vitest in vite.config.ts with jsdom and @testing-library/react
- [x] Create `App.test.tsx` smoke test verifying component mounts
- [x] Run `npm install` from root and verify Vitest test passes

## Implementation Details

Files to create:
- `frontend/package.json` — workspace package with Vite, React, Tailwind, Vitest dependencies
- `frontend/tsconfig.json` — TypeScript configuration for React/JSX
- `frontend/vite.config.ts` — Vite configuration with Vitest test settings
- `frontend/tailwind.config.js` — Tailwind CSS configuration
- `frontend/postcss.config.js` — PostCSS with Tailwind plugin
- `frontend/index.html` — HTML entry point with root div
- `frontend/src/main.tsx` — React DOM render entry
- `frontend/src/App.tsx` — minimal landing page component
- `frontend/src/App.test.tsx` — Vitest smoke test
- `frontend/src/index.css` — Tailwind directives and base styles

Reference TechSpec "Component Overview" for the exact file structure. Reference TechSpec "Testing Approach" for frontend test strategy (@testing-library/react, no mocks needed).

### Relevant Files

- No existing frontend files — greenfield workspace.

### Dependent Files

- `backend/src/index.ts` (task_03) — CORS origin is set to `http://localhost:5173` matching Vite dev server
- `Makefile` (task_05) — `dev` and `test` targets will invoke frontend scripts

### Related ADRs

- [ADR-001: Flat Monorepo Structure](adrs/adr-001.md) — self-contained workspace in `frontend/`

## Deliverables

- [x] `frontend/` workspace with all configuration files
- [x] Vite dev server starts and serves React app on port 5173
- [x] Tailwind CSS styles apply correctly
- [x] shadcn/ui initialized and ready for use
- [x] Minimal landing page renders in browser
- [x] Vitest smoke test passing
- [x] Test coverage >= 80% for App component

## Tests

### Unit Tests

- App component renders without throwing errors.
- App component renders expected heading text on the landing page.

### Integration Tests

- `npm test --workspace=frontend` executes Vitest and all tests pass.
- `npm run dev --workspace=frontend` starts Vite dev server on port 5173 (manual verification).

## Success Criteria

- `npm install` from root provisions frontend dependencies
- `npm test --workspace=frontend` runs Vitest and all tests pass
- `npm run dev --workspace=frontend` starts Vite dev server on port 5173
- Browser shows the minimal landing page with Tailwind styles applied
- shadcn/ui is initialized and components can be added
- All tests passing
- Test coverage >= 80%
