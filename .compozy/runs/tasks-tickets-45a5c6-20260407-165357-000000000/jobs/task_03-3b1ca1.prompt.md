# Implementation Task: task_03.md

## Task Context

- **Title**: Ticket service — core business logic
- **Type**: backend
- **Complexity**: high
- **Dependencies**: task_01


<required_skills>
- `cy-workflow-memory`: required when workflow memory paths are provided for this task
- `cy-execute-task`: required end-to-end workflow for a PRD task
- `cy-final-verify`: required before any completion claim or automatic commit
</required_skills>

<critical>
- Use installed `cy-workflow-memory` before editing code when workflow memory paths are provided below.
- Use installed `cy-execute-task` as the execution workflow for this task.
- Read `AGENTS.md`, `CLAUDE.md`, and the PRD documents under `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets` before editing code.
- Treat the task specification below plus the supporting PRD documents, especially `_techspec.md` and `_tasks.md`, as the source of truth.
- Keep scope tight to this task and record meaningful follow-up work instead of expanding scope silently.
- Use installed `cy-final-verify` before any completion claim or automatic commit.
- Automatic commits are disabled for this run (`--auto-commit=false`).
</critical>

## Workflow Memory

- Memory directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/memory`
- Shared workflow memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/memory/MEMORY.md`
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/memory/task_03.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
title: Ticket service — core business logic
type: backend
complexity: high
dependencies:
  - task_01
---

# Task 03: Ticket service — core business logic

## Overview

Create the core ticket business logic layer: `ticketCodeService.ts` for generating unique ticket codes and `ticketService.ts` for all ticket operations (create, list, get, assign, forward, close, comment with attachments). This is the largest backend task and contains all business rules for the ticket lifecycle.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create ticketCodeService.ts that generates unique 8-char alphanumeric codes in format TK-XXXXXXXX
- MUST retry code generation on uniqueness collision (up to 3 retries)
- MUST create ticketService.ts with these operations: createTicket, listTickets, getTicketById, getTicketByCode, assignTicket, forwardTicket, closeTicket, addComment
- MUST validate all required fields on ticket creation: name, email, phone, description
- MUST validate attachment size (reject base64 content > ~1.37MB representing > 1MB decoded)
- MUST enforce status transitions: only New -> Assigned (via assign), only Assigned -> Closed (via close)
- MUST reject invalid transitions (e.g., assigning an already-assigned ticket, closing a non-assigned ticket)
- MUST create assignment history entries on assign and forward operations
- MUST reject forwarding to the same user currently assigned
- MUST reject forwarding to a user not in the same organization
- MUST scope all queries to organizationId for multi-tenant isolation
- MUST support status filtering on listTickets
- MUST use transactions for operations that span multiple tables (create with attachments, forward with history)
- MUST follow existing error class patterns: ValidationError, NotFoundError, etc.
</requirements>

## Subtasks
- [ ] 3.1 Create ticketCodeService with code generation and collision handling
- [ ] 3.2 Create ticketService with createTicket (validates input, generates code, inserts ticket + attachments in transaction)
- [ ] 3.3 Add listTickets with organization scoping and optional status filter
- [ ] 3.4 Add getTicketById and getTicketByCode with joined comments, attachments, and assignment history
- [ ] 3.5 Add assignTicket, forwardTicket, closeTicket with status transition validation and history logging
- [ ] 3.6 Add addComment with optional attachment support
- [ ] 3.7 Write comprehensive service-level tests for all operations and edge cases

## Implementation Details

Create two new files in `packages/backend/src/services/`. Follow existing patterns from `ticketTypeService.ts` for validation, error handling, and query structure. See TechSpec 'Core Interfaces' section for type definitions and 'Data Models' for table structures.

### Relevant Files
- `packages/backend/src/services/ticketTypeService.ts` — pattern reference for validation, errors, CRUD operations
- `packages/backend/src/data/database.ts` — database instance and transaction API
- `packages/backend/src/data/testHelper.ts` — test utilities for setup/teardown

### Dependent Files
- `packages/backend/src/routes/publicTicketRoutes.ts` (task_04) — will call createTicket and getTicketByCode
- `packages/backend/src/routes/ticketRoutes.ts` (task_05) — will call all operator-facing service methods

### Related ADRs
- [ADR-001: Ticket Status Workflow](../adrs/adr-001.md) — Status values and allowed transitions
- [ADR-003: File Attachments as Base64 in JSON](../adrs/adr-003.md) — Base64 validation and storage approach

## Deliverables
- `packages/backend/src/services/ticketCodeService.ts` — code generation service
- `packages/backend/src/services/ticketService.ts` — full ticket business logic
- `packages/backend/src/services/ticketCodeService.test.ts` — unit tests **(REQUIRED)**
- `packages/backend/src/services/ticketService.test.ts` — service tests **(REQUIRED)**
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] ticketCodeService generates codes matching TK-XXXXXXXX pattern
  - [ ] ticketCodeService generates unique codes across multiple calls
  - [ ] createTicket with valid input returns ticket with code and status 'new'
  - [ ] createTicket with missing name throws ValidationError
  - [ ] createTicket with missing email throws ValidationError
  - [ ] createTicket with missing phone throws ValidationError
  - [ ] createTicket with missing description throws ValidationError
  - [ ] createTicket with oversized attachment throws ValidationError
  - [ ] createTicket with optional ticketTypeId stores it correctly
  - [ ] createTicket with invalid ticketTypeId throws NotFoundError
  - [ ] listTickets returns only tickets for the given organizationId
  - [ ] listTickets with status filter returns only matching tickets
  - [ ] getTicketById returns ticket with comments, attachments, and assignments
  - [ ] getTicketById for non-existent ticket throws NotFoundError
  - [ ] getTicketById for ticket in different organization throws NotFoundError
  - [ ] getTicketByCode returns ticket status info
  - [ ] assignTicket changes status from 'new' to 'assigned' and creates assignment history
  - [ ] assignTicket on already-assigned ticket throws ValidationError
  - [ ] forwardTicket updates assignee and creates assignment history entry
  - [ ] forwardTicket to same user throws ValidationError
  - [ ] forwardTicket to user in different organization throws ValidationError
  - [ ] forwardTicket on non-assigned ticket throws ValidationError
  - [ ] closeTicket changes status from 'assigned' to 'closed'
  - [ ] closeTicket on non-assigned ticket throws ValidationError
  - [ ] addComment creates comment with text and optional attachments
  - [ ] addComment on non-existent ticket throws NotFoundError
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- All ticket lifecycle operations work correctly
- Multi-tenant isolation verified (no cross-org data leakage)
- Status transitions strictly enforced


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/task_03.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/tickets/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
