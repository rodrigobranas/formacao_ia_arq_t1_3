# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State

- Task 04 implemented frontend routing with a shared app shell, nested settings layout, and a placeholder `/settings/ticket-types` route for the ticket type UI work in Task 05.
- Repository-wide verification now passes through `make test`; the earlier unrelated frontend `App.test.tsx` baseline failure has been resolved.

## Shared Decisions

- Backend Jest now runs with `--runInBand` because the integration suites share one real PostgreSQL database and otherwise become order-dependent across files.

## Shared Learnings

## Open Risks

## Handoffs

- Task 05 can replace the `TicketTypesPage` placeholder at `/settings/ticket-types` without changing the router or settings layout structure introduced in Task 04.
