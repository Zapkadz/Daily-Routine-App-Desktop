# Daily Routine Desktop

## Open from Desktop

Double-click the `Daily Routine` shortcut on the Windows Desktop. It points to `src-tauri/target/release/daily-routine-desktop.exe`, which embeds the frontend and does not require a terminal or development server. Keep this project directory in place. Source changes require rebuilding the standalone executable.

Release executable built on 2026-09-07. Installer packaging is still pending: the bundle step reported a missing `.ico` icon. The Desktop shortcut uses the standalone executable.

Windows desktop app for daily task planning, routine tracking, streaks, weekly/monthly planning, and analytics.

## Project status

The core daily workflow, Weekly and Monthly planners, streak engines, and Analytics dashboard are complete. The Windows app persists planning data in local SQLite and runs without an internet connection. Export/import, settings polish, persistence QA, and Windows packaging are next.

The project specification is intentionally stored as Markdown so that another developer or model can continue the work without relying on chat history.

## Source of truth

- [MVP specification](docs/MVP.md) — what must ship in the first version.
- [Product and business rules](docs/RULES.md) — exact behavior for tasks, routines, streaks, dates, and analytics.
- [Technical architecture](docs/ARCHITECTURE.md) — proposed stack, modules, data model, and code structure.
- [Progress log](docs/PROGRESS.md) — current status and completed work.
- [Next steps](docs/NEXT-STEPS.md) — the next implementation tasks in order.

## Product decisions

- Platform: Windows desktop only.
- UI language: English.
- Week starts on Monday.
- Storage: local-first SQLite database.
- Internet is not required for the MVP.
- Google Calendar integration is planned for Phase 2.
- There are two streaks: Planning Streak and Completion Streak.

## How to continue the project

1. Read `docs/MVP.md`.
2. Read `docs/RULES.md` before implementing date or streak logic.
3. Read `docs/PROGRESS.md` to see the current state.
4. Follow `docs/NEXT-STEPS.md` in order.
5. Update `docs/PROGRESS.md` after each meaningful implementation step.
6. Update `docs/RULES.md` if a product rule changes; do not silently change behavior in code only.
