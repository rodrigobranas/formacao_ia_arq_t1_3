# Implementation Task: task_05.md

## Task Context

- **Title**: Install Recharts and create KpiCard component
- **Type**: frontend
- **Complexity**: medium
- **Dependencies**: task_02


<required_skills>
- `cy-workflow-memory`: required when workflow memory paths are provided for this task
- `cy-execute-task`: required end-to-end workflow for a PRD task
- `cy-final-verify`: required before any completion claim or automatic commit
</required_skills>

<critical>
- Use installed `cy-workflow-memory` before editing code when workflow memory paths are provided below.
- Use installed `cy-execute-task` as the execution workflow for this task.
- Read `AGENTS.md`, `CLAUDE.md`, and the PRD documents under `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/service-metrics-dashboard` before editing code.
- Treat the task specification below plus the supporting PRD documents, especially `_techspec.md` and `_tasks.md`, as the source of truth.
- Keep scope tight to this task and record meaningful follow-up work instead of expanding scope silently.
- Use installed `cy-final-verify` before any completion claim or automatic commit.
- Automatic commits are disabled for this run (`--auto-commit=false`).
</critical>

## Workflow Memory

- Memory directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/service-metrics-dashboard/memory`
- Shared workflow memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/service-metrics-dashboard/memory/MEMORY.md`
- Current task memory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/service-metrics-dashboard/memory/task_05.md`
- Use installed `cy-workflow-memory` before editing code and before finishing the task.
- Read both memory files before implementation. Promote durable cross-task context only to shared workflow memory.
- Keep task-local decisions, learnings, touched surfaces, and corrections in the current task memory file.


## Task Specification

---
status: pending
title: Install Recharts and create KpiCard component
type: frontend
complexity: medium
dependencies:
  - task_02
---

# Task 5: Install Recharts and create KpiCard component

## Overview

Install the Recharts charting library and build the reusable KpiCard component that displays a single metric with its label, value, and icon. This component is the primary visual building block of the dashboard's real-time view, used to render all 6 KPI indicators.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST install `recharts` as a frontend dependency
- MUST create a `KpiCard` component that accepts label, value, and icon props
- MUST use Tailwind CSS for styling, consistent with the existing shadcn/ui design system
- MUST display a large, prominent number for the value
- MUST display a muted label below or above the value
- MUST accept and render a Lucide React icon
- MUST handle both number and string values (e.g., "4.5h" for avg resolution time, "2h 15m" for oldest ticket age)
- MUST use the existing shadcn/ui card patterns and color conventions
</requirements>

## Subtasks
- [ ] 5.1 Install Recharts in the frontend package
- [ ] 5.2 Create the KpiCard component with label, value, and icon props
- [ ] 5.3 Style the component with Tailwind to match existing dashboard design
- [ ] 5.4 Write component tests for KpiCard

## Implementation Details

Run `npm install recharts` in `packages/frontend/`. Create `packages/frontend/src/components/ui/KpiCard.tsx`. The component should be a simple presentational card using Tailwind classes consistent with the existing UI components. See TechSpec "Core Interfaces" section for the `KpiCardProps` interface.

### Relevant Files
- `packages/frontend/src/components/ui/button.tsx` — Pattern for shadcn/ui component structure (CVA, className merging)
- `packages/frontend/src/components/ui/skeleton.tsx` — Skeleton component for loading states
- `packages/frontend/src/pages/DashboardPage.tsx` — Existing card styling patterns (rounded-xl, border-border/60)
- `packages/frontend/package.json` — Where Recharts dependency will be added

### Dependent Files
- `packages/frontend/src/pages/DashboardPage.tsx` (task_06) — Will import and use KpiCard
- `packages/frontend/src/pages/TrendsTab.tsx` (task_07) — Will use Recharts for charts

### Related ADRs
- [ADR-002: Charting Library — Recharts](../adrs/adr-002.md) — This task installs and begins using the chosen charting library

## Deliverables
- Recharts installed as a frontend dependency
- `packages/frontend/src/components/ui/KpiCard.tsx` component
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] KpiCard renders the label text correctly
  - [ ] KpiCard renders a numeric value (e.g., 24)
  - [ ] KpiCard renders a string value (e.g., "4.5h")
  - [ ] KpiCard renders the provided icon
  - [ ] KpiCard applies correct Tailwind styling classes
  - [ ] KpiCard renders with value of 0 (edge case — should show "0", not empty)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Recharts installed and importable
- KpiCard renders correctly with various value types
- Visual style is consistent with existing dashboard cards


## Task Files

- PRD directory: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/service-metrics-dashboard`
- Task file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/service-metrics-dashboard/task_05.md`
- Master tasks file: `/Users/rodrigobranas/development/workspace/branas/arqiat1/.compozy/tasks/service-metrics-dashboard/_tasks.md`
- Use these exact paths when `cy-execute-task` updates task tracking.
- Execute every explicit `Validation`, `Test Plan`, or `Testing` item from the task and supporting PRD docs.
- Update task checkboxes and task status only after implementation, verification evidence, and self-review are complete.
- Update the master tasks file only when the current task is actually complete.
- Keep tracking-only files out of automatic commits unless the repository explicitly requires them to be staged.
- Do not create an automatic commit for this run. Leave the diff ready for manual review.
