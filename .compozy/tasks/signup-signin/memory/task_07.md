# Task Memory: task_07.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Build the frontend auth foundation: AuthContext session state, JWT persistence/restoration, protected routing, and required tests for public/protected navigation.

## Important Decisions

- Kept auth infrastructure scoped to `AuthContext` plus router/main wiring; did not implement full signin/signup pages yet, and used route-local placeholders so task_08 can replace them without reworking route protection.
- Installed a global fetch wrapper inside `AuthProvider` so existing pages like `HomePage` and `TicketTypesPage` automatically send the bearer token and trigger signout on `401`.
- Persisted `name` and `organizationName` in `localStorage` next to the JWT because the current backend JWT does not encode those fields, but the frontend `AuthState` requires them after refresh.

## Learnings

- In this frontend test environment, relative `Request` construction for `/api/...` fails unless it is normalized against `window.location.origin`.
- The auth fetch wrapper has to be installed with `useLayoutEffect` so child page `useEffect` calls do not outrun the interceptor on first render.

## Files / Surfaces

- `packages/frontend/src/store/AuthContext.tsx`
- `packages/frontend/src/router.tsx`
- `packages/frontend/src/main.tsx`
- `packages/frontend/src/types/types.ts`
- `packages/frontend/src/App.test.tsx`
- `packages/frontend/src/store/AuthContext.test.tsx`
- `packages/frontend/vite.config.ts`

## Errors / Corrections

- Initial test run failed because the interceptor used `new Request("/api/...")` directly under jsdom. Fixed by normalizing relative URLs to absolute URLs before constructing the request.
- A routing test reused the home-page mock payload for the ticket-types request, which produced `ticketTypes.map is not a function`. Fixed by giving the navigation test separate mock responses for `/api/health` and `/api/ticket-types`.

## Ready for Next Run

- Task 08 can replace the temporary public auth route placeholders with real `SignupPage` and `SigninPage` implementations without changing the protected route structure.
- Task 09 can read `organizationName` and signout from `useAuth()` when updating the app header.
