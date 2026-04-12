---
status: completed
title: Public ticket routes
type: backend
complexity: medium
dependencies:
    - task_03
---

# Task 04: Public ticket routes

## Overview

Create the public-facing HTTP endpoints for ticket submission and tracking. These endpoints are unauthenticated and scoped to an organization via its URL slug. This also requires increasing the Express JSON body limit to support base64 file attachments and registering the new routes in the app entry point.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create POST /api/public/:orgSlug/tickets endpoint for ticket submission (201, 400, 404)
- MUST create GET /api/public/:orgSlug/tickets/:code endpoint for ticket tracking (200, 404)
- MUST resolve organization by slug and return 404 if slug is invalid
- MUST NOT require authentication on either endpoint
- MUST increase express.json() limit to "2mb" in index.ts to support base64 attachments
- MUST register publicTicketRoutes in index.ts under /api/public
- MUST follow existing error handling pattern with sendErrorResponse
- MUST return ticket code and success message on creation
- MUST return only status, code, createdAt, updatedAt on tracking (no PII)
</requirements>

## Subtasks
- [ ] 4.1 Create publicTicketRoutes.ts with POST submission and GET tracking endpoints
- [ ] 4.2 Add organization-by-slug resolution logic
- [ ] 4.3 Increase express.json() limit to "2mb" in index.ts
- [ ] 4.4 Register publicTicketRoutes in index.ts
- [ ] 4.5 Write integration tests for both endpoints covering success and error cases

## Implementation Details

Create `packages/backend/src/routes/publicTicketRoutes.ts`. Follow existing route patterns from `ticketTypeRoutes.ts` for error handling structure. Register in `packages/backend/src/index.ts`. See TechSpec 'API Endpoints > Public Endpoints' section for request/response formats.

### Relevant Files
- `packages/backend/src/routes/ticketTypeRoutes.ts` — pattern reference for route structure and error handling
- `packages/backend/src/index.ts` — route registration and Express config
- `packages/backend/src/services/ticketService.ts` (from task_03) — service functions to call

### Dependent Files
- `packages/frontend/src/pages/PublicTicketPage.tsx` (task_06) — will POST to submission endpoint
- `packages/frontend/src/pages/PublicTicketTrackingPage.tsx` (task_06) — will GET from tracking endpoint

### Related ADRs
- [ADR-002: Public Endpoint Routing via Organization Slug](../adrs/adr-002.md) — URL pattern with org slug
- [ADR-003: File Attachments as Base64 in JSON](../adrs/adr-003.md) — JSON body limit increase

## Deliverables
- `packages/backend/src/routes/publicTicketRoutes.ts` — public endpoints
- Updated `packages/backend/src/index.ts` — route registration and JSON limit
- `packages/backend/src/routes/publicTicketRoutes.test.ts` — integration tests **(REQUIRED)**

## Tests
- Integration tests:
  - [ ] POST /api/public/:orgSlug/tickets with valid data returns 201 with ticket code
  - [ ] POST /api/public/:orgSlug/tickets with optional ticketTypeId and attachments returns 201
  - [ ] POST /api/public/:orgSlug/tickets with missing name returns 400
  - [ ] POST /api/public/:orgSlug/tickets with missing email returns 400
  - [ ] POST /api/public/:orgSlug/tickets with missing phone returns 400
  - [ ] POST /api/public/:orgSlug/tickets with missing description returns 400
  - [ ] POST /api/public/:orgSlug/tickets with invalid org slug returns 404
  - [ ] POST /api/public/:orgSlug/tickets with oversized attachment returns 400
  - [ ] GET /api/public/:orgSlug/tickets/:code with valid code returns 200 with status info
  - [ ] GET /api/public/:orgSlug/tickets/:code with invalid code returns 404
  - [ ] GET /api/public/:orgSlug/tickets/:code with wrong org slug returns 404
  - [ ] Neither endpoint requires authentication (no Authorization header needed)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Public endpoints accessible without authentication
- Ticket submission returns a unique code
- Ticket tracking returns only non-PII status information
