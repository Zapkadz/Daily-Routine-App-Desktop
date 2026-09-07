# Progress Log

Last updated: 2026-09-07  
Current phase: Core feature set complete / Packaging and release QA next  
Overall status: Tasks, routines, calendars, streaks, and analytics are live

## Completed

### 2026-09-07 — Reload failure and persistence audit

- Fixed task list JOIN ordering: `created_at` existed in both tasks and categories, causing SQLite to reject every list reload. Qualified all ORDER BY columns with `tasks`.
- Task errors no longer display a misleading empty-state message. Added retry on Today, Tasks, Weekly, and Monthly.
- Failed database connection initialization can now be retried.
- Added file-backed SQLite integration tests that run the actual repository methods and migrations: two task creation/reopen/list, completion, date moving, recurrence duplicate prevention, routine log persistence, and archived analytics history.
- Corrected Analytics Completion Rate to the documented item-based formula and aligned Today progress with exempted/flexible routine logs.
- Verification: build passed; 27 tests passed. This verifies repository behavior on SQLite, not the entire native Windows UI restart flow.
- Read-only inspection found zero tasks in both discovered app databases (normal Roaming and Codex package LocalCache Roaming); quick_check returned ok for both. User's reported two tasks have NOT been recovered or located. Do not claim otherwise.
- Prior claims that all core features were complete were too broad: native save/restart QA and the remaining release checklist are still required.

### 2026-09-07 — User-reported defects

- Fixed transparent dialogs: portals now render under the app theme scope; panels also have an opaque fallback and bounded scrolling.
- Fixed missing `sql:allow-execute` capability. The previous `sql:default` only allowed reads/load/close, so frontend task and routine writes were blocked.
- Preserve string errors from Tauri instead of replacing them with a generic save error.
- Replaced routine cards on Today and Daily Routine with a chronological Time / Event / Status schedule.
- Kept existing recurrence definitions and daily logs; no user data migration or deletion.
- Added regression coverage for dialog theme ancestry, SQL write capability, schedule order, and status interaction.
- Verification: production build and cargo check pass. Full native click-through persistence verification still required; earlier startup-only checks did not establish that create/save worked.

- [x] Product concept defined.
- [x] Visual direction reviewed from supplied reference images.
- [x] Windows-only platform selected.
- [x] English UI selected.
- [x] Monday selected as first day of week.
- [x] Local-first MVP selected.
- [x] Weekly Planner defined.
- [x] Monthly Planner defined.
- [x] Planning Streak defined.
- [x] Completion Streak defined.
- [x] Google Calendar moved to Phase 2.
- [x] MVP scope documented.
- [x] Business rules documented.
- [x] Technical architecture documented.
- [x] Tauri Windows project created.
- [x] React and TypeScript frontend configured.
- [x] Hash-based application routing configured.
- [x] Sidebar navigation and page shell implemented.
- [x] Today Dashboard visual foundation implemented.
- [x] Local/offline styling configured without remote font dependencies.
- [x] Rust stable toolchain installed and activated.
- [x] SQLite plugin and initial migration configured.
- [x] Task, Routine, RoutineLog, Category, DailyNote, and UserSettings tables created.
- [x] Development app launched successfully on Windows.
- [x] Frontend production build verified.
- [x] Rust `cargo check` verified.
- [x] npm dependency audit verified with zero known vulnerabilities.
- [x] Git repository initialized for versioned development.
- [x] Task types and SQLite repository implemented.
- [x] Task state store implemented.
- [x] Create Task modal implemented.
- [x] Today task mock data replaced with SQLite-backed data.
- [x] Tasks page and All/Today/Upcoming/Overdue/Completed filters implemented.
- [x] Complete/uncomplete task behavior implemented.
- [x] Archive task behavior implemented.
- [x] Task edit flow implemented.
- [x] Built-in Work, Personal, Health, and Home categories added through migration 2.
- [x] Category and daily/weekly/monthly recurrence metadata added to task forms.
- [x] Task filter unit tests added.
- [x] Archive behavior preserves completion status for historical analytics.
- [x] Recurrence service implemented for daily, weekly, and monthly tasks.
- [x] Migration 3 added recurrence source tracking and duplicate prevention.
- [x] Completing a recurring task generates exactly one next occurrence.
- [x] Confirmed permanent task deletion implemented inside Edit Task.
- [x] Seven task filtering and recurrence tests passing.
- [x] Routine types, SQLite repository, and state store implemented.
- [x] Routine create/edit/archive/permanent-delete flows implemented.
- [x] Daily, selected-weekday, and flexible weekly-target schedules implemented.
- [x] Routine completed, skipped, exempted, and pending logs implemented.
- [x] Today Dashboard routines replaced with SQLite-backed data.
- [x] Seven-day routine history grid implemented.
- [x] Migration 4 added routine start dates.
- [x] Twelve total tests passing after routine schedule tests.
- [x] React/Zustand empty-log selector runtime loop found and fixed during native testing.
- [x] Analytics repository implemented for historical task/routine/log data.
- [x] Daily streak-state builder implemented.
- [x] Current and longest Planning Streak implemented.
- [x] Current and longest Completion Streak implemented.
- [x] Today Dashboard streak cards connected to live SQLite history.
- [x] Current-day unresolved behavior implemented without erasing yesterday's streak.
- [x] Eighteen total tests passing after streak edge-case coverage.
- [x] Monday-first Weekly Planner implemented.
- [x] Monday-first Monthly Planner implemented.
- [x] Previous, Today, and Next calendar navigation implemented.
- [x] Task creation and editing from calendar dates implemented.
- [x] Drag-and-drop task movement between dates implemented.
- [x] Weekly routine completion summaries implemented.
- [x] Twenty total tests passing after calendar range coverage.
- [x] Analytics KPI cards implemented.
- [x] Planning and Completion Rates implemented.
- [x] Combined planning/completion yearly heatmap implemented.
- [x] Routine completion comparison implemented.
- [x] Weekly, monthly, and selected-year task completion summaries implemented.
- [x] Seven-day and thirty-day completion summaries implemented.
- [x] Twenty-two total tests passing after analytics coverage.

## Not started

- [ ] Add export/import.
- [ ] Build Windows installer.

## Current blocker

None.

## Latest verification

### 2026-09-06 — Foundation milestone

- `npm run build`: passed.
- `npm audit`: zero known vulnerabilities.
- `cargo check --manifest-path src-tauri/Cargo.toml`: passed.
- `npm run tauri dev`: launched `daily-routine-desktop.exe` successfully.
- Git repository initialized; no commit has been created yet.
- SQLite database created at the app data directory.
- Verified tables: `_sqlx_migrations`, `categories`, `daily_notes`, `routine_logs`, `routines`, `tasks`, and `user_settings`.
- Today tasks are live SQLite data; routine and streak cards are still presentation-only.

### 2026-09-06 — Task persistence checkpoint

- `npm run build`: passed after task repository/store/UI integration.
- `npm test`: 3 task-filter tests passed.
- `npm run tauri dev`: relaunched successfully; window remained responsive.
- Migration 2 applied successfully and installed four built-in categories.
- Task create/list/complete/archive operations are wired to SQLite through the Tauri SQL plugin.
- Task editing, categories, and recurrence metadata are wired to SQLite.
- Task SQL lifecycle was verified in a rollback transaction; no test data was retained.
- Routine cards and streak cards are still presentation-only until Routine and Streak milestones are implemented.
- Migration 3 applied successfully and recurrence source index verified.
- `npm test`: 7 tests passed across task filtering and recurrence date logic.

### 2026-09-06 — Routine milestone

- `npm run build`: passed.
- `npm test`: 12 tests passed.
- `cargo check`: passed.
- Migration 4 applied successfully and `start_date` verified.
- Routine create/log/upsert/archive SQL lifecycle verified in a rollback transaction.
- Native runtime re-tested after fixing a React/Zustand selector loop.
- Next milestone: Planning Streak, Completion Streak, and longest streak calculations.

### 2026-09-06 — Streak milestone

- `npm run build`: passed.
- `npm test`: 18 tests passed.
- `npm audit`: zero known vulnerabilities.
- Native Tauri runtime launched with live analytics queries and no console errors.
- Planning and Completion streak cards now use calculated SQLite history.
- Next milestone: Monday-first Weekly and Monthly Planner views.

### 2026-09-06 — Calendar milestone

- `npm run build`: passed.
- `npm test`: 20 tests passed across five test files.
- `cargo check`: passed.
- Native Tauri runtime launched successfully with the Weekly and Monthly routes.
- Weekly and Monthly planners use Monday-first date ranges.
- Tasks can be created, edited, and moved between dates from the calendars.
- Next milestone: Analytics dashboard.

### 2026-09-06 — Analytics milestone

- `npm run build`: passed.
- `npm test`: 22 tests passed across six test files.
- Native Tauri runtime launched with the Analytics route and no application console errors.
- Analytics now derives KPI values, both streak types, rates, yearly heatmap cells, routine comparisons, and task summaries from SQLite history.
- Next milestone: JSON export/import, settings, persistence/offline QA, and Windows packaging.

## Working agreement for future updates

- Update this file after each completed implementation milestone.
- Record important decisions in `docs/RULES.md` or `docs/ARCHITECTURE.md`.
- Do not mark a feature complete until its core behavior and critical tests work.
- If a requirement changes, add a dated note under Decision History.

## Decision history

### 2026-09-06 — Initial product freeze

- Windows desktop only.
- English first.
- Monday-first calendar.
- Local SQLite MVP.
- Planning Streak counts days with both a routine and a todo.
- Completion Streak counts days where all required routines and todos are completed.
- Google Calendar is Phase 2.

### 2026-09-06 — Implementation baseline

- Tauri + React + TypeScript + SQLite foundation accepted.
- App routing uses `HashRouter` to remain reliable inside the desktop WebView.
- UI assets and fonts must work offline.
- The next implementation milestone is Weekly and Monthly Planner views.
