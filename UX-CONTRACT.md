# UX Contract

## Product context

Personal Windows planner, English interface; local calendar dates and Monday-first weeks. Business sources: docs/MVP.md (scope), docs/RULES.md (lifecycle, deletion, streaks), docs/ARCHITECTURE.md (data boundaries). No billing, accounts or regulated market flows. Visual contract: DESIGN.md; runtime owner: src/styles/planner.css. Light and dark themes share components.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native select in shared forms and RoutineSchedule | DESIGN.md | native, Windows popup accepted | browser keyboard |
| Date | Native input in TaskForm/RoutineForm | docs/RULES.md | date/time, OS popup accepted | browser |
| Form | TaskForm and RoutineForm | docs/RULES.md | create/edit | component tests |
| Scrollbar | src/styles/planner.css | DESIGN.md | table horizontal overflow | rendered inspection |
| CRUD | TaskModal/RoutineModal with existing stores | docs/RULES.md | close after saved | persistence tests |
| Dialog | src/components/Modal.tsx | DESIGN.md | modal | keyboard and focus |

## Flow ledger

Desktop reminders follow docs/RULES.md, Desktop reminders. ReminderSettings owns immediate, acknowledged checkbox saves with busy locking, inline recovery and a stable status region; failed changes retain the saved value. It reuses Settings panel/option geometry and Button. RoutineForm owns the dated opt-in checkbox, disabled without a time. Windows owns toast styling/placement. Tray close preserves the webview and drafts; Quit ends the process. No sidebar navigation is added.

PlanTomorrowPage is a planning variant of the Today layout, accessed by a header link and Back to Today. TaskRow/RoutineSchedule own the planning mode without completion controls. TaskModal/RoutineModal accept optional save acknowledgements; failure preserves form inputs. RoutineForm defaults to This date only and requires explicit selection of This and future dates; consequences follow docs/RULES.md, Flexible daily schedules. The local-date hook refreshes day pages after midnight and focus; open forms keep their selected date.

RoutineHistory owns By day/By routine and date selection, including historical/archived records, a seven-date boundary and bounded table scrolling. These are transient, non-shareable desktop inspection states, intentionally not URL filters. RoutineLibrary owns reuse and re-adding removed dates for Daily Routine and Plan tomorrow. RoutineModal blocks close while saving/removing and only closes after acknowledgement. RoutinesPage uses Modal with cancel-first focus to confirm whole-routine archive; DeleteConfirmation retains permanent-delete scope across all dates.

Create and edit retain the caller's route and close after repository acknowledgement. Failure preserves input. Cancel returns to the triggering control. Destructive lifecycle remains unchanged, as specified in docs/RULES.md. DeleteConfirmation is the shared app-owned confirmation with cancel-first focus, busy state and inline failure recovery.

## Dataset navigation

Existing task filters and calendar navigation are retained. This visual pass does not change repository fetching, sorting or pagination. Large dataset paging remains follow-up work. Error must not be presented as an empty list.

## Validation and resilience

Existing save pending/error behavior is retained. Backend permission, mutation, retry and persistence logic is outside this changeset. Full native CRUD verification and unsaved draft guards remain open; do not infer them from appearance checks.

## Accessibility and verification

Settings customization is authorized by the 2026-09-07 user request and docs/RULES.md. OptionEditor reuses Modal/Button/field styles, closes after acknowledgement, retains failed inputs and blocks closing while saving. Hide/Show is reversible and preserves historical references. Option lists use bounded scrolling; no hard-delete action exists. RoutineIcon owns icon rendering and RoutineForm owns live preview. Native select ownership remains unchanged.

Target WCAG AA: shared focus styles, keyboard-operable controls, semantic schedule table, native modal containment and focus restoration. Narrow sidebar retains accessible route names. Non-drag task rescheduling remains available in Edit Task. Run build, tests and the premium audit. Browser-only preview cannot exercise Tauri SQLite; distinguish visual evidence from native persistence evidence.
