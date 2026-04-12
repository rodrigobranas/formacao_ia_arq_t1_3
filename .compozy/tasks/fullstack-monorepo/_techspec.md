# Fullstack Monorepo Base Architecture — Technical Specification

## Executive Summary

This TechSpec defines the implementation of a fullstack TypeScript monorepo skeleton for educational use. The architecture uses a flat npm workspaces layout with two workspaces — `frontend/` (React + Vite + Tailwind CSS + shadcn/ui + Vitest) and `backend/` (Express + tsx + pg-promise + Jest) — orchestrated by a root-level Makefile. PostgreSQL runs via Docker Compose with an auto-executed SQL init script for schema setup.

The primary technical trade-off is simplicity over scalability: we avoid shared packages, migration tooling, and build orchestration tools (Turborepo, Nx) to minimize cognitive load for beginner students. This means type duplication between workspaces and manual schema management, but students get a project they can fully understand from day one.

## System Architecture

### Component Overview

```
project-root/
├── Makefile                  # Primary command interface
├── docker-compose.yml        # PostgreSQL container
├── database/
│   └── init.sql              # Schema executed on first container start
├── package.json              # Workspaces declaration only (no scripts)
├── frontend/                 # React workspace
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── App.test.tsx
│       └── index.css
└── backend/                  # Express workspace
    ├── package.json
    ├── tsconfig.json
    ├── jest.config.ts
    ├── .env.example
    └── src/
        ├── index.ts          # Server entry point
        ├── database.ts       # pg-promise connection
        └── health.test.ts    # Smoke test via supertest
```

**Data flow:**

1. Student browser → Vite dev server (localhost:5173) → serves React SPA
2. React SPA → Express API (localhost:3000) → CORS enabled for Vite origin
3. Express → PostgreSQL (localhost:5432 via Docker) → pg-promise connection

No external service integrations. Everything runs locally.

## Implementation Design

### Core Interfaces

Backend Express application entry point and database connection:

```typescript
// backend/src/database.ts
import pgPromise from "pg-promise";

const pgp = pgPromise();

export const db = pgp({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? "app",
  user: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
});
```

```typescript
// backend/src/index.ts
import express from "express";
import cors from "cors";
import { db } from "./database";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/health", async (_req, res) => {
  const result = await db.one("SELECT NOW()");
  res.json({ status: "ok", time: result.now });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
```

### Data Models

Minimal schema for the skeleton — a single example table to prove the database works:

```sql
-- database/init.sql
CREATE TABLE IF NOT EXISTS health_check (
  id SERIAL PRIMARY KEY,
  checked_at TIMESTAMP DEFAULT NOW()
);
```

No complex domain entities. The skeleton is intentionally minimal; instructors add domain models as course exercises.

### API Endpoints

| Method | Path      | Description                          | Response                              |
|--------|-----------|--------------------------------------|---------------------------------------|
| GET    | `/health` | Verifies server and DB connectivity  | `{ "status": "ok", "time": "<timestamp>" }` |

Single endpoint. Additional routes are added by students/instructors during the course.

## Integration Points

*Section omitted — no external service integrations. All components run locally.*

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|---------------------|-----------------|
| `package.json` (root) | New | Workspace declaration, no scripts | Create with workspaces field |
| `Makefile` | New | Primary command interface for dev, test, setup | Create with targets: setup, dev, test, db:reset |
| `docker-compose.yml` | New | PostgreSQL 16 container with volume mount | Create with init.sql volume mapping |
| `database/init.sql` | New | Initial schema SQL | Create with minimal table |
| `frontend/` workspace | New | Full React + Vite + Tailwind + shadcn/ui setup | Scaffold with Vite, configure Tailwind and shadcn |
| `backend/` workspace | New | Full Express + tsx + pg-promise setup | Create all source files and configuration |

All components are new. No existing code is modified. Risk is low — greenfield implementation.

## Testing Approach

### Unit Tests

**Frontend (Vitest):**
- One smoke test: renders the `App` component and verifies it mounts without errors
- Uses `@testing-library/react` for component rendering
- No mocks required for the skeleton

**Backend (Jest + ts-jest):**
- One smoke test: sends GET `/health` via `supertest` and asserts 200 status
- Database connection is mocked in the test (smoke test validates Express routing, not DB connectivity)
- Uses `supertest` for HTTP assertions

### Integration Tests

*Section omitted — out of scope for the MVP skeleton. The PRD explicitly defers integration and E2E testing to Phase 3.*

## Development Sequencing

### Build Order

1. **Root project setup** — Create root `package.json` with workspaces declaration, `.gitignore`, and `Makefile` skeleton. No dependencies.
2. **Docker Compose + database init** — Create `docker-compose.yml` and `database/init.sql`. Depends on step 1 (project root must exist).
3. **Backend workspace** — Create `backend/` with `package.json`, `tsconfig.json`, `jest.config.ts`, `.env.example`, and all source files (`index.ts`, `database.ts`). Install dependencies: express, cors, pg-promise, tsx, jest, ts-jest, supertest, and their type definitions. Depends on step 1 (workspace must be declared in root) and step 2 (database must be available for manual testing).
4. **Backend smoke test** — Create `health.test.ts` with supertest. Verify `make test` runs Jest successfully. Depends on step 3.
5. **Frontend workspace** — Scaffold with `npm create vite@latest`, add Tailwind CSS, initialize shadcn/ui, configure Vitest. Create minimal `App.tsx` landing page. Depends on step 1 (workspace must be declared in root).
6. **Frontend smoke test** — Create `App.test.tsx` with @testing-library/react. Verify Vitest runs successfully. Depends on step 5.
7. **Makefile finalization** — Complete all Makefile targets (`setup`, `dev`, `test`, `db:reset`) and verify end-to-end workflow. Depends on steps 3, 4, 5, 6.

### Technical Dependencies

- **Docker** must be installed on the development machine (prerequisite documented in README)
- **Node.js >= 18** and **npm >= 9** required for npm workspaces support
- **Make** must be available (native on macOS/Linux, requires WSL or equivalent on Windows)

## Monitoring and Observability

*Section omitted — not applicable for a local development skeleton. No production deployment is in scope.*

## Technical Considerations

### Key Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Makefile as primary CLI | Explicit, readable targets; no npm script orchestration dependency | Not native on Windows; students need brief intro |
| tsx watch for backend dev | Fast esbuild-based restarts, single tool for execute + watch | Students don't see explicit tsc compilation step |
| SQL init via Docker volume | Zero-step schema setup, students see raw SQL | Schema changes require volume recreation |
| cors middleware over Vite proxy | Direct, explicit CORS configuration; students learn the real mechanism | Extra dependency; CORS concept may need explanation |
| Vitest for frontend, Jest for backend | Each test runner is the idiomatic choice for its ecosystem | Two test runners to learn instead of one |

### Known Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Windows students without Make/WSL | Medium | Document WSL setup as prerequisite; consider a fallback `npm run` alternative in README |
| shadcn/ui init process changes between versions | Low | Pin `shadcn` CLI version; document exact init commands used |
| Docker Compose V1 vs V2 command differences | Low | Use `docker compose` (V2) syntax; note in README |
| pg-promise connection fails if Docker not started | High (user error) | Health endpoint returns clear error; Makefile `setup` target starts Docker first |

## Architecture Decision Records

- [ADR-001: Flat Monorepo Structure](adrs/adr-001.md) — Chose flat `frontend/` + `backend/` layout over `apps/` + `packages/` for beginner comprehension
- [ADR-002: Makefile as Primary Command Interface](adrs/adr-002.md) — Makefile replaces root npm scripts for explicit, readable orchestration
- [ADR-003: tsx for Backend Development Runtime](adrs/adr-003.md) — esbuild-based tsx with watch mode over tsc+nodemon for faster dev restarts
- [ADR-004: SQL Init Script via Docker Compose Volume](adrs/adr-004.md) — Auto-executed init.sql over programmatic schema setup for simplicity and separation of concerns
