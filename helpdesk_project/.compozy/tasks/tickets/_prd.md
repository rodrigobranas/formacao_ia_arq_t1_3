# PRD: Ticket Management System

## Overview

Organizations need a way to receive, track, and resolve support requests from their end customers. This feature adds a public-facing ticket submission form (no login required) and an operator-facing ticket management interface for logged-in users. Tickets are scoped to organizations, follow a lean three-status lifecycle (New → Assigned → Closed), support comments with file attachments, and maintain a full assignment history for traceability.

## Goals

- Enable end customers to submit support tickets without creating an account
- Provide operators with a simple workflow to claim, forward, comment on, and close tickets
- Maintain a clear audit trail of ticket assignments and forwarding
- Allow customers to track their ticket status via a unique ticket code
- Achieve adoption: tickets are actively being opened by customers and resolved by operators within the first month of launch

## User Stories

### End Customer (no login)

- As an end customer, I want to submit a support ticket with my name, email, phone, and a description so that I can request help from the organization
- As an end customer, I want to optionally select a ticket type when submitting so that my request is categorized correctly
- As an end customer, I want to attach files to my ticket so that I can provide supporting evidence (screenshots, documents)
- As an end customer, I want to receive a unique ticket code after submission so that I can track my ticket later
- As an end customer, I want to check the status of my ticket using my ticket code without logging in so that I can see if my issue is being handled

### Operator (logged-in user)

- As an operator, I want to see a list of all tickets for my organization so that I can identify unassigned tickets
- As an operator, I want to assign a ticket to myself so that I take responsibility for resolving it
- As an operator, I want to forward a ticket to another operator so that the right person handles the issue
- As an operator, I want to add comments to a ticket so that I can document the solution or ask follow-up questions
- As an operator, I want to attach files to my comments so that I can share relevant information
- As an operator, I want to close a ticket so that resolved issues are marked as complete
- As an operator, I want to see the assignment history of a ticket so that I know who handled it and when

## Core Features

### 1. Public Ticket Submission

End customers can open tickets without authentication. The form collects:
- **Name** (required)
- **Email** (required)
- **Phone** (required)
- **Description** (required) — free text describing the issue
- **Ticket type** (optional) — selected from the organization's configured ticket types
- **File attachments** (optional) — any file type, max 1MB per file, stored as base64

On submission, the system generates a unique ticket code and displays it to the customer. The ticket is created with status `New`.

### 2. Public Ticket Tracking

End customers can look up their ticket by entering the unique ticket code on a public page. The tracking view shows:
- Current status (New, Assigned, or Closed)
- Date of submission
- Most recent update timestamp

No login required. No ability to modify the ticket from this view in MVP.

### 3. Ticket List (Operator View)

Logged-in operators see all tickets for their organization. The list displays:
- Ticket code
- Ticket type (if set)
- Customer name
- Status
- Current assignee (if assigned)
- Creation date

Operators can filter by status and sort by date.

### 4. Ticket Assignment

Any logged-in operator can assign an unassigned ticket (status `New`) to themselves. This changes the status to `Assigned` and creates an entry in the assignment history.

### 5. Ticket Forwarding

Any logged-in operator can forward an assigned ticket to another user in the same organization. The ticket remains in status `Assigned`, but the assignee changes. Each forward creates a new entry in the assignment history with the previous and new assignee, timestamp, and optional reason.

### 6. Ticket Comments

Operators can add comments to any ticket. Each comment records:
- The comment text
- The author (operator)
- Timestamp
- Optional file attachments (any file type, max 1MB per file, stored as base64)

Comments are displayed in chronological order on the ticket detail view.

### 7. File Attachments

Files can be attached during ticket creation (by customers) and when adding comments (by operators). Constraints:
- Any file type accepted
- Maximum 1MB per file
- Stored as base64 in the database
- Displayed as downloadable links in the UI

### 8. Ticket Closure

Any logged-in operator can close an assigned ticket. This changes the status from `Assigned` to `Closed`. Closing is a terminal state in MVP — no reopening.

### 9. Assignment History

Every assignment and forward is recorded in a dedicated table. Each entry contains:
- Ticket reference
- Assigned-to user
- Assigned-by user (or system for initial assignment)
- Timestamp

This provides a full audit trail of who handled the ticket and when.

## User Experience

### Customer Journey

1. Customer navigates to the organization's public ticket page
2. Fills out the submission form (name, email, phone, description, optional type, optional attachments)
3. Submits and receives a unique ticket code on screen
4. Later, returns to the tracking page, enters the ticket code, and sees the current status

### Operator Journey

1. Operator logs in and navigates to the tickets section
2. Sees a list of all organization tickets, filterable by status
3. Opens a `New` ticket and clicks "Assign to me"
4. Reads the ticket details, adds comments with the solution (with optional attachments)
5. If needed, forwards the ticket to a colleague
6. When resolved, clicks "Close" to mark the ticket as done

### UI Considerations

- The public submission form should be clean and minimal — no distractions
- The tracking page requires only a single input field (ticket code) and displays status clearly
- The operator ticket list should highlight `New` (unassigned) tickets prominently
- The ticket detail view shows the full timeline: creation, assignments, comments, and closure in chronological order

## High-Level Technical Constraints

- File attachments are stored as base64 in the database, limited to 1MB per file
- The public ticket submission and tracking endpoints must be accessible without authentication
- All operator endpoints require JWT authentication
- Tickets and all related data are scoped to the organization
- The unique ticket code must be URL-safe and non-guessable to prevent unauthorized tracking

## Non-Goals (Out of Scope)

- **Email notifications** — no automated emails to customers or operators in MVP
- **SLA tracking** — no time-based escalation rules
- **Ticket priorities** — no urgency levels (Low, Medium, High)
- **Ticket search or full-text search** — basic status filtering only
- **Customer replies via the tracking page** — customers can only view status, not add comments
- **Ticket reopening** — closed tickets cannot be reopened in MVP
- **Auto-assignment or round-robin** — all assignment is manual
- **Bulk operations** — no bulk close, assign, or forward
- **Dashboard or analytics** — no charts or reports in MVP

## Phased Rollout Plan

### MVP (Phase 1)

- Public ticket submission form with file attachments
- Public ticket tracking via unique code
- Operator ticket list with status filter
- Ticket assignment ("Assign to me")
- Ticket forwarding to another operator
- Assignment history log
- Ticket comments with file attachments
- Ticket closure
- **Success criteria**: Tickets are being opened by customers and resolved by operators within the first month

### Phase 2

- Email notifications on ticket creation, assignment, and closure
- Customer replies via tracking page
- Ticket priorities (Low, Medium, High, Urgent)
- Ticket reopening from Closed back to New
- Pagination on ticket list

### Phase 3

- Full-text search across tickets and comments
- Dashboard with ticket volume and resolution time metrics
- SLA rules with escalation alerts
- Auto-assignment (round-robin)
- Bulk operations (close, assign)

## Success Metrics

- Tickets are being actively created through the public form
- Operators are assigning and closing tickets regularly
- Assignment history entries confirm forwarding is being used
- No orphaned tickets stuck in `New` status for extended periods

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Spam ticket submissions via the public form | Rate limiting by IP and email; consider CAPTCHA in Phase 2 |
| Customers lose their ticket code and cannot track | Provide clear instructions to save the code; email-based lookup in Phase 2 |
| Operators forget to close resolved tickets | Highlight long-running assigned tickets in the list view |
| Large base64 attachments slow down ticket loading | Enforce strict 1MB limit; lazy-load attachments in the UI |

## Architecture Decision Records

- [ADR-001: Ticket Status Workflow — Lean Linear Flow](adrs/adr-001.md) — Three-status workflow (New → Assigned → Closed) chosen for simplicity and fast delivery over more granular alternatives.

## Open Questions

- Should there be a maximum number of file attachments per ticket or per comment?
- Should the public ticket form include a CAPTCHA or similar anti-spam mechanism from day one?
- What should happen when a ticket code is entered but does not exist — just a "not found" message?
- Should operators see tickets from all statuses by default, or only `New` and `Assigned`?
