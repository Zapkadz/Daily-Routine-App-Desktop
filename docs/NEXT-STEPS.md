# Next Steps

Follow these tasks in order. The first unchecked item is the recommended next action.

## Immediate verification after 2026-09-07 fixes

- [x] Reproduce and fix ambiguous task JOIN ordering; add real SQLite repository reopen tests.
- [x] Show load errors separately from empty lists, with retry controls.
- [x] Align item-based Completion Rate and exempted/flexible routine progress.
- [ ] Confirm the running native app's effective database path if the user's two tasks remain missing; inspected database files contained zero tasks. Do not overwrite or merge databases automatically.

- [ ] Restart native app to activate updated SQLite write capability; create/edit/complete a task, restart and verify persistence.
- [ ] Create activities at 06:00 and 12:00, verify chronological Schedule rows, edit and complete them, then verify saved logs after restart.
- [ ] Visually verify Add Task and Routine dialogs in both light and dark themes.
- Automated checks cover theme ancestry, SQL capability, schedule order/status changes, and existing business logic; native startup alone is not an end-to-end save test.

## Step 1 — Scaffold the application

- [x] Create the Tauri Windows project.
- [x] Add React and TypeScript frontend.
- [x] Confirm development build runs on Windows.
- [x] Add basic app routing.

## Step 2 — Create the UI shell

- [x] Add sidebar navigation.
- [x] Add topbar and current date.
- [x] Add page-level empty states.
- [x] Add reusable Button and ProgressRing components.
- [x] Add reusable Modal component.
- [x] Add shared form-field styles; extract additional components only when a second real use case appears.
- [x] Create the Today page visual foundation.

## Step 3 — Create the database foundation

- [x] Add SQLite connection.
- [x] Add initial migration.
- [x] Create Task, Routine, RoutineLog, Category, DailyNote, and UserSettings tables.
- [x] Add the initial SQLite task repository layer.
- [x] Keep data access behind repository modules so test doubles can be introduced where needed.
- [x] Keep production free of demo task/routine data; built-in categories are product defaults, not demo content.

## Step 4 — Implement tasks

- [x] Replace Today page mock tasks with SQLite data.
- [x] Create task form.
- [x] Implement task list and filters.
- [x] Implement complete/incomplete behavior.
- [x] Implement archive behavior.
- [x] Implement task editing.
- [x] Implement scheduled date, due time, and priority.
- [x] Implement category selection and basic recurrence metadata.
- [x] Generate the next recurring occurrence exactly once when a recurring task is completed.
- [x] Add confirmed permanent delete while keeping archive as the default action.
- [x] Add task filter unit tests.

## Step 5 — Implement routines

- [x] Create routine form.
- [x] Implement routine schedule selection.
- [x] Create and update RoutineLog records.
- [x] Implement completed, skipped, and exempted states.
- [x] Add routine history.

## Step 6 — Implement streak services

- [x] Implement Planning Streak calculation.
- [x] Implement Completion Streak calculation.
- [x] Implement longest streak calculation.
- [x] Add tests for missing days, incomplete days, cancelled tasks, exempted routines, month boundaries, year boundaries, and leap years.

## Step 7 — Implement calendar views

- [x] Build Weekly Planner.
- [x] Build Monthly Planner.
- [x] Add Monday-first layout.
- [x] Add date navigation.
- [x] Add task creation from calendar.
- [x] Add task moving between dates.

## Step 8 — Implement analytics

- [x] Add KPI cards.
- [x] Add planning and completion rates.
- [x] Add heatmaps.
- [x] Add routine comparison chart.
- [x] Add weekly/monthly summaries.

## Step 9 — Package and verify

- [ ] Add JSON export.
- [ ] Add JSON import validation.
- [ ] Add settings page.
- [ ] Add light/dark mode if included in the release scope.
- [ ] Test app restart and data persistence.
- [ ] Test offline operation.
- [ ] Build Windows installer.
- [ ] Complete MVP acceptance checklist in `docs/MVP.md`.

## Definition of done for each task

- The feature works through the UI.
- Data is persisted correctly.
- Critical edge cases have tests.
- No existing MVP behavior is broken.
- `docs/PROGRESS.md` is updated.
