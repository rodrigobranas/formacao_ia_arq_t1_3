# PRD: Ticket Type Management

## Overview

The Ticket Type Management feature enables users to configure the categories of tickets available in the support system. Ticket types (e.g., Dúvida, Inconsistência, Sugestão, Customização) define the nature of each support request and are a foundational entity required before tickets can be created.

This feature introduces a **Settings** area in the application with a sidebar menu, where Ticket Types is the first configurable entity. Users can create, view, edit, and delete ticket types through an inline table interface. The system ships with four pre-seeded types to provide immediate value.

**Who it is for:** All authenticated users of the ticketing system.

**Why it is valuable:** Without categorized ticket types, support requests lack structure, making triage, routing, and reporting impossible. This feature ensures every ticket is categorized from creation, enabling downstream workflows.

## Goals

- **100% ticket categorization**: Every ticket in the system must have a type assigned at creation time. Ticket types are a required field.
- **Self-service configuration**: Users can manage ticket types without developer intervention or database access.
- **Foundation for ticket workflow**: Provide a reliable, well-tested building block that the ticket creation, listing, and filtering features will depend on.

## User Stories

### All Users

- As a user, I want to see all available ticket types in a table so that I can understand what categories exist in the system.
- As a user, I want to create a new ticket type with a name and description so that I can add categories that match my organization's needs.
- As a user, I want to edit an existing ticket type inline so that I can correct or update its name and description without leaving the page.
- As a user, I want to delete a ticket type that is not in use so that I can remove categories that are no longer relevant.
- As a user, I want to be prevented from deleting a ticket type that is in use by existing tickets so that I don't break historical data.
- As a user, I want the system to come with default ticket types (Dúvida, Inconsistência, Sugestão, Customização) so that I can start working immediately without manual setup.
- As a user, I want to access ticket type management through a Settings menu so that configuration is organized and discoverable.

## Core Features

### 1. Ticket Type Listing

Display all ticket types in a table with columns for name and description. The table is the primary view of the Settings > Ticket Types page. Types are listed in alphabetical order by name.

### 2. Create Ticket Type

A "New" button above the table inserts an inline editable row where the user enters a name and description. The name field is required, must be unique (case-insensitive), and limited to 50 characters. The description field is optional and limited to 255 characters. On save, the new type appears in the table. On cancel, the inline row is removed.

### 3. Edit Ticket Type

Each row has an "Edit" action that transforms the row into an editable inline form. The user can modify the name and description with the same validation rules as creation. On save, the row returns to display mode with updated values. On cancel, changes are discarded.

### 4. Delete Ticket Type

Each row has a "Delete" action. Clicking it shows a confirmation dialog. If the type is in use by one or more tickets, deletion is blocked with a message explaining why. If not in use, the type is permanently removed after confirmation.

### 5. Pre-Seeded Default Types

The system ships with four default ticket types already in the database:

| Name           | Description                                      |
|----------------|--------------------------------------------------|
| Dúvida         | Chamados relacionados a dúvidas e esclarecimentos |
| Inconsistência | Relatos de comportamentos inesperados ou erros    |
| Sugestão       | Ideias e sugestões de melhoria                    |
| Customização   | Solicitações de personalização e ajustes          |

These can be edited or deleted by the user like any other type.

### 6. Settings Navigation

A Settings area accessible from the main application navigation. The Settings page includes a sidebar menu listing configuration categories. "Ticket Types" is the first (and initially only) menu item. This sidebar is designed to accommodate future settings categories.

## User Experience

### Entry Point

The main application navigation includes a "Settings" link (gear icon or label). Clicking it navigates to the Settings area.

### Settings Layout

The Settings page has a two-column layout:
- **Left sidebar**: Navigation menu listing configuration categories. "Ticket Types" is highlighted as the active item.
- **Main content area**: Displays the selected configuration page.

### Ticket Types Page Flow

1. **View**: User sees a table of all ticket types with Name and Description columns. Each row has Edit and Delete action buttons on the right.
2. **Create**: User clicks "+ New" button. An empty editable row appears at the top of the table with input fields for Name and Description, plus Save and Cancel buttons.
3. **Edit**: User clicks "Edit" on a row. The row transforms into editable input fields with the current values pre-filled, plus Save and Cancel buttons.
4. **Delete**: User clicks "Delete" on a row. A confirmation dialog appears. If the type is in use, an error message is shown instead and the operation is blocked.
5. **Validation feedback**: If the user submits an invalid form (empty name, duplicate name, exceeds length), inline error messages appear next to the relevant field.

### Empty State

If all types are deleted, the table area shows a message: "No ticket types configured. Click '+ New' to create one."

## Non-Goals (Out of Scope)

- **Ticket creation and listing**: This PRD covers only the ticket type configuration. Ticket CRUD is a separate, future feature.
- **Role-based access control**: All authenticated users have equal access to settings. RBAC is a future consideration.
- **Audit log**: Changes to ticket types are not tracked in an audit trail for this phase.
- **Import/Export**: No bulk import or export of ticket types.
- **Hierarchical categories**: Ticket types are a flat list. No parent-child relationships or sub-categories.
- **Internationalization (i18n)**: Pre-seeded types are in Portuguese. Multi-language support is not in scope.
- **Drag-and-drop reordering**: Types are listed alphabetically. Custom ordering is not in scope.

## Phased Rollout Plan

### MVP (Phase 1)

- Settings page with sidebar navigation
- Ticket Types page with full CRUD (list, create, edit, delete)
- Inline editing in the table
- Name (required, unique, max 50 chars) + Description (optional, max 255 chars)
- Pre-seeded default types (Dúvida, Inconsistência, Sugestão, Customização)
- Delete protection for types in use
- Validation with inline error messages
- Backend endpoints for all CRUD operations
- Database table and seed data

**Success criteria to proceed to Phase 2:** Users can manage ticket types end-to-end without errors. At least one ticket type exists in the system at all times (enforced by delete protection when only one remains, or by application convention).

### Phase 2

- Integration with ticket creation form (ticket type as required dropdown)
- Filtering and grouping tickets by type in the ticket list
- Ticket type usage statistics on the settings page (e.g., "Used by 12 tickets")

**Success criteria to proceed to Phase 3:** 100% of created tickets have a type assigned.

### Phase 3

- Ticket type active/inactive toggle (soft disable without deletion)
- Custom display order for ticket types
- Ticket type icons or color coding for visual distinction

## Success Metrics

- **Categorization rate**: 100% of tickets have a type assigned (measured after Phase 2 integration)
- **Self-service adoption**: Zero developer interventions required to manage ticket types after initial deployment
- **Data integrity**: Zero orphaned tickets (tickets referencing deleted types) — enforced by delete protection
- **User efficiency**: Ticket type CRUD operations complete in under 2 seconds (perceived performance)

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users delete all default types and are left with no categories | Tickets cannot be created without types | Phase 2 should enforce at least one type exists; MVP documents this as a convention |
| Duplicate type names cause confusion | Users create similar-sounding types | Enforce unique names (case-insensitive) at creation and edit time |
| Pre-seeded types don't match organization needs | Users must reconfigure before using the system | Default types are editable and deletable; they serve as examples, not constraints |
| Settings page grows complex with many categories | Navigation and discoverability degrade | Sidebar menu pattern scales well; group related settings as they're added |

## Architecture Decision Records

- [ADR-001: Inline Settings Page for Ticket Type Management](adrs/adr-001.md) — Chose inline table editing over dedicated CRUD pages or modal-based approach for simplicity and speed.

## Open Questions

1. Should the system prevent deletion of the last remaining ticket type to ensure at least one always exists?
2. Should there be a character minimum for the ticket type name (e.g., at least 2 characters)?
3. When Phase 2 integrates ticket creation, should the ticket type dropdown show types in alphabetical order or creation order?
