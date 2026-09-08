# Technical Architecture

## Dated routine schedules — migration 6

`routines` remains the identity/legacy definition table; its foreign keys and existing CHECK constraints are preserved. New `schedule_type = custom_dates` distinguishes the new mode while legacy `frequency_type` stores `weekdays` for those rows. Consumers must use the repository mapper, not raw frequency_type.

`routine_revisions(routine_id,effective_date,snapshot)` stores effective series definitions. Existing and newly inserted routines get a baseline at 0001-01-01, with their actual startDate inside the JSON snapshot. INSERT/UPDATE triggers atomically discard superseded later revisions and the override on the effective date.

`routine_occurrences(routine_id,date,snapshot,removed)` stores explicit date overrides and reversible removals. Snapshot fields: name, description, icon, color, frequencyType, frequencyRule, reminderTime, startDate. Unique routine/date prevents duplicate scheduling. Later explicit overrides take precedence over revisions. Logs remain separately keyed by routine/date.

`routineOnDate` and `routinesOnDate` are the shared read model. Never display base routine name/time for a dated screen or calculate inclusion from raw frequency fields. Required/available/active predicates resolve the relevant date internally. The store exposes active `routines` and historical `allRoutines`; history/analytics use the latter. Routine repository creation and schedule mutations validate local today/future dates.

Migration 6 is additive and runs through Tauri's normal migration mechanism. Tests apply it to both empty and populated v5 databases, check foreign keys and reopen persistence. Historical values already overwritten by pre-v6 code cannot be recovered; the migration preserves the best available baseline.

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
# Desktop reminder engine (2026-09-08)

`src-tauri/src/reminders.rs` owns native scheduling and Windows toast dispatch. SQL plugin preloads/migrates the existing database; the engine clones that same pool from DbInstances, avoiding an independently guessed file path. Migration 7 adds global settings, durable routine/date dispatch claims and per-routine opt-in; revision/occurrence JSON carries dated opt-in. Frontend acknowledged SQL writes wake the engine through `refresh_reminders`; wake failure does not invalidate an already committed save.

Queue resolution is native and covered by SQLite integration tests alongside the frontend resolver. Only the current local day's undelivered pending events are read. Waiting uses Tokio Notify plus a deadline capped at 30 seconds for local clock/resume checks. SQL reloads on changes, deadlines and a five-minute fallback. Single-instance plugin precedes SQL. Autostart plugin registers only after user action. Tray retains the webview to preserve drafts; it does not promise minimal WebView RAM. Precise memory use still needs process-tree measurement.

Windows notifications use winrt-notification directly so dispatch errors are observable. Installer supplies the app identity `com.dailyroutine.desktop`. No notification action buttons, snooze, wake-from-sleep, cloud push or Task Scheduler integration. OS-accepted dispatch does not establish a visible banner. Claims favor avoiding duplicate notifications over replay after crashes.
