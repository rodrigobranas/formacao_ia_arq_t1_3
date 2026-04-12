# Task Memory: task_08.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Replace the `/signup` and `/signin` placeholder routes with real public auth pages that match task 08 requirements and the existing auth API/AuthContext contracts.

## Important Decisions

- Use the existing inline error pattern from `TicketTypesPage.tsx`: track field-level and form-level errors in local component state and clear the relevant error on field edit.
- Keep signup success behavior to redirect to `/signin`, matching the PRD/task default and avoiding extra session wiring beyond the existing `AuthContext`.
- Keep signin success behavior as an explicit page-level redirect to `/` after `useAuth().signin(...)` resolves so the form stays responsible for public-route navigation.

## Learnings

- Backend `POST /api/signup` expects `{ organizationName, name, email, password }` and returns validation messages like `Organization name is required`, `Password must be at least 8 characters`, and `Email is already in use`.
- `AuthContext.signin(email, password)` already owns the `/api/signin` call and throws backend error messages, including the generic `Invalid credentials`.
- Frontend coverage is enforced through `packages/frontend/vite.config.ts` with 80% thresholds across `src/pages/**/*.tsx`, `src/router.tsx`, `src/App.tsx`, and `src/store/**/*.tsx`.
- Existing router tests in `packages/frontend/src/App.test.tsx` asserted the earlier auth placeholders, so they needed to move to the new page headings/body copy once the real pages replaced the placeholders.

## Files / Surfaces

- `packages/frontend/src/router.tsx`
- `packages/frontend/src/pages/SignupPage.tsx`
- `packages/frontend/src/pages/SigninPage.tsx`
- `packages/frontend/src/pages/SignupPage.test.tsx`
- `packages/frontend/src/pages/SigninPage.test.tsx`
- `packages/frontend/src/App.test.tsx`
- `packages/backend/src/services/authService.ts`
- `packages/backend/src/routes/authRoutes.ts`

## Errors / Corrections

- Initial verification failed because `npm test -- --runInBand` is not a valid Vitest invocation in this package; reran with plain `npm test`.
- Full frontend suite initially failed on stale `App.test.tsx` assertions that still expected placeholder auth copy; updated those expectations to the real signin/signup pages and reran the suite successfully.

## Ready for Next Run

- Task 08 implementation is complete and verified with `npm test` and `npm run build` inside `packages/frontend`.
