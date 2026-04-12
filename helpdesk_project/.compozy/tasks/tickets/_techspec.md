# TechSpec: Ticket Management System

## Executive Summary

This TechSpec describes the implementation of a ticket management system following the existing Express + TypeScript + PostgreSQL (pg-promise) architecture. The system adds public endpoints for ticket submission and tracking (scoped by organization slug), and authenticated endpoints for operators to manage tickets (assign, forward, comment, close). File attachments are sent as base64 in JSON payloads and stored in the database, consistent with the existing JSON-only API pattern. The primary trade-off is storing files as base64 in PostgreSQL (simpler, no external storage) at the cost of ~33% storage overhead and database size growth — acceptable given the 1MB per-file limit and MVP scope.

## System Architecture

### Component Overview

**Backend components (all in `packages/backend/src/`):**

- **`routes/publicTicketRoutes.ts`** — Public endpoints for ticket submission and tracking. No auth middleware. Resolves organization by slug.
- **`routes/ticketRoutes.ts`** — Authenticated endpoints for ticket list, detail, assign, forward, close, and comments. Uses `authMiddleware`.
- **`services/ticketService.ts`** — Business logic for ticket CRUD, status transitions, assignment, forwarding, and comments.
- **`services/ticketCodeService.ts`** — Generates unique 8-character alphanumeric ticket codes.

**Frontend components (all in `packages/frontend/src/`):**

- **`pages/PublicTicketPage.tsx`** — Public form for ticket submission (name, email, phone, description, type, attachments).
- **`pages/PublicTicketTrackingPage.tsx`** — Public page to check ticket status by code.
- **`pages/TicketsPage.tsx`** — Operator ticket list with status filter.
- **`pages/TicketDetailPage.tsx`** — Operator ticket detail with timeline, comments, assign/forward/close actions.

**Database (new tables and modifications in `database/init.sql`):**

- Modified `organizations` table — adds `slug` column.
- Modified `tickets` table — extends with customer info, status, code, description, timestamps.
- New `ticket_comments` table — comments on tickets with author reference.
- New `ticket_attachments` table — base64 file storage linked to tickets or comments.
- New `ticket_assignments` table — assignment/forwarding history log.

**Data flow:**

1. Public ticket submission: Client → `publicTicketRoutes` → `ticketService.createTicket()` → INSERT into `tickets` + `ticket_attachments` → returns ticket code.
2. Public tracking: Client → `publicTicketRoutes` → `ticketService.getTicketByCode()` → SELECT from `tickets` → returns status info.
3. Operator actions: Client → `ticketRoutes` (with JWT) → `ticketService.*()` → database operations → returns updated state.

## Implementation Design

### Core Interfaces

**Ticket Service — main types and operations:**

```typescript
interface Ticket {
  id: number;
  code: string;
  status: "new" | "assigned" | "closed";
  name: string;
  email: string;
  phone: string;
  description: string;
  ticketTypeId: number | null;
  ticketTypeName: string | null;
  assignedToId: number | null;
  assignedToName: string | null;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
}
```

```typescript
interface CreateTicketInput {
  name: string;
  email: string;
  phone: string;
  description: string;
  ticketTypeId?: number;
  attachments?: AttachmentInput[];
}

interface AttachmentInput {
  filename: string;
  contentType: string;
  content: string; // base64
}
```

```typescript
interface TicketComment {
  id: number;
  ticketId: number;
  userId: number;
  userName: string;
  content: string;
  attachments: Attachment[];
  createdAt: string;
}
```

### Data Models

**organizations (modified)**

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| name | VARCHAR(100) | NOT NULL |
| slug | VARCHAR(100) | NOT NULL, UNIQUE |

**tickets (extended)**

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| code | VARCHAR(10) | NOT NULL, UNIQUE |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'new' |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | NOT NULL |
| phone | VARCHAR(50) | NOT NULL |
| description | TEXT | NOT NULL |
| ticket_type_id | INTEGER | REFERENCES ticket_types(id), NULLABLE |
| assigned_to_id | INTEGER | REFERENCES users(id), NULLABLE |
| organization_id | INTEGER | NOT NULL, REFERENCES organizations(id) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |

**ticket_comments**

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| ticket_id | INTEGER | NOT NULL, REFERENCES tickets(id) |
| user_id | INTEGER | NOT NULL, REFERENCES users(id) |
| content | TEXT | NOT NULL |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |

**ticket_attachments**

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| ticket_id | INTEGER | NOT NULL, REFERENCES tickets(id) |
| ticket_comment_id | INTEGER | REFERENCES ticket_comments(id), NULLABLE |
| filename | VARCHAR(255) | NOT NULL |
| content_type | VARCHAR(100) | NOT NULL |
| content | TEXT | NOT NULL |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |

When `ticket_comment_id` is NULL, the attachment belongs to the ticket itself (submitted at creation). When set, it belongs to a specific comment.

**ticket_assignments**

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| ticket_id | INTEGER | NOT NULL, REFERENCES tickets(id) |
| assigned_to_id | INTEGER | NOT NULL, REFERENCES users(id) |
| assigned_by_id | INTEGER | NOT NULL, REFERENCES users(id) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |

### API Endpoints

#### Public Endpoints (no authentication)

| Method | Path | Description | Status Codes |
|--------|------|-------------|-------------|
| POST | `/api/public/:orgSlug/tickets` | Submit a new ticket | 201, 400, 404 |
| GET | `/api/public/:orgSlug/tickets/:code` | Track ticket by code | 200, 404 |

**POST /api/public/:orgSlug/tickets**

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+5511999999999",
  "description": "I need help with...",
  "ticketTypeId": 1,
  "attachments": [
    {
      "filename": "screenshot.png",
      "contentType": "image/png",
      "content": "<base64-string>"
    }
  ]
}
```

Response (201):
```json
{
  "code": "TK-A3F9B2C1",
  "message": "Ticket created successfully"
}
```

**GET /api/public/:orgSlug/tickets/:code**

Response (200):
```json
{
  "code": "TK-A3F9B2C1",
  "status": "new",
  "createdAt": "2026-04-07T10:00:00.000Z",
  "updatedAt": "2026-04-07T10:00:00.000Z"
}
```

#### Authenticated Endpoints (require JWT)

| Method | Path | Description | Status Codes |
|--------|------|-------------|-------------|
| GET | `/api/tickets` | List tickets for organization | 200 |
| GET | `/api/tickets/:id` | Ticket detail with comments, attachments, and history | 200, 404 |
| POST | `/api/tickets/:id/assign` | Assign ticket to self | 200, 400, 404 |
| POST | `/api/tickets/:id/forward` | Forward ticket to another user | 200, 400, 404 |
| POST | `/api/tickets/:id/close` | Close a ticket | 200, 400, 404 |
| POST | `/api/tickets/:id/comments` | Add a comment (with optional attachments) | 201, 400, 404 |

**GET /api/tickets?status=new&status=assigned**

Response (200):
```json
[
  {
    "id": 1,
    "code": "TK-A3F9B2C1",
    "status": "new",
    "name": "John Doe",
    "ticketTypeName": "Dúvida",
    "assignedToName": null,
    "createdAt": "2026-04-07T10:00:00.000Z"
  }
]
```

**GET /api/tickets/:id**

Response (200):
```json
{
  "id": 1,
  "code": "TK-A3F9B2C1",
  "status": "assigned",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+5511999999999",
  "description": "I need help with...",
  "ticketTypeName": "Dúvida",
  "assignedToName": "Operator Jane",
  "createdAt": "2026-04-07T10:00:00.000Z",
  "updatedAt": "2026-04-07T12:00:00.000Z",
  "comments": [
    {
      "id": 1,
      "userName": "Operator Jane",
      "content": "Looking into this now.",
      "attachments": [],
      "createdAt": "2026-04-07T12:30:00.000Z"
    }
  ],
  "attachments": [
    {
      "id": 1,
      "filename": "screenshot.png",
      "contentType": "image/png",
      "content": "<base64-string>",
      "createdAt": "2026-04-07T10:00:00.000Z"
    }
  ],
  "assignments": [
    {
      "assignedToName": "Operator Jane",
      "assignedByName": "Operator Jane",
      "createdAt": "2026-04-07T12:00:00.000Z"
    }
  ]
}
```

**POST /api/tickets/:id/assign**

No request body. Assigns to the authenticated user.

**POST /api/tickets/:id/forward**

Request:
```json
{
  "userId": 5
}
```

**POST /api/tickets/:id/comments**

Request:
```json
{
  "content": "The issue was caused by...",
  "attachments": [
    {
      "filename": "solution.pdf",
      "contentType": "application/pdf",
      "content": "<base64-string>"
    }
  ]
}
```

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|---------------------|-----------------|
| `database/init.sql` | Modified | Add slug to organizations, extend tickets table, add 3 new tables. Low risk — development environment. | Update schema definitions |
| `packages/backend/src/index.ts` | Modified | Register two new route modules. Low risk. | Add route imports and `app.use()` calls |
| `packages/backend/src/services/authService.ts` | Modified | Generate slug during organization signup. Low risk. | Add slug generation to signup transaction |
| `packages/frontend/src/router.tsx` | Modified | Add routes for public pages and operator ticket pages. Low risk. | Add new route entries |
| `packages/frontend/src/App.tsx` | Modified | Add tickets link to sidebar navigation. Low risk. | Add nav item |
| `express.json()` limit | Modified | Increase from default 100kb to 2mb to support base64 file uploads. Low risk. | Update `app.use(express.json({ limit: "2mb" }))` |
| `packages/backend/src/routes/publicTicketRoutes.ts` | New | Public endpoints for submission and tracking. | Create file |
| `packages/backend/src/routes/ticketRoutes.ts` | New | Authenticated ticket management endpoints. | Create file |
| `packages/backend/src/services/ticketService.ts` | New | Ticket business logic. | Create file |
| `packages/backend/src/services/ticketCodeService.ts` | New | Ticket code generation. | Create file |
| `packages/frontend/src/pages/PublicTicketPage.tsx` | New | Public submission form. | Create file |
| `packages/frontend/src/pages/PublicTicketTrackingPage.tsx` | New | Public tracking page. | Create file |
| `packages/frontend/src/pages/TicketsPage.tsx` | New | Operator ticket list. | Create file |
| `packages/frontend/src/pages/TicketDetailPage.tsx` | New | Operator ticket detail. | Create file |

## Testing Approach

### Unit Tests

**`services/ticketService.test.ts`** — Test all business logic:
- Ticket creation with validation (required fields, email format, phone format)
- Ticket code uniqueness (retry on collision)
- Status transitions: only New → Assigned, only Assigned → Closed
- Invalid transitions rejected (e.g., New → Closed, Closed → Assigned)
- Assignment creates history entry
- Forwarding updates assignee and creates history entry
- Forwarding to same user rejected
- Forwarding only allowed when status is Assigned
- Comment creation with and without attachments
- Attachment size validation (reject > 1MB base64)
- Organization isolation (cannot access tickets from other organizations)

**`services/ticketCodeService.test.ts`** — Test code generation:
- Code format matches `TK-XXXXXXXX` pattern (8 uppercase alphanumeric chars)
- Codes are unique across calls

### Integration Tests

**`routes/publicTicketRoutes.test.ts`** — Public endpoint tests:
- Submit ticket with all required fields (201)
- Submit ticket with optional type and attachments (201)
- Submit ticket with missing required fields (400)
- Submit ticket with invalid org slug (404)
- Submit ticket with oversized attachment (400)
- Track ticket by valid code (200)
- Track ticket with invalid code (404)
- Track ticket with wrong org slug (404)

**`routes/ticketRoutes.test.ts`** — Authenticated endpoint tests:
- List tickets returns only organization's tickets (200)
- List tickets with status filter (200)
- Get ticket detail with comments and assignments (200)
- Get ticket from another organization (404)
- Assign ticket to self (200, status changes to assigned)
- Assign already-assigned ticket (400)
- Forward ticket to another user (200)
- Forward ticket to user in different organization (400)
- Close ticket (200, status changes to closed)
- Close non-assigned ticket (400)
- Add comment with attachments (201)
- All endpoints return 401 without token

**Test setup** follows existing patterns: `beforeEach` truncates tables, helper functions create organizations/users/tokens, `afterAll` closes database connection.

## Development Sequencing

### Build Order

1. **Database schema** — Extend `init.sql` with organization slug, updated tickets table, and new tables (ticket_comments, ticket_attachments, ticket_assignments). No dependencies.
2. **Organization slug generation** — Modify `authService.ts` to generate and store slug during signup. Depends on step 1.
3. **Ticket code service** — Create `ticketCodeService.ts` with code generation logic and tests. Depends on step 1.
4. **Ticket service** — Create `ticketService.ts` with all business logic (create, list, get, assign, forward, close, comment) and tests. Depends on steps 1, 3.
5. **Public ticket routes** — Create `publicTicketRoutes.ts` with submission and tracking endpoints, register in `index.ts`, and write integration tests. Depends on step 4.
6. **Authenticated ticket routes** — Create `ticketRoutes.ts` with all operator endpoints, register in `index.ts`, and write integration tests. Depends on step 4.
7. **Public frontend pages** — Create `PublicTicketPage.tsx` and `PublicTicketTrackingPage.tsx` with routes. Depends on step 5.
8. **Operator frontend pages** — Create `TicketsPage.tsx` and `TicketDetailPage.tsx` with routes and sidebar navigation. Depends on step 6.
9. **Frontend tests** — Write component tests for all new pages. Depends on steps 7, 8.

### Technical Dependencies

- No external service dependencies — all storage is in PostgreSQL.
- No new npm packages required — existing `pg-promise`, `express`, `jsonwebtoken`, and `bcrypt` cover all backend needs.
- Express JSON body size limit must be increased before file upload endpoints are functional.

## Monitoring and Observability

- Log ticket creation events with organization ID and ticket code (no PII).
- Log status transitions with ticket ID and user ID.
- Log attachment upload sizes for capacity monitoring.
- Track error rates on public endpoints separately from authenticated endpoints (different traffic patterns).

## Technical Considerations

### Key Decisions

- **Base64 in JSON over multipart**: Keeps the API consistent with existing JSON-only pattern. The 1MB limit makes the ~33% encoding overhead negligible. No new dependencies needed.
- **Organization slug for public URLs**: Clean, shareable URLs without exposing internal IDs. Small schema addition with high usability payoff.
- **Short random ticket code**: 8-character alphanumeric code (e.g., TK-A3F9B2C1) balances uniqueness with usability. Easy to share verbally or via messaging. Collision probability is negligible at expected ticket volumes.
- **ticket_type_id is nullable**: The PRD specifies ticket type is optional. Making the FK nullable allows tickets without a type, unlike the current schema which has it as NOT NULL.

### Known Risks

- **Database growth from base64 attachments**: Each 1MB attachment stores ~1.37MB in the TEXT column. Mitigation: 1MB limit per file; monitor table size; migrate to file storage (S3) in a later phase if needed.
- **Ticket code collision**: With 36^8 possible codes (~2.8 trillion), collision is extremely unlikely at MVP scale. Mitigation: retry code generation on unique constraint violation (up to 3 retries).
- **Public endpoint abuse**: No authentication on submission endpoint. Mitigation: consider rate limiting middleware; add CAPTCHA in Phase 2.

## Architecture Decision Records

- [ADR-001: Ticket Status Workflow — Lean Linear Flow](adrs/adr-001.md) — Three-status workflow (New → Assigned → Closed) chosen for simplicity over more granular alternatives.
- [ADR-002: Public Endpoint Routing via Organization Slug](adrs/adr-002.md) — Organization slug in URL path for clean, shareable public endpoints without exposing internal IDs.
- [ADR-003: File Attachments as Base64 in JSON Payloads](adrs/adr-003.md) — Base64 in JSON body chosen over multipart to maintain existing API pattern consistency.
