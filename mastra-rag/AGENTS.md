# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## HIGH PRIORITY

- **IF YOU DON'T CHECK SKILLS** your task will be invalidated and we will generate rework
- **YOU CAN ONLY** finish a task if `make check` passes at 100% (runs `format + lint-fix + typecheck + test`). No exceptions — failing any of these commands means the task is **NOT COMPLETE**
- **`bun run lint` treats warnings as errors**. **Zero warnings allowed** — any oxlint warning is a blocking failure
- **ALWAYS** check dependent file APIs before writing tests to avoid writing wrong code
- **NEVER** use workarounds — always use the `no-workarounds` skill for any fix/debug task + `test-antipatterns` for tests
- **ALWAYS** use the `no-workarounds` and `systematic-debugging` skills when fixing bugs or complex issues
- **YOU MUST** use Context7 or Exa (`exa-web-search-free` skill) when researching external libraries/frameworks — always do **3-7 searches** with Exa for better results
- **NEVER** use Context7 or Exa to search local project code — for local code, use Grep/Glob instead
- **YOU SHOULD NEVER** install dependencies by hand in `package.json` without verifying the package exists — always use `bun add` instead

## MANDATORY REQUIREMENTS

- **MUST** run `make check` (or equivalently `bun run lint && bun run typecheck && bun run test`) before completing ANY subtask
- **ALWAYS USE** the `react` skill before writing any React component
- **ALWAYS USE** the `tanstack-router-best-practices` skill before working with routing
- **ALWAYS USE** the `tanstack-query-best-practices` skill before working with data fetching
- **ALWAYS USE** the `postgres-drizzle` + `drizzle-orm` skills before working with database code
- **ALWAYS USE** the `drizzle-safe-migrations` skill before creating or modifying migrations
- **ALWAYS FOLLOW** shadcn filename pattern with kebab-case for all React-related files
- **Skipping any verification check will result in IMMEDIATE TASK REJECTION**

## Skills Enforcement

When working on this project, **always use the relevant skills** for the technology being touched:

### React & Frontend

- **React components/hooks/state**: Use `react` skill
- **Routing/navigation**: Use `tanstack-router-best-practices` skill
- **Data fetching/caching/mutations**: Use `tanstack-query-best-practices` skill
- **State management (Zustand)**: Use `zustand` skill
- **UI components (shadcn/ui, Radix)**: Use `shadcn` skill
- **Building new components**: Use `building-components` skill
- **React performance patterns**: Use `vercel-react-best-practices` skill
- **Component composition/architecture**: Use `vercel-composition-patterns` skill
- **Feature systems (domain modules)**: Use `app-renderer-systems` skill
- **Advanced TypeScript patterns**: Use `typescript-advanced` skill
- **Testing (Vitest)**: Use `vitest` skill

### Backend & Database

- **Hono (routes, middleware, plugins)**: Use `hono` skill
- **Database/schema/queries**: Use `postgres-drizzle` skill
- **Drizzle ORM patterns**: Use `drizzle-orm` skill
- **Drizzle migrations**: Use `drizzle-safe-migrations` skill
- **Validation (Zod schemas)**: Use `zod` skill
- **Utility functions (es-toolkit)**: Use `es-toolkit` skill

### Design & UI/UX

- **Frontend design/styling**: Use `frontend-design` and `ui-ux-pro-max` skills
- **Interface design (dashboards, admin panels)**: Use `interface-design` skill
- **UI review/accessibility audit**: Use `web-design-guidelines` skill

### Process & Quality

- **Before any creative/feature work**: Use `brainstorming` skill
- **Executing implementation plans**: Use `executing-plans` skill
- **Debugging/fixing bugs**: Use `no-workarounds` + `systematic-debugging` skills
- **Writing/changing tests**: Use `test-antipatterns` skill
- **Before claiming task is complete**: Use `verification-before-completion` skill
- **Code review (cross-model)**: Use `adversarial-review` skill
- **Architectural analysis/dead code**: Use `architectural-analysis` skill
- **PR review fixes**: Use `fix-coderabbit-review` skill
- **Git rebase/conflicts**: Use `git-rebase` skill
- **Prompt generation for LLMs**: Use `to-prompt` skill
- **Code analysis (Pal MCP)**: Use `pal` skill
- **Discover/install skills**: Use `find-skills` skill

## Commands

```bash
# Development
bun run dev              # Start all dev servers (frontend + backend via Turbo)
bun run build            # Build all workspaces

# Quality
bun run lint             # Format (oxfmt) + lint (oxlint)
bun run typecheck        # Type check with tsc
bun run format           # Format with oxfmt
bun run test             # Run tests (Vitest)

# Database
docker compose up -d     # Start services (PostgreSQL + optional extras)
bun run db:generate      # Generate Drizzle migrations
bun run db:migrate       # Apply migrations

# Makefile shortcuts
make check               # Run format + lint-fix + typecheck + test
make commit              # Run check pipeline + git add + opencommit
make clean               # Remove node_modules, build artifacts, caches
make update              # Interactive dependency update (taze)
```

## CRITICAL: Git Commands Restriction

- **ABSOLUTELY FORBIDDEN**: **NEVER** run `git restore`, `git checkout`, `git reset`, `git clean`, `git rm`, or any other git commands that modify or discard working directory changes **WITHOUT EXPLICIT USER PERMISSION**
- **DATA LOSS RISK**: These commands can **PERMANENTLY LOSE CODE CHANGES** and cannot be easily recovered
- **REQUIRED ACTION**: If you need to revert or discard changes, **YOU MUST ASK THE USER FIRST**

## Code Search and Discovery

- **TOOL HIERARCHY**: Use tools in this order:
  1. **Grep** / **Glob** — preferred for local project code
  2. **Context7** — for external libraries and frameworks documentation
  3. **Exa** (`exa-web-search-free` skill) — for web research, latest news, code examples. **Always perform 3-7 searches**
- **FORBIDDEN**: Never use Context7 or Exa for local project code

## Architecture

**Mastra Rag** is a monorepo with two main packages, orchestrated by Turborepo and managed with Bun.

### Monorepo Structure

```
packages/
├── frontend/            # React 19 SPA (Vite + TanStack Router)
└── backend/             # Hono API server (Drizzle ORM + PostgreSQL)
```

### Path Aliases

- `@/*` maps to `./src/*` in each package (tsconfig paths)

### Frontend (`packages/frontend`)

React 19 single-page application with client-side routing.

```
src/
├── routes/              # TanStack file-based routes
├── components/          # React components (ui/, feature-specific/)
├── hooks/               # Shared React hooks
├── lib/                 # Client utilities
├── stores/              # Zustand stores
├── data/                # Data layer (TanStack Query, collections)
├── styles.css           # Tailwind v4 theme
└── routeTree.gen.ts     # Auto-generated route tree (never edit)
```

### Backend (`packages/backend`)

Hono API server following feature-based module architecture.

```
src/
├── app.ts               # Main Hono app (plugin composition + route mounting)
├── index.ts             # Server startup
├── modules/             # Feature modules (1 Hono instance = 1 controller)
│   └── <feature>/
│       ├── route.ts     # Hono instance with route handlers
│       ├── usecases.ts  # Business logic (pure functions)
│       ├── model.ts     # Zod schemas and types
│       └── repository.ts # Database operations (Drizzle)
├── plugins/             # Cross-cutting concerns (auth, error handling)
├── lib/                 # Shared utilities
├── db/                  # Database layer (Drizzle schema, migrations)
└── types/               # TypeScript type definitions
```

### Data Flow

- **Client**: TanStack Query for server state; Zustand for shared client state
- **Server**: Hono route handlers delegate to usecases, which call repositories
- **Database**: PostgreSQL 16 via Drizzle ORM

### Tooling

- **Package manager**: Bun
- **Monorepo orchestration**: Turborepo
- **Linting**: Oxlint
- **Formatting**: Oxfmt (printWidth: 100)
- **Type checking**: tsc
- **Testing**: Vitest + Testing Library
- **Commits**: Conventional Commits + commitlint + husky + lint-staged

## Frontend Architecture Rules

### Principles

- UI components **MUST** be pure and presentational; orchestration **MUST** live in pages/routes.
- State management **MUST** be testable without UI coupling.
- HTTP access **MUST** be isolated behind service boundaries.

### Separation of Concerns

- Routes/pages **MUST** orchestrate business logic and data fetching.
- Components **MUST** be pure UI (no store or gateway access).
- Stores **MUST** be framework-agnostic and testable without React.

### Key Patterns

- **File naming**: kebab-case for components (`.tsx`), hooks (`use-*.ts`), utilities (`.ts`)
- **Exports**: Prefer named exports for components and utils
- **Styling**: Tailwind CSS v4 with design tokens; Tailwind Variants for component variants

### React Component Rules

1. **Functional components only** — no class components, no `React.FC`
2. **Separation of concerns** — extract behavior logic into custom hooks
3. **State hierarchy** — local state > Zustand > TanStack Query > URL state
4. **useEffect is an escape hatch** — only for external system sync
5. **Handle all states** — always handle loading, error, and empty states
6. **React 19+** — use `use()` hook, Actions, `useOptimistic()`, `useFormStatus()`; no `forwardRef`

## Backend Architecture Rules

- Follow the **1 Hono instance = 1 controller** principle
- Keep route handlers thin — delegate to usecases
- Usecases contain pure business logic (no HTTP context)
- Repositories handle all database operations via Drizzle
- Use Zod validation at API boundaries
- Never edit files in the `drizzle/` folder (auto-generated)

## Coding Style & Naming Conventions

- **TypeScript**: React 19, Tailwind 4; 2-space indent; semicolons; double quotes. Lint with Oxlint, format with Oxfmt (printWidth: 100)
- File names: components `kebab-case.tsx`; hooks `use-kebab-case.ts`; utilities `kebab-case.ts`
- Exports: prefer named exports for components and utils

## Commit & Pull Request Guidelines

- Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `build:`
- Before opening a PR: run `make check`
- Do not rewrite unrelated files or reformat the whole repo — limit diffs to your change

## Security & Configuration

- Environment files: keep secrets in `.env` (never commit). Mirror keys in `.env.example`
- Do not introduce unnecessary dependencies — audit every new package addition

## Agent Skill Dispatch Protocol

Every agent MUST follow this protocol before writing code:

### Step 1: Identify Task Domain

Scan the task description and target files to determine which domains are involved:

- **Backend + Hono** keywords: route, handler, API, usecase, repository, module, Hono, middleware, plugin
- **Validation / Zod** keywords: zod, z.object, z.string, safeParse, z.infer, schema validation, parse, transform
- **Frontend + React** keywords: component, hook, JSX, TSX, render, state, props, UI, layout, page, form
- **Frontend + TanStack** keywords: query, mutation, TanStack Query, cache, invalidation, refetch
- **Frontend + Design** keywords: UI design, UX, design system, visual fidelity, interface, responsive
- **React performance** keywords: performance, memoization, lazy, Suspense, code splitting
- **State + Zustand** keywords: store, state management, zustand, selector
- **es-toolkit / utilities** keywords: es-toolkit, lodash, utility function, debounce, throttle, groupBy, pick, omit
- **Bug fix** keywords: bug, fix, error, failure, crash, unexpected, broken, regression
- **Writing tests** keywords: test, spec, mock, stub, fixture, assertion, coverage, vitest
- **Task completion** keywords: done, complete, finished, ship
- **Architecture audit** keywords: architecture audit, dead code, code smell, anti-pattern, duplication
- **Interface/App design** keywords: dashboard, admin panel, app interface, interactive product
- **Creative/new features** keywords: brainstorm, idea, new feature, creative
- **Plan execution** keywords: plan, execute, implement, step by step
- **TypeScript advanced** keywords: generics, conditional types, mapped types, template literals, utility types

### Step 2: Activate All Matching Skills

Use the `Skill` tool to activate every skill that matches the identified domains:

| Domain                 | Required Skills                                       | Conditional Skills                      |
| ---------------------- | ----------------------------------------------------- | --------------------------------------- |
| Backend + Hono         | `hono` + `postgres-drizzle` + `drizzle-orm`           | `drizzle-safe-migrations`               |
| Validation / Zod       | `zod`                                                 |                                         |
| Frontend + React       | `react`                                               | `shadcn` + `building-components`        |
| Frontend + TanStack    | `tanstack-query-best-practices` + `react`             | `tanstack-router-best-practices`        |
| Frontend + Design      | `frontend-design` + `ui-ux-pro-max`                   | `web-design-guidelines` + `shadcn`      |
| React performance      | `vercel-react-best-practices`                         | `vercel-composition-patterns` + `react` |
| State + Zustand        | `zustand`                                             |                                         |
| es-toolkit / utilities | `es-toolkit`                                          |                                         |
| Bug fix                | `systematic-debugging` + `no-workarounds`             | `test-antipatterns`                     |
| Writing tests          | `vitest` + `test-antipatterns`                        |                                         |
| Task completion        | `verification-before-completion`                      |                                         |
| Architecture audit     | `architectural-analysis`                              |                                         |
| Interface/App design   | `interface-design` + `bencium-innovative-ux-designer` | `frontend-design` + `ui-ux-pro-max`     |
| Creative/new features  | `brainstorming`                                       |                                         |
| Plan execution         | `executing-plans`                                     |                                         |
| TypeScript advanced    | `typescript-advanced`                                 |                                         |

### Step 3: Verify Before Completion

Before any agent marks a task as complete:

1. Activate `verification-before-completion` skill
2. Run `make check` (or `bun run lint && bun run typecheck && bun run test`)
3. Read and verify the full output — no skipping
4. Only then claim completion

## Anti-Patterns for Agents

**NEVER do these:**

1. **Skip skill activation** because "it's a small change" — every domain change requires its skill
2. **Activate only one skill** when the code touches multiple domains
3. **Forget `verification-before-completion`** before marking tasks done
4. **Write tests without `test-antipatterns`** — leads to mock-testing-mocks and production pollution
5. **Fix bugs without `systematic-debugging`** — leads to symptom-patching instead of root cause fixes
6. **Apply workarounds without `no-workarounds`** — type assertions, lint suppressions, error swallowing are rejected
7. **Claim task is done when any check has warnings or errors** — zero warnings, zero errors. No exceptions
8. **Install dependencies by hand** — always use `bun add`
9. **Use Context7 or Exa for local code** — only for external library documentation
10. **Do only 1 Exa search** — always perform **3-7 searches** with varied queries
11. **Run destructive git commands without permission** — `git restore`, `git reset`, `git clean` require explicit user approval
