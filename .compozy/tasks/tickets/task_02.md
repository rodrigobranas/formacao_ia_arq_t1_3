---
status: completed
title: Organization slug generation on signup
type: backend
complexity: low
dependencies:
    - task_01
---

# Task 02: Organization slug generation on signup

## Overview

Modify the signup flow in `authService.ts` to generate a URL-safe slug from the organization name when creating a new organization. The slug is used for public-facing ticket URLs (see ADR-002). This is a small, focused change to an existing service with corresponding test updates.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST generate a slug from the organization name: lowercase, replace non-alphanumeric characters with hyphens, collapse consecutive hyphens, trim leading/trailing hyphens, truncate to 100 chars
- MUST store the generated slug in the organizations table during signup
- MUST handle slug uniqueness conflicts by appending a random suffix
- MUST update existing signup tests to verify slug is generated
- MUST update the organization insert in the signup transaction to include the slug column
</requirements>

## Subtasks
- [x] 2.1 Create a slug generation function that converts organization name to URL-safe slug
- [x] 2.2 Update the signup transaction to include slug in the organization INSERT
- [x] 2.3 Handle slug uniqueness violations with retry/suffix logic
- [x] 2.4 Update signup tests to verify slug generation and uniqueness handling

## Implementation Details

Modify `packages/backend/src/services/authService.ts` to add slug generation. The slug generation logic lives in the same file (or a small helper) since it's only used during signup. See TechSpec 'Impact Analysis' for the specific change.

### Relevant Files
- `packages/backend/src/services/authService.ts` — signup function to modify
- `packages/backend/src/services/authService.test.ts` — existing signup tests to update

### Dependent Files
- `packages/backend/src/routes/authRoutes.test.ts` — integration tests for signup endpoint
- `packages/backend/src/routes/publicTicketRoutes.ts` (future task_04) — will resolve org by slug

### Related ADRs
- [ADR-002: Public Endpoint Routing via Organization Slug](../adrs/adr-002.md) — Slug generation requirements

## Deliverables
- Updated `authService.ts` with slug generation in signup flow
- Unit tests for slug generation function with 80%+ coverage **(REQUIRED)**
- Integration tests verifying signup returns/stores a valid slug **(REQUIRED)**

## Tests
- Unit tests:
  - [x] Slug from "Acme Corp" produces "acme-corp"
  - [x] Slug from "My   Company!!!" produces "my-company"
  - [x] Slug from name with leading/trailing special chars trims correctly
  - [x] Slug truncates to 100 characters for very long names
  - [x] Empty name after normalization throws ValidationError
- Integration tests:
  - [x] Signup creates organization with a valid slug
  - [x] Signup with duplicate org name generates a unique slug (suffix appended)
  - [x] All existing signup tests continue to pass
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Signup creates organizations with valid, unique slugs
- Existing signup and auth tests unbroken
