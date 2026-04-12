# TechSpec: Signup, Signin, and Multi-Tenant User Management

## Executive Summary

This feature adds multi-tenancy, authentication, and role-based access control to the application. The implementation introduces JWT stateless authentication with bcrypt password hashing, organization-scoped data isolation, and admin/regular user roles. The backend gains new database tables (organizations, users), an auth middleware, and REST endpoints for signup, signin, user management, and organization settings. The frontend gains public pages (signup, signin), protected routing, and admin-only screens (user management, org settings). All existing data (ticket_types, tickets) is retrofitted with organization scoping via a default-organization migration.

**Primary trade-off:** Stateless JWT simplifies the backend (no session store) at the cost of not being able to revoke tokens server-side. This is acceptable for MVP since there is no requirement for immediate session invalidation.

## System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │
│  │  Signup   │ │  Signin  │ │  Protected Pages  │   │
│  │  Page     │ │  Page    │ │  (Dashboard, etc) │   │
│  └──────────┘ └──────────┘ └───────────────────┘   │
│       │             │         │ AuthContext          │
│       │             │         │ (JWT in localStorage)│
└───────┼─────────────┼─────────┼─────────────────────┘
        │             │         │ Authorization: Bearer <token>
┌───────┼─────────────┼─────────┼─────────────────────┐
│       ▼             ▼         ▼    Backend (Express) │
│  ┌──────────────────────────────────────────────┐   │
│  │              Auth Middleware                   │   │
│  │  (verify JWT, attach user context to req)     │   │
│  └──────────────────────────────────────────────┘   │
│  ┌────────────┐ ┌────────────┐ ┌────────────────┐   │
│  │  Auth      │ │  User      │ │  Organization  │   │
│  │  Routes    │ │  Routes    │ │  Routes        │   │
│  └─────┬──────┘ └─────┬──────┘ └───────┬────────┘   │
│        ▼              ▼                ▼             │
│  ┌────────────┐ ┌────────────┐ ┌────────────────┐   │
│  │  Auth      │ │  User      │ │  Organization  │   │
│  │  Service   │ │  Service   │ │  Service       │   │
│  └─────┬──────┘ └─────┬──────┘ └───────┬────────┘   │
│        ▼              ▼                ▼             │
│  ┌──────────────────────────────────────────────┐   │
│  │              PostgreSQL (pg-promise)           │   │
│  │  organizations │ users │ ticket_types │ tickets│   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Components:**

- **Auth Routes / Service**: Handle signup (create org + admin atomically) and signin (validate credentials, issue JWT). Public endpoints — no auth middleware.
- **User Routes / Service**: CRUD for users within an organization. Admin-only endpoints protected by admin middleware.
- **Organization Routes / Service**: Read and update organization settings. Admin-only for writes.
- **Auth Middleware**: Express middleware that extracts JWT from the Authorization header, verifies it, and attaches `{ userId, organizationId, admin }` to the request object.
- **Admin Middleware**: Checks `req.user.admin === true`; returns 403 if not.
- **AuthContext (Frontend)**: React Context that holds the decoded JWT payload and provides `signin`/`signout` helpers. Reads token from localStorage on app init.
- **ProtectedRoute (Frontend)**: Route wrapper that redirects unauthenticated users to `/signin`.

## Implementation Design

### Core Interfaces

**Auth Middleware (backend)**:

```typescript
interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    organizationId: number;
    admin: boolean;
  };
}

const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) { res.status(401).json({ message: "Token not provided" }); return; }
  const payload = jwt.verify(token, JWT_SECRET) as AuthenticatedRequest["user"];
  (req as AuthenticatedRequest).user = payload;
  next();
};
```

**AuthContext (frontend)**:

```typescript
interface AuthState {
  token: string | null;
  user: { userId: number; organizationId: number; admin: boolean; name: string; organizationName: string } | null;
  signin: (email: string, password: string) => Promise<void>;
  signout: () => void;
}
```

### Data Models

**New tables:**

```sql
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  admin BOOLEAN NOT NULL DEFAULT false,
  organization_id INTEGER NOT NULL REFERENCES organizations(id)
);

CREATE UNIQUE INDEX users_email_unique ON users (LOWER(email));
```

**Existing table modifications:**

```sql
-- Add organization_id to ticket_types
ALTER TABLE ticket_types ADD COLUMN organization_id INTEGER NOT NULL
  DEFAULT 1 REFERENCES organizations(id);
ALTER TABLE ticket_types ALTER COLUMN organization_id DROP DEFAULT;

-- Drop old unique index, create org-scoped one
DROP INDEX ticket_types_name_lower_unique;
CREATE UNIQUE INDEX ticket_types_name_org_unique
  ON ticket_types (LOWER(name), organization_id);

-- Add organization_id to tickets
ALTER TABLE tickets ADD COLUMN organization_id INTEGER NOT NULL
  DEFAULT 1 REFERENCES organizations(id);
ALTER TABLE tickets ALTER COLUMN organization_id DROP DEFAULT;
```

**TypeScript types:**

```typescript
interface Organization {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  password: string; // bcrypt hash, never exposed in API responses
  admin: boolean;
  organizationId: number;
}
```

### API Endpoints

**Auth (public — no auth middleware):**

| Method | Path | Description | Request Body | Status Codes |
|--------|------|-------------|-------------|--------------|
| POST | `/api/signup` | Create organization + admin user | `{ organizationName, name, email, password }` | 200, 400, 422 |
| POST | `/api/signin` | Authenticate and get JWT | `{ email, password }` | 200, 401 |

**Users (auth + admin middleware):**

| Method | Path | Description | Request Body | Status Codes |
|--------|------|-------------|-------------|--------------|
| GET | `/api/users` | List users in the organization | — | 200 |
| POST | `/api/users` | Create a user in the organization | `{ name, email, password, admin }` | 200, 400, 422 |
| DELETE | `/api/users/:userId` | Delete a user | — | 200, 403, 404 |

**Organizations (auth middleware, admin for writes):**

| Method | Path | Description | Request Body | Status Codes |
|--------|------|-------------|-------------|--------------|
| GET | `/api/organizations/current` | Get current org details | — | 200 |
| POST | `/api/organizations/current/change-name` | Update org name | `{ name }` | 200, 400, 422 |

**Existing endpoints (updated with auth middleware):**

| Method | Path | Change |
|--------|------|--------|
| GET | `/api/ticket-types` | Add auth middleware, filter by `req.user.organizationId` |
| POST | `/api/ticket-types` | Add auth middleware + admin check, set `organization_id` from context |
| PUT | `/api/ticket-types/:id` | Add auth middleware + admin check, scope to org |
| DELETE | `/api/ticket-types/:id` | Add auth middleware + admin check, scope to org |

**Signin response format:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": 1,
    "name": "John Doe",
    "admin": true,
    "organizationName": "Acme Corp"
  }
}
```

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|---------------------|-----------------|
| `database/init.sql` | Modified | Add organizations and users tables, alter ticket_types and tickets — **High risk**: breaking schema change | Write migration SQL, test on existing data |
| `backend/src/routes/ticketTypeRoutes.ts` | Modified | Add auth middleware, scope queries by org — **Medium risk** | Update all route handlers, update tests |
| `backend/src/services/ticketTypeService.ts` | Modified | Accept organizationId in all functions — **Medium risk** | Update function signatures and queries |
| `backend/src/index.ts` | Modified | Register new route files, update CORS — **Low risk** | Add route imports |
| `backend/src/routes/authRoutes.ts` | New | Signup and signin endpoints | Implement and test |
| `backend/src/routes/userRoutes.ts` | New | User CRUD endpoints | Implement and test |
| `backend/src/routes/organizationRoutes.ts` | New | Org settings endpoints | Implement and test |
| `backend/src/services/authService.ts` | New | Signup, signin, JWT logic | Implement and test |
| `backend/src/services/userService.ts` | New | User CRUD logic | Implement and test |
| `backend/src/services/organizationService.ts` | New | Org read/update logic | Implement and test |
| `backend/src/data/authMiddleware.ts` | New | JWT verification middleware | Implement and test |
| `frontend/src/pages/SignupPage.tsx` | New | Organization signup form | Implement and test |
| `frontend/src/pages/SigninPage.tsx` | New | Email/password signin form | Implement and test |
| `frontend/src/pages/DashboardPage.tsx` | New | Post-signin landing page | Implement and test |
| `frontend/src/pages/UsersPage.tsx` | New | Admin user management | Implement and test |
| `frontend/src/pages/OrganizationSettingsPage.tsx` | New | Admin org name editing | Implement and test |
| `frontend/src/store/AuthContext.tsx` | New | Auth state management | Implement |
| `frontend/src/router.tsx` | Modified | Add new routes, protect existing ones — **Medium risk** | Update routing config |
| `frontend/src/App.tsx` | Modified | Show org name in header, conditional nav items — **Low risk** | Update layout |

## Testing Approach

### Unit Tests

- **authService**: Test signup validation (email uniqueness, password length, required fields), signin credential verification, JWT generation with correct payload.
- **userService**: Test user creation validation, email uniqueness across orgs, admin self-delete prevention, org-scoped listing.
- **organizationService**: Test name update validation.
- **authMiddleware**: Test token extraction, verification, missing/invalid token handling.
- **Existing ticketTypeService**: Update tests to pass organizationId, verify org-scoped queries.

### Integration Tests

- **Auth routes**: Test POST `/api/signup` (success, duplicate email, missing fields), POST `/api/signin` (success, wrong password, nonexistent email).
- **User routes**: Test CRUD with valid admin token, rejection with regular user token, rejection without token.
- **Organization routes**: Test read/update with admin token, rejection with regular user.
- **Existing ticket-type routes**: Test with auth token, verify org scoping, verify admin-only mutations.
- **Frontend components**: Test SignupPage form validation and submission, SigninPage flow, ProtectedRoute redirect behavior, conditional navigation rendering.

## Development Sequencing

### Build Order

1. **Database migration** — Create organizations and users tables, alter ticket_types and tickets with organization_id, create default organization. No dependencies.
2. **Auth middleware** — Implement JWT verification middleware. Depends on step 1 (user schema).
3. **Auth service + routes** — Implement signup (atomic org + user creation) and signin (credential verification, JWT issuance). Depends on steps 1 and 2.
4. **Update ticketTypeService and routes** — Add organizationId parameter, apply auth middleware. Depends on steps 1 and 2.
5. **User service + routes** — Implement user CRUD scoped to organization. Depends on steps 1 and 2.
6. **Organization service + routes** — Implement org read/update. Depends on steps 1 and 2.
7. **Frontend AuthContext** — Implement auth state management (token storage, signin/signout functions). Depends on step 3 (signin API).
8. **Frontend SignupPage and SigninPage** — Build public auth pages. Depends on steps 3 and 7.
9. **Frontend ProtectedRoute + router update** — Protect routes, add new page routes. Depends on step 7.
10. **Frontend DashboardPage** — Build post-signin landing page. Depends on step 9.
11. **Frontend UsersPage** — Build admin user management page. Depends on steps 5 and 9.
12. **Frontend OrganizationSettingsPage** — Build admin org settings page. Depends on steps 6 and 9.
13. **Frontend App header update** — Show org name, conditional nav, signout. Depends on steps 7 and 9.
14. **Update TicketTypesPage** — Add auth headers to fetch calls. Depends on steps 4 and 7.

### Technical Dependencies

- `jsonwebtoken` and `@types/jsonwebtoken` npm packages must be installed in the backend
- `bcrypt` and `@types/bcrypt` npm packages must be installed in the backend
- `JWT_SECRET` environment variable must be configured
- PostgreSQL migration must run before any service implementation

## Monitoring and Observability

- Log failed signin attempts (email, timestamp) — do not log passwords
- Log signup events (organization name, timestamp)
- Log auth middleware rejections (invalid/expired token)
- Log user creation and deletion events (admin who performed the action, target user email)

## Technical Considerations

### Key Decisions

- **JWT payload includes organizationId and admin flag**: Reduces database lookups on authenticated requests. Trade-off: role changes require a new token (user must re-sign in).
- **Email globally unique across organizations**: Enables simple email-only signin without org selector. Trade-off: a user cannot belong to multiple organizations (documented as known constraint in PRD).
- **Password minimum 8 characters, no complexity rules**: Length is the most effective password security measure. Trade-off: slightly less secure than complexity requirements but significantly better UX.
- **Ticket type name uniqueness scoped to organization**: The current global LOWER(name) unique index is replaced with a composite index on (LOWER(name), organization_id). Each org can have its own "Bug" type.

### Known Risks

- **JWT secret management**: If JWT_SECRET is weak or leaked, all tokens are compromised. Mitigation: document that a strong random secret (32+ characters) must be used; never commit it to version control.
- **No token expiration enforcement on frontend**: Expired tokens will fail on API calls but the frontend won't proactively redirect. Mitigation: handle 401 responses globally in the frontend to redirect to signin.
- **Migration on production data**: ALTER TABLE with NOT NULL on existing rows requires care. Mitigation: test migration on a copy of production data before applying.

## Architecture Decision Records

- [ADR-001: All-in-one MVP for Signup/Signin and Multi-Tenant User Management](adrs/adr-001.md) — Deliver all features in a single phase rather than splitting into auth-first or structure-first phases.
- [ADR-002: JWT Stateless Authentication with bcrypt Password Hashing](adrs/adr-002.md) — Use stateless JWT tokens with bcrypt password hashing instead of server-side sessions or argon2.
- [ADR-003: Default Organization Migration Strategy for Tenant Scoping](adrs/adr-003.md) — Create a default organization and assign existing data to it instead of wiping data or using nullable foreign keys.
