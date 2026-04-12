---
status: completed
title: "Docker Compose with PostgreSQL and database init script"
type: infra
complexity: low
dependencies: ["task_01"]
---

# Docker Compose with PostgreSQL and database init script

## Overview

Create the Docker Compose configuration and SQL init script that provision a PostgreSQL 16 container with automatic schema initialization. This eliminates database setup friction for students — a single `docker compose up -d` gives them a working database with the initial schema already applied (per ADR-004).

<critical>
- Read the PRD and TechSpec before implementing
- Reference TechSpec "Data Models" and "Implementation Design" sections
- Focus on WHAT needs to be built, not HOW
- Minimize code — only the minimal schema needed for the skeleton
- Tests required for every task
</critical>

<requirements>
1. `docker-compose.yml` MUST use PostgreSQL 16 image.
2. `docker-compose.yml` MUST expose port 5432 on localhost.
3. Database credentials MUST match the backend `.env.example` defaults: database `app`, user `postgres`, password `postgres`.
4. `database/init.sql` MUST be volume-mounted to `/docker-entrypoint-initdb.d/init.sql` for automatic execution on first container start.
5. `database/init.sql` MUST create the `health_check` table with `id SERIAL PRIMARY KEY` and `checked_at TIMESTAMP DEFAULT NOW()`.
6. A named volume SHOULD be used for PostgreSQL data persistence between container restarts.
</requirements>

## Subtasks

- [x] Create `database/` directory and `database/init.sql` with the health_check table schema
- [x] Create `docker-compose.yml` with PostgreSQL 16 service, port mapping, credentials, and volume mounts
- [x] Verify `docker compose up -d` starts PostgreSQL and executes init.sql
- [x] Verify the `health_check` table exists after container initialization

## Implementation Details

Files to create:
- `docker-compose.yml` (root) — PostgreSQL 16 service configuration
- `database/init.sql` — initial schema with health_check table

Reference TechSpec "Data Models" section for the exact SQL schema and "Impact Analysis" for the Docker Compose configuration.

### Relevant Files

- No existing files — greenfield.

### Dependent Files

- `backend/src/database.ts` (task_03) — will connect to this PostgreSQL instance using the configured credentials
- `backend/.env.example` (task_03) — credentials must match docker-compose.yml values
- `Makefile` (task_05) — `db:reset` target will reference `docker compose down -v`

### Related ADRs

- [ADR-004: SQL Init Script via Docker Compose Volume](adrs/adr-004.md) — auto-executed init.sql over programmatic schema setup

## Deliverables

- [x] `docker-compose.yml` with PostgreSQL 16 service
- [x] `database/init.sql` with health_check table
- [x] Docker Compose starts successfully and schema is applied
- [x] Test: verify table creation after container init

## Tests

### Unit Tests

- No unit tests applicable — infrastructure configuration only.

### Integration Tests

- `docker compose up -d` starts PostgreSQL container without errors.
- `docker compose exec postgres psql -U postgres -d app -c "\dt"` lists the `health_check` table.
- `docker compose down -v && docker compose up -d` recreates the schema cleanly.

## Success Criteria

- PostgreSQL 16 container starts and is accessible on localhost:5432
- `health_check` table is automatically created on first container initialization
- Credentials match: database=app, user=postgres, password=postgres
- Volume recreation (`docker compose down -v`) cleanly resets the database
- All tests passing
- Test coverage >= 80% (N/A for infra-only task)
