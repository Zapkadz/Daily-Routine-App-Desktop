# Technical Architecture

## Recommended stack

- Desktop shell: Tauri.
- UI: React + TypeScript.
- Styling: a small internal design system using CSS or utility classes.
- Local database: SQLite.
- State: lightweight client state store.
- Charts: a chart library supporting bar, donut, line, and heatmap views.
- Testing: unit tests for date, recurrence, streak, and analytics logic; component tests for critical UI.

## Architecture layers

```text
UI
├── Pages
├── Components
├── Calendar views
└── Analytics widgets

Application
├── Task service
├── Routine service
├── Streak service
├── Analytics service
└── Backup/import service

Data
├── SQLite connection
├── Repositories
├── Migrations
└── Export/import serializers
```

## Core entities

### Task

```text
id
title
description
status: todo | completed | cancelled | archived (legacy-compatible; new archive operations use archivedAt)
priority
categoryId
scheduledDate
dueTime
recurrenceRule
recurrenceSourceId
createdAt
completedAt
archivedAt
```

New archive operations preserve the task's completion status and set `archivedAt`. Active queries filter on `archivedAt IS NULL`.

`recurrenceSourceId` points to the occurrence that generated a task. A unique partial index prevents one source occurrence from generating multiple next occurrences.

### Routine

```text
id
name
description
icon
color
frequencyType
frequencyRule
reminderTime
isActive
createdAt
archivedAt
```

### RoutineLog

```text
id
routineId
date
status: pending | completed | skipped | exempted
completedAt
note
```

### Category

```text
id
name
color
icon
```

### DailyNote

```text
id
date
content
mood
energyLevel
```

### UserSettings

```text
id
theme
language
weekStartsOn
timezone
dateFormat
```

## Suggested project structure

```text
src/
├── app/
├── components/
├── features/
│   ├── tasks/
│   ├── routines/
│   ├── calendar/
│   ├── analytics/
│   └── settings/
├── pages/
├── services/
│   ├── taskService/
│   ├── routineService/
│   ├── streakService/
│   └── analyticsService/
├── database/
│   ├── migrations/
│   ├── repositories/
│   └── connection/
├── stores/
├── types/
├── utils/
│   ├── date/
│   ├── recurrence/
│   └── formatting/
└── styles/
```

## Implementation constraints

- Do not put streak calculations directly in UI components.
- Do not use display-formatted dates as database keys.
- Store dates in a consistent local calendar-date format for daily records.
- Keep task definitions separate from routine definitions and routine logs.
- Every data mutation should invalidate or recalculate affected analytics.
- Add migrations for schema changes; do not manually overwrite user databases.
- Add tests before changing streak behavior.

## Future integration boundary

Google Calendar should be implemented as a separate integration module in Phase 2. It must not leak Google-specific IDs or OAuth assumptions into the core Task or Routine entities.
