# TechSpec: Ticket Type Management

## Executive Summary

This feature adds CRUD operations for ticket types — a foundational entity in the support system — through a new Settings area with sidebar navigation. The backend exposes a REST API (Express.js routes + service layer) backed by PostgreSQL, while the frontend introduces React Router v7 for navigation and shadcn/ui components for an inline-editable table.

The primary technical trade-off is **forward-declaring a minimal `tickets` table** to enforce foreign key delete protection before the tickets feature exists. This adds a partially-defined table to the schema but guarantees referential integrity from day one, avoiding data corruption when tickets CRUD arrives in Phase 2.

## System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                            │
│  ┌──────────────┐  ┌────────────────────────────┐   │
│  │ React Router │→ │ Settings Layout             │   │
│  │ (v7)         │  │  ├─ Sidebar (NavLink)       │   │
│  │              │  │  └─ Outlet                   │   │
│  │              │  │      └─ TicketTypesPage      │   │
│  │              │  │          ├─ TicketTypeTable   │   │
│  │              │  │          ├─ InlineEditRow     │   │
│  │              │  │          └─ DeleteDialog      │   │
│  └──────────────┘  └────────────────────────────┘   │
│                          │ fetch()                   │
└──────────────────────────┼──────────────────────────┘
                           │ HTTP (JSON)
┌──────────────────────────┼──────────────────────────┐
│  Backend (Express.js)    ▼                          │
│  ┌──────────────────────────────────────────────┐   │
│  │ ticketTypeRoutes.ts                          │   │
│  │  GET /api/ticket-types                       │   │
│  │  POST /api/ticket-types                      │   │
│  │  PUT /api/ticket-types/:id                   │   │
│  │  DELETE /api/ticket-types/:id                │   │
│  └──────────────┬───────────────────────────────┘   │
│                 │                                    │
│  ┌──────────────▼───────────────────────────────┐   │
│  │ ticketTypeService.ts                         │   │
│  │  list(), create(), update(), remove()        │   │
│  │  checkInUse()                                │   │
│  └──────────────┬───────────────────────────────┘   │
│                 │ pg-promise                         │
└─────────────────┼───────────────────────────────────┘
                  │ SQL
┌─────────────────▼───────────────────────────────────┐
│  PostgreSQL 16                                      │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │ ticket_types    │←─│ tickets (minimal FK only) │  │
│  │  id, name, desc │  │  id, ticket_type_id (FK)  │  │
│  └─────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Data flow**: User interacts with the inline table → React components call `fetch()` to backend REST endpoints → route handlers delegate to the service layer → service executes SQL via pg-promise → PostgreSQL enforces constraints and returns data → response flows back to the UI.

## Implementation Design

### Core Interfaces

**Backend — Service interface** (`backend/src/ticketTypeService.ts`):

```typescript
export interface TicketType {
  id: number;
  name: string;
  description: string | null;
}

export interface CreateTicketTypeInput {
  name: string;
  description?: string;
}

export interface UpdateTicketTypeInput {
  name?: string;
  description?: string;
}

export async function list(): Promise<TicketType[]>;
export async function create(input: CreateTicketTypeInput): Promise<TicketType>;
export async function update(id: number, input: UpdateTicketTypeInput): Promise<TicketType>;
export async function remove(id: number): Promise<void>;
export async function isInUse(id: number): Promise<boolean>;
```

**Frontend — TicketType type** (`frontend/src/types.ts`):

```typescript
export interface TicketType {
  id: number;
  name: string;
  description: string | null;
}
```

### Data Models

**`ticket_types` table:**

| Column      | Type                  | Constraints                          |
|-------------|-----------------------|--------------------------------------|
| id          | SERIAL                | PRIMARY KEY                          |
| name        | VARCHAR(50)           | NOT NULL, UNIQUE (case-insensitive via UNIQUE index on LOWER(name)) |
| description | VARCHAR(255)          | NULL                                 |

**`tickets` table (minimal, forward-declared for FK):**

| Column         | Type     | Constraints                                    |
|----------------|----------|------------------------------------------------|
| id             | SERIAL   | PRIMARY KEY                                    |
| ticket_type_id | INTEGER  | NOT NULL, REFERENCES ticket_types(id)          |

**Seed data** (inserted in `init.sql`):

| name           | description                                      |
|----------------|--------------------------------------------------|
| Dúvida         | Chamados relacionados a dúvidas e esclarecimentos |
| Inconsistência | Relatos de comportamentos inesperados ou erros    |
| Sugestão       | Ideias e sugestões de melhoria                    |
| Customização   | Solicitações de personalização e ajustes          |

### API Endpoints

All endpoints are prefixed with `/api`.

#### `GET /api/ticket-types`

List all ticket types, ordered alphabetically by name.

- **Response 200:**
  ```json
  [
    { "id": 1, "name": "Customização", "description": "Solicitações de personalização e ajustes" },
    ...
  ]
  ```

#### `POST /api/ticket-types`

Create a new ticket type.

- **Request body:**
  ```json
  { "name": "Bug Report", "description": "Reports of software defects" }
  ```
- **Validation:** `name` required, max 50 chars, unique (case-insensitive). `description` optional, max 255 chars.
- **Response 201:** The created ticket type object.
- **Response 400:** `{ "error": "Name is required" }` or `{ "error": "Name must be at most 50 characters" }` or `{ "error": "A ticket type with this name already exists" }`

#### `PUT /api/ticket-types/:id`

Update an existing ticket type.

- **Request body:**
  ```json
  { "name": "Updated Name", "description": "Updated description" }
  ```
- **Validation:** Same rules as create. Name uniqueness check excludes the current record.
- **Response 200:** The updated ticket type object.
- **Response 404:** `{ "error": "Ticket type not found" }`
- **Response 400:** Validation errors (same as create).

#### `DELETE /api/ticket-types/:id`

Delete a ticket type if not in use.

- **Response 204:** No content (successfully deleted).
- **Response 404:** `{ "error": "Ticket type not found" }`
- **Response 409:** `{ "error": "Cannot delete ticket type that is in use by existing tickets" }`

## Integration Points

No external service integrations. The frontend communicates with the backend via `fetch()` over HTTP. CORS is already configured to allow the Vite dev server origin (`http://localhost:5173`).

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|---------------------|-----------------|
| `database/init.sql` | Modified | Add `ticket_types` and `tickets` tables + seed data. Low risk — additive only. | Extend SQL file, run `make db:reset` |
| `backend/src/index.ts` | Modified | Import and mount ticket type routes. Low risk — small change. | Add `app.use("/api/ticket-types", ticketTypeRoutes)` |
| `backend/src/ticketTypeRoutes.ts` | New | REST route handlers for CRUD operations. | Create file |
| `backend/src/ticketTypeService.ts` | New | Business logic and database queries for ticket types. | Create file |
| `frontend/src/App.tsx` | Modified | Replace single-page component with React Router provider. Medium risk — restructures app entry. | Refactor to use `RouterProvider` |
| `frontend/src/pages/SettingsLayout.tsx` | New | Settings layout with sidebar and `<Outlet>`. | Create file |
| `frontend/src/pages/TicketTypesPage.tsx` | New | Main page component with table, inline edit, and delete dialog. | Create file |
| `frontend/package.json` | Modified | Add `react-router` dependency. Low risk. | Install package |

## Testing Approach

### Integration Tests (Backend)

- **Strategy**: Tests run against a real PostgreSQL database (Docker).
- **Setup**: A test helper connects to the DB, truncates tables between tests to ensure isolation.
- **Key scenarios**:
  - List ticket types returns seeded data in alphabetical order
  - Create with valid data returns 201 and the new record
  - Create with duplicate name (case-insensitive) returns 400
  - Create with empty name returns 400
  - Create with name exceeding 50 chars returns 400
  - Update existing type returns 200 with updated data
  - Update non-existent type returns 404
  - Update to a duplicate name returns 400
  - Delete unused type returns 204
  - Delete type in use returns 409
  - Delete non-existent type returns 404

### Unit Tests (Frontend)

- **Strategy**: Vitest with React Testing Library and `jsdom`. Mock `fetch` for API calls.
- **Key scenarios**:
  - TicketTypesPage renders a table with ticket types from the API
  - Clicking "+ New" shows an inline editable row
  - Submitting a valid new type adds it to the table
  - Inline validation shows error for empty name
  - Clicking "Edit" transforms a row into editable inputs
  - Clicking "Delete" shows a confirmation dialog
  - Delete confirmation calls the API and removes the row
  - Empty state message when no types exist
  - Settings sidebar shows "Ticket Types" as active link

## Development Sequencing

### Build Order

1. **Database schema and seed data** — Extend `database/init.sql` with `ticket_types` table, `tickets` table (minimal FK), and seed data. No dependencies.
2. **Backend service layer** — Create `ticketTypeService.ts` with `list`, `create`, `update`, `remove`, and `isInUse` functions. Depends on step 1 (needs table to exist).
3. **Backend route handlers** — Create `ticketTypeRoutes.ts`, mount in `index.ts`. Depends on step 2 (calls service functions).
4. **Backend integration tests** — Write tests for all CRUD endpoints against real DB. Depends on steps 1–3.
5. **Frontend routing setup** — Install React Router v7, refactor `App.tsx` to use `RouterProvider`, create `SettingsLayout.tsx` with sidebar. No dependency on backend (can use mock data).
6. **Frontend ticket types page** — Create `TicketTypesPage.tsx` with table, inline editing, delete dialog using shadcn/ui. Depends on step 5 (needs routing and layout).
7. **Frontend tests** — Write component tests with mocked fetch. Depends on step 6.

### Technical Dependencies

- **PostgreSQL running**: Required for steps 1–4. Already provided by `docker-compose.yml`.
- **`make db:reset`**: Must be run after step 1 to apply schema changes.
- **npm install**: Required before step 5 to install `react-router` and any shadcn/ui components.

## Monitoring and Observability

Given the project's educational nature, monitoring is minimal:

- **Backend error logging**: The existing global error handler in `index.ts` catches unhandled errors. Log ticket type operation failures to stdout.
- **HTTP status codes**: Standard REST status codes (201, 204, 400, 404, 409, 500) provide operational visibility.
- **Database constraints**: PostgreSQL enforces uniqueness and FK integrity, returning clear error codes that the service layer translates to HTTP responses.

No alerting or metrics infrastructure is in scope.

## Technical Considerations

### Key Decisions

- **API prefix `/api`**: All ticket type endpoints are under `/api/ticket-types` to separate API routes from potential frontend-served routes. This is a convention established now that future features should follow.
- **Case-insensitive uniqueness**: Enforced via a PostgreSQL unique index on `LOWER(name)` rather than application-level comparison. Database-enforced uniqueness is more reliable and handles concurrent requests correctly.
- **Inline validation**: Both backend (authoritative) and frontend (UX) validate name/description constraints. The backend is the source of truth; frontend validation is for immediate user feedback only.

### Known Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| React Router v7 API differences from v6 tutorials | Medium | Use official v7 documentation exclusively; avoid v6 patterns |
| Forward-declared `tickets` table diverges from Phase 2 needs | Low | Table is minimal (id + FK only); Phase 2 extends it with additional columns |
| Integration tests slow down CI | Low | Ticket type tests are few (~11 cases); PostgreSQL startup via Docker is fast |

## Architecture Decision Records

- [ADR-001: Inline Settings Page for Ticket Type Management](adrs/adr-001.md) — Chose inline table editing over dedicated CRUD pages or modal-based approach for simplicity and speed.
- [ADR-002: Layered Backend Organization with One File Per Concern](adrs/adr-002.md) — Flat file-per-concern structure (routes + service) over feature folders or monolithic index.ts.
- [ADR-003: React Router v7 for Frontend Navigation](adrs/adr-003.md) — React Router v7 over TanStack Router or state-based view switching for industry-standard routing with nested layouts.
- [ADR-004: Integration Tests with Real Database](adrs/adr-004.md) — Real PostgreSQL tests over mocked DB to validate SQL queries, constraints, and data integrity.
- [ADR-005: Forward-Declare Tickets Table for Foreign Key Delete Protection](adrs/adr-005.md) — Create minimal tickets table now for FK constraint, ensuring delete protection works before tickets CRUD exists.
