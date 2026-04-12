---
status: completed
title: Public ticket pages (submission + tracking)
type: frontend
complexity: medium
dependencies:
    - task_04
---

# Task 06: Public ticket pages (submission + tracking)

## Overview

Create two public-facing React pages: a ticket submission form where end customers can open tickets without logging in, and a ticket tracking page where customers can check their ticket status using a unique code. Both pages are accessible without authentication and must be added to the router as public routes.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create PublicTicketPage.tsx with a form collecting: name, email, phone, description (all required), ticket type (optional dropdown), file attachments (optional)
- MUST read files as base64 using FileReader API and include in JSON payload
- MUST validate file size client-side (max 1MB per file) before submission
- MUST POST to /api/public/:orgSlug/tickets and display the returned ticket code on success
- MUST create PublicTicketTrackingPage.tsx with a single input for ticket code
- MUST GET /api/public/:orgSlug/tickets/:code and display status, creation date, and last update
- MUST add public routes to router.tsx (outside ProtectedRoute wrapper)
- MUST use Tailwind for styling and Shadcn components where applicable
- MUST handle and display form validation errors and API errors
- MUST add frontend types for ticket-related interfaces to types.ts
</requirements>

## Subtasks
- [x] 6.1 Add ticket-related TypeScript interfaces to types.ts
- [x] 6.2 Create PublicTicketPage.tsx with submission form, file upload, and success state
- [x] 6.3 Create PublicTicketTrackingPage.tsx with code input and status display
- [x] 6.4 Add public routes to router.tsx outside the ProtectedRoute wrapper
- [x] 6.5 Write component tests for both pages

## Implementation Details

Create pages in `packages/frontend/src/pages/`. Follow patterns from `SignupPage.tsx` for public form handling (no auth context). Add routes in `packages/frontend/src/router.tsx` as siblings to `/signin` and `/signup` (outside ProtectedRoute). See TechSpec 'API Endpoints > Public Endpoints' for request/response formats.

### Relevant Files
- `packages/frontend/src/pages/SignupPage.tsx` — pattern reference for public form pages
- `packages/frontend/src/pages/TicketTypesPage.tsx` — pattern reference for form validation and API calls
- `packages/frontend/src/router.tsx` — route definitions to modify
- `packages/frontend/src/types/types.ts` — type definitions to extend

### Dependent Files
- `packages/frontend/src/router.tsx` — new route entries needed

## Deliverables
- `packages/frontend/src/pages/PublicTicketPage.tsx` — submission form
- `packages/frontend/src/pages/PublicTicketTrackingPage.tsx` — tracking page
- Updated `packages/frontend/src/router.tsx` — public routes
- Updated `packages/frontend/src/types/types.ts` — ticket interfaces
- `packages/frontend/src/pages/PublicTicketPage.test.tsx` — component tests **(REQUIRED)**
- `packages/frontend/src/pages/PublicTicketTrackingPage.test.tsx` — component tests **(REQUIRED)**

## Tests
- Unit tests:
  - [x] PublicTicketPage renders form with all required fields
  - [x] PublicTicketPage shows validation errors for empty required fields on submit
  - [x] PublicTicketPage shows file size error when attachment exceeds 1MB
  - [x] PublicTicketPage calls POST endpoint with correct payload on valid submit
  - [x] PublicTicketPage displays ticket code on successful submission
  - [x] PublicTicketPage displays API error message on failure
  - [x] PublicTicketTrackingPage renders code input field
  - [x] PublicTicketTrackingPage calls GET endpoint with entered code
  - [x] PublicTicketTrackingPage displays ticket status on success
  - [x] PublicTicketTrackingPage displays error for invalid code (404)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Submission form validates inputs and submits correctly
- Ticket code displayed clearly after successful submission
- Tracking page shows status without requiring login
- File attachments encoded as base64 and sent in JSON payload
