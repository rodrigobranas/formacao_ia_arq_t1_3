# Fullstack Monorepo Base Architecture

## Overview

A minimal, well-structured base architecture for a fullstack TypeScript monorepo designed for educational use. It provides beginner developers with a clear starting point that includes a React frontend (Vite, Tailwind CSS, shadcn/ui, Vitest) and a Node.js backend (Express, PostgreSQL via pg-promise, Jest). Managed through npm workspaces, the project solves the problem of students struggling to set up and understand modern fullstack project structure by providing a ready-to-use skeleton where all tooling is preconfigured and each piece has a clear purpose. A Docker Compose file provides a PostgreSQL instance so students don't need to install the database locally.

## Goals

- Provide a working monorepo skeleton that students can clone and run within minutes
- Teach modern fullstack project organization using industry-standard tools
- Ensure every configuration file and folder has a clear, understandable purpose
- Enable students to focus on writing application code rather than fighting tooling setup
- Eliminate database setup friction by providing PostgreSQL via Docker Compose
- Serve as the foundation for hands-on course exercises where features are built incrementally

## User Stories

**As a beginner developer (student):**
- I want to clone the repo and run both frontend and backend with a single command so that I can start coding immediately
- I want to start PostgreSQL with a single Docker command so that I don't need to install and configure the database manually
- I want to see a working health-check endpoint on the backend so that I know the server and database connection work
- I want to see a minimal React page on the frontend so that I know the UI tooling is configured correctly
- I want to run frontend tests with Vitest and backend tests with Jest so that I can validate my code as I learn

**As a course instructor:**
- I want a clean, minimal starting point so that I can introduce concepts one at a time without students being overwhelmed by existing code
- I want consistent tooling (TypeScript across both workspaces, dedicated test runners per workspace) so that students develop good habits from the start
- I want the project structure to be self-explanatory so that I spend less time explaining setup and more time teaching patterns
- I want database setup to be a non-issue so that all students have the same working environment regardless of their OS

## Core Features

### 1. npm Workspaces Monorepo Root
Root-level configuration that ties together frontend and backend as workspaces. Students see how a single `npm install` at the root provisions both projects. Root-level scripts provide convenience commands to run, build, or test the entire project.

### 2. React Frontend Workspace (frontend/)
A Vite-powered React application with TypeScript, Tailwind CSS for styling, and shadcn/ui initialized for component usage. Vitest is configured for unit testing. Includes a minimal landing page confirming the setup works.

### 3. Express Backend Workspace (backend/)
A Node.js Express server with TypeScript, connected to PostgreSQL via pg-promise. Includes a `/health` endpoint that verifies both server and database connectivity. Jest is configured with ts-jest for unit testing. Configured with tsx for development with hot-reload.

### 4. Docker Compose with PostgreSQL
A `docker-compose.yml` at the project root that provisions a PostgreSQL container with preconfigured credentials matching the backend's default `.env` values. Students run `docker compose up -d` and the database is ready — no local PostgreSQL installation required.

### 5. Development Experience
Concurrent development mode: a root-level script starts both frontend dev server and backend dev server simultaneously. Root-level `npm test` runs Vitest in the frontend and Jest in the backend. Students experience the full development loop (edit, save, see changes, test) from day one.

## User Experience

**First contact (clone & setup):**
1. Student clones the repository
2. Runs `npm install` at the root — all dependencies for both workspaces are installed
3. Runs `docker compose up -d` — PostgreSQL starts in a container
4. Copies `.env.example` to `.env` in the backend (default values work with the Docker Compose setup)
5. Runs `npm run dev` — both frontend and backend start concurrently
6. Opens the browser and sees the frontend; backend health-check responds at its URL

**Daily development loop:**
1. Student opens the project in their editor
2. Runs `docker compose up -d` (if not already running)
3. Navigates to `frontend/src/` or `backend/src/` depending on the exercise
4. Writes code, sees hot-reload in the browser or server restart
5. Runs `npm test` to validate their work (Vitest for frontend, Jest for backend)

**Key UX considerations:**
- Folder names (`frontend/`, `backend/`) are self-descriptive — no ambiguity
- Minimal number of configuration files to reduce overwhelm
- Each config file should be as short as possible while remaining functional
- Docker Compose credentials match `.env.example` defaults — zero configuration needed for the happy path

## Non-Goals (Out of Scope)

- Authentication or authorization system
- CI/CD pipelines or cloud deployment configuration
- Shared type packages between frontend and backend
- Database migration tooling
- Production optimization (compression, caching, CDN)
- State management libraries (Redux, Zustand, etc.)
- API client generation or OpenAPI specs
- Monorepo task orchestration tools (Turborepo, Nx)
- ESLint/Prettier configuration (can be added by instructor later)
- Dockerizing the frontend or backend applications themselves (only PostgreSQL is containerized)

## Phased Rollout Plan

### MVP (Phase 1) — Base Skeleton
- Root `package.json` with npm workspaces configuration
- `docker-compose.yml` with PostgreSQL container
- `frontend/` workspace: Vite + React + TypeScript + Tailwind CSS + shadcn/ui initialized + Vitest configured with a sample test
- `backend/` workspace: Express + TypeScript + pg-promise configured with a `/health` endpoint + Jest configured with ts-jest and a sample test + `.env.example` with default database credentials
- Root-level `npm run dev` script that starts both workspaces concurrently
- Root-level `npm test` script that runs tests across both workspaces
- Minimal README with setup instructions

**Success criteria:** A student can clone, install, run `docker compose up -d`, run `npm run dev`, and see both frontend and backend working within 5 minutes. Tests pass out of the box.

### Phase 2 — Course Content Layers (Instructor-driven)
- Instructors add CRUD features, forms, validation, and database patterns as course exercises
- Students build on top of the skeleton during the course

### Phase 3 — Advanced Topics (Optional)
- Shared types package introduction
- Testing patterns (integration tests, E2E)
- Deployment and DevOps basics

## Success Metrics

- **Setup time:** Students can go from clone to running project in under 5 minutes (with Docker installed)
- **Comprehension:** Students can explain the purpose of each top-level folder and configuration file after their first session
- **Test confidence:** All sample tests pass on a fresh clone after `npm install`
- **Stability:** Zero configuration errors when following setup instructions on macOS, Linux, and Windows
- **Adoption:** Instructors can use it as-is without needing to modify the base structure

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Docker may not be installed on student machines | Document Docker Desktop installation as a prerequisite; provide fallback instructions for local PostgreSQL installation |
| npm workspaces behavior can be confusing (hoisted dependencies, symlinks) | Keep workspace configuration minimal; document common gotchas |
| shadcn/ui initialization may change across versions | Pin versions in package.json; document the exact initialization steps used |
| Students on Windows may face path or script compatibility issues | Test setup instructions on all major platforms; use cross-platform npm scripts |
| Two different test runners (Vitest + Jest) may confuse beginners | Document clearly which runner belongs to which workspace and why each was chosen |

## Architecture Decision Records

- [ADR-001: Flat Monorepo Structure](adrs/adr-001.md) — Chose flat `frontend/` + `backend/` layout over `apps/` + `packages/` for simplicity, prioritizing beginner comprehension over shared-code patterns.

## Open Questions

- Should a `.env.example` file be provided at root level in addition to the backend workspace?
- What Node.js and npm version requirements should be documented?
- Should Docker Compose also include a pgAdmin or similar database GUI for students?
