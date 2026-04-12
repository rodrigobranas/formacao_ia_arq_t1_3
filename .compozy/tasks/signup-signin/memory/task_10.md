# Task Memory: task_10.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Build the admin-only UsersPage with user table (name, email, role), create user form with validation, and delete with confirmation dialog.

## Important Decisions

- Form is rendered above the table (not inline like TicketTypesPage) because the create form has 4 fields (name, email, password, admin toggle) — too wide for inline table editing.
- Admin toggle uses a native checkbox rather than a Shadcn Switch component (no Switch component installed).
- Delete button is disabled for the current user (matching `user.id === currentUser.userId`) to prevent self-deletion on the frontend, in addition to backend 403.

## Learnings

- AuthContext wraps `window.fetch` in a `useLayoutEffect`, so test mocks via `vi.stubGlobal("fetch", fetchMock)` receive `Request` objects (not plain url+init pairs) because the wrapper calls `new Request(...)` before passing to `baseFetch`.
- Pre-existing TS errors exist in `AuthContext.tsx` lines 68-69 (Partial type narrowing) — not introduced by this task.

## Files / Surfaces

- `packages/frontend/src/pages/UsersPage.tsx` — new page component
- `packages/frontend/src/pages/UsersPage.test.tsx` — 18 tests, all passing
- `packages/frontend/src/types/types.ts` — added `User` interface
- `packages/frontend/src/router.tsx` — replaced placeholder with UsersPage import/route
- `packages/frontend/src/router.test.tsx` — updated heading assertion from "User Management" to "Users"

## Errors / Corrections

- Initial test assertions used `(call[1] as RequestInit).method` which failed because AuthContext's fetch wrapper passes a single `Request` object to the underlying mock. Fixed to check `(call[0] as Request).method`.

## Ready for Next Run
