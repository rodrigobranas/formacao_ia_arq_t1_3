# PRD: Signup, Signin, and Multi-Tenant User Management

## Overview

This feature introduces multi-tenancy to the application through organization-based signup, user authentication, and role-based user management. Organizations act as tenants, isolating data (ticket types, tickets) per organization. The signup flow creates an organization and its founding admin user in a single step. Signin uses globally unique email and password. Admins manage users and organization settings; regular users can only access operational features within their organization.

This solves the current lack of access control and data isolation, enabling the product to serve multiple independent organizations from a single deployment.

## Goals

- Enable organizations to sign up and immediately start using the product with a founding admin
- Provide secure email/password authentication for all users
- Allow admins to create and manage users within their organization
- Isolate all existing data (ticket types, tickets) per organization (tenant)
- Display organization identity across the application
- Establish a clear permission model: admin users manage users and ticket types; regular users have read-only or restricted access

**Success criteria:**
- Organizations can sign up, sign in, and manage their team within a single session
- No data leaks between organizations — each organization sees only its own data
- Admin and regular user permissions are enforced consistently across all features

## User Stories

### Organization Founder (Admin)

- As an organization founder, I want to create my organization and admin account in a single signup flow so that I can start using the product immediately.
- As an admin, I want to sign in with my email and password so that I can securely access my organization's data.
- As an admin, I want to create users (name, email, password, admin flag) so that my team can access the system.
- As an admin, I want to view and manage all users in my organization so that I can maintain team membership.
- As an admin, I want to edit my organization's name so that it reflects our current identity.
- As an admin, I want to manage ticket types so that my team has the right categories available.

### Regular User

- As a regular user, I want to sign in with my email and password so that I can access my organization's data.
- As a regular user, I want to see my organization's name in the app so that I know which workspace I am in.
- As a regular user, I want to access the dashboard after signing in so that I can start working.
- As a regular user, I should NOT be able to manage users or ticket types, so that organizational control remains with admins.

## Core Features

### 1. Organization Signup

- Single-page form collecting: organization name, admin name, admin email, admin password
- Creates the organization and founding admin user atomically
- Admin email must be globally unique (not used in any other organization)
- Password confirmation field for safety
- On success, redirects to the signin page (or auto-signs in)

### 2. Signin

- Simple form with email and password fields
- Email is globally unique, so no organization selector is needed
- On success, creates a session and redirects to the dashboard
- Shows clear error messages for invalid credentials
- Provides a link to the signup page for new organizations

### 3. Dashboard (Placeholder)

- Landing page after successful signin
- Displays a welcome message with the user's name and organization name
- Serves as the future home for operational features
- Navigation to ticket types, user management (if admin), and organization settings (if admin)

### 4. User Management (Admin Only)

- List all users in the organization with name, email, and role (admin/regular)
- Create new users: name, email, password, admin boolean
- Delete users from the organization
- Admin cannot delete themselves (safety guard)
- Email uniqueness validated globally on user creation

### 5. Organization Settings (Admin Only)

- View current organization name
- Edit organization name
- Only accessible to admin users

### 6. Role-Based Access Control

- Two roles: admin (boolean true) and regular user (boolean false)
- Admins can: manage users, manage ticket types, edit organization settings
- Regular users can: view the dashboard, access operational features (tickets)
- Navigation items and screens restricted based on role
- Unauthorized access attempts show an appropriate error or redirect

### 7. Tenant-Scoped Data

- Ticket types become scoped to the organization that created them
- Tickets become scoped to the organization
- All queries filter by the authenticated user's organization
- No cross-organization data visibility

### 8. App Header with Organization Name

- The application header displays the current organization's name
- Visible to all authenticated users
- Provides navigation context and identity

## User Experience

### Signup Flow

1. User navigates to the signup page
2. Fills in: organization name, their name, email, and password (with confirmation)
3. Submits the form
4. System validates all fields (email uniqueness, password match, required fields)
5. On success: organization and admin are created, user is redirected to signin (or auto-signed in)
6. On failure: clear inline error messages indicate what needs to be fixed

### Signin Flow

1. User navigates to the signin page
2. Enters email and password
3. On success: session is created, user is redirected to the dashboard
4. On failure: generic "invalid credentials" message (no email enumeration)

### Post-Signin Navigation

- Dashboard is the default landing page
- App header shows organization name and user name
- Navigation includes: Dashboard, Ticket Types, User Management (admin only), Organization Settings (admin only)
- Sign-out option available from the header

### User Management Flow (Admin)

1. Admin navigates to User Management
2. Sees a table of all users in the organization
3. Can create a new user via an inline form or modal (name, email, password, admin toggle)
4. Can delete a user (with confirmation dialog)
5. Validation errors shown inline

### Organization Settings Flow (Admin)

1. Admin navigates to Organization Settings
2. Sees current organization name
3. Can edit and save the organization name
4. Success/error feedback shown inline

## High-Level Technical Constraints

- Email must be globally unique across all organizations to enable simple email + password signin
- Session management must ensure users can only access their own organization's data
- All existing features (ticket types, tickets) must be retrofitted with organization scoping
- Password must be stored securely (never in plain text)

## Non-Goals (Out of Scope)

- Email verification or confirmation flow
- Password recovery / "forgot password" functionality
- User invitation via email link
- Single Sign-On (SSO) or OAuth integration
- Multiple organization membership per user
- User profile editing (users editing their own name/password)
- Audit logging of user actions
- Rate limiting on signin attempts
- Two-factor authentication (2FA)
- Organization deletion
- User self-registration (only admins create users)

## Phased Rollout Plan

### MVP (Phase 1) — This PRD

- Organization signup (org name + admin credentials)
- Signin with email and password
- Dashboard placeholder
- User management (admin creates/lists/deletes users)
- Organization settings (admin edits org name)
- Role-based access (admin vs regular)
- Tenant-scoped ticket types and tickets
- Organization name in app header

**Success criteria:** An organization can sign up, the admin can create team members, all users can sign in, and each organization sees only its own data.

### Phase 2 (Future)

- Password recovery flow
- User profile editing (change own name/password)
- Email invitations for new users
- Audit logging

### Phase 3 (Future)

- SSO / OAuth integration
- Two-factor authentication
- Advanced roles and permissions (beyond admin boolean)
- Organization billing and subscription management

## Success Metrics

- **Signup completion rate**: percentage of users who start the signup form and successfully create an organization
- **Signin success rate**: percentage of signin attempts that succeed on first try
- **Time to first team member**: time from organization creation to first additional user being created
- **Tenant isolation correctness**: zero cross-organization data leaks (verified through testing)
- **Admin adoption**: percentage of organizations with more than one user within the first week

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low signup completion due to too many fields | Fewer organizations onboarded | Keep signup form minimal (4 fields only) |
| Admins forgetting passwords with no recovery flow | Users locked out | Phase 2 adds password recovery; for MVP, another admin can recreate the user |
| Email uniqueness causing friction for users in multiple teams | Users unable to join a second organization | Documented as a known constraint; Phase 2+ may revisit multi-org membership |
| Retrofitting tenant scoping breaks existing ticket data | Data loss or incorrect behavior | Thorough migration testing; existing data assigned to a default organization or handled via migration strategy |

## Architecture Decision Records

- [ADR-001: All-in-one MVP for Signup/Signin and Multi-Tenant User Management](adrs/adr-001.md) — Deliver all signup, signin, user management, and tenant scoping in a single phase rather than splitting into auth-first or structure-first phases.

## Open Questions

1. Should the signup flow auto-sign in the user after creating the organization, or redirect to the signin page?
2. What should happen to existing ticket types and tickets data when tenant scoping is introduced? (Assign to a default org? Require migration?)
3. Should there be a minimum password length or complexity requirement?
4. Can an admin remove the admin flag from another admin, or is the founding admin always an admin?
