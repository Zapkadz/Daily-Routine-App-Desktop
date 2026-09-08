# Product and Business Rules

This file is the source of truth for behavior. If code and this file disagree, update the rule deliberately before changing implementation.

## Date and timezone

- The app is Windows-first.
- Use the Windows system timezone by default.
- Use calendar dates, not UTC dates, for daily planning.
- The first day of the week is Monday.
- A task or routine occurrence belongs to its `scheduledDate`.
- Changing an old date can change historical analytics and streaks.

## Task rules

- A task must have a title and scheduled date.
- A task may optionally have a time, description, priority, category, and recurrence.
- A completed task remains associated with its scheduled date.
- A cancelled task is excluded from Completion Rate and Completion Streak calculations.
- An archived task is hidden from normal active views but remains in historical data.
- Archiving sets `archivedAt` and must not overwrite whether the task was `todo`, `completed`, or `cancelled`.
- A task can be completed without completing any routine.

## Task recurrence rules

- MVP recurrence values are `daily`, `weekly`, and `monthly`.
- Completing a recurring task creates exactly one next occurrence.
- Reopening and completing the same source task again must not create a duplicate occurrence.
- Daily recurrence advances one calendar day.
- Weekly recurrence advances seven calendar days.
- Monthly recurrence advances one calendar month and clamps to the last valid day when necessary, such as January 31 to February 28 or 29.
- A generated occurrence keeps the source title, description, priority, category, due time, and recurrence rule.
- Editing an occurrence does not silently rewrite occurrences that were already generated.

## Routine rules

- Daily Routine is a daily activity schedule (Time / Event / Status), such as getting up, studying, lunch, and dinner.
- Display events chronologically in Today and Daily Routine. Existing activities without a time appear last as "Any time".
- `reminderTime` / `reminder_time` stores the event time. Notification delivery additionally requires the dated `reminderEnabled` flag and global Desktop reminders setting.
- Each activity keeps its own daily completion log, even when two activities have the same name at different times.

- A routine is a reusable definition; a `RoutineLog` records its status for one date.
- A routine must have a name and schedule.
- Supported MVP schedules:
  - Every day.
  - Selected weekdays.
  - Target number of days per week.
  - Custom dates (including a single date).
- `daily` routines are required on every calendar date from their start date.
- `weekdays` routines use ISO weekday numbers where Monday is 1 and Sunday is 7.
- `weekly_target` routines are flexible goals: they are available every day but are not automatically required on a specific date.
- A flexible `weekly_target` routine only contributes to daily completion analytics on a date where the user records a log for it.
- A flexible `weekly_target` routine by itself does not satisfy the scheduled-routine requirement for Planning Streak.
- `completed` means the routine was completed for that date.
- `skipped` means the routine was intentionally not completed and does not count as complete.
- `exempted` means the date is excluded from the routine's required completion calculation.
- Archiving a routine stops future occurrences but preserves historical logs.

## Desktop reminders (approved 2026-09-08)

- Global reminders and per-routine reminders default off; existing activities are not silently opted in. Sound and close-to-tray default on; Windows autostart is opt-in.
- Resolve the current local date's latest revision and explicit occurrence before selecting a reminder. Date-only and future-series edits also scope the reminder flag. A weekly target needs an explicit planned date.
- Announce only active, timed, opted-in, scheduled, pending routines. Removed, archived, completed, skipped and exempted activities are excluded. No todo notifications in this release.
- Wake near the next deadline; refresh on database writes, date/timezone/clock changes, and every five minutes as a recovery fallback. Rust samples the clock at most every 30 seconds without querying SQL each tick.
- Catch up only within five minutes of the scheduled local time, including restart/resume. Never wake a sleeping or powered-off PC. Windows controls banners, volume and Do not disturb.
- A durable routine/date claim precedes dispatch, preventing repeated attempts after restart, clock rollback or time edits. There is no exact-once OS delivery guarantee: a crash between claim and dispatch can miss that reminder. Failed/uncertain attempts are not automatically replayed.
- Closing hides the window when background mode is enabled, retaining in-progress forms. The tray exposes Open Daily Routine and Quit Daily Routine. Quit stops reminders. Only one app instance runs.
- Autostart is controlled separately using the current executable and `--background`. Turning off close-to-tray opens a normal window at login. Use an installed build for Windows app identity.

## Planning Streak calculation

A date qualifies for Planning Streak when both conditions are true:

1. At least one active Todo is scheduled for that date.
2. At least one active Daily Routine is scheduled for that date.

Completion status does not matter for Planning Streak.

If a user adds the missing task or routine later on the same date, that date qualifies immediately.

## Completion Streak

A date qualifies for Completion Streak when all conditions are true:

1. The date qualifies for Planning Streak.
2. Every non-cancelled todo scheduled for that date is completed.
3. Every required routine occurrence for that date is completed.

Exempted routine occurrences are excluded from the required routine count. Skipped occurrences are not complete.

## Current streak behavior

- Calculate backward over consecutive qualifying calendar dates.
- A missing date breaks the streak.
- A date without both a todo and a routine does not qualify for Planning Streak.
- A date with incomplete required items does not qualify for Completion Streak.
- The current day is allowed to remain unresolved while the day is still in progress; it should not immediately erase the previous streak before the day ends.
- If the user completes or adds the required data during the day, the value updates immediately.

## Longest streak behavior

- Longest streak is the maximum historical sequence of consecutive qualifying dates.
- Recalculating historical data must produce the same result as calculating it day by day.

## Analytics rules

### Planning Rate

```text
qualifying planning dates / dates with any app data * 100
```

### Completion Rate

```text
completed required tasks and routines / total required tasks and routines * 100
```

- Cancelled tasks are excluded.
- Exempted routine occurrences are excluded.
- Archived historical records remain available for analytics unless the user permanently deletes them.

## Deletion rules

- Prefer archive over destructive deletion in the UI.
- Permanent delete requires confirmation.
- Deleting a task or routine occurrence must trigger analytics and streak recalculation.

## Customization

Customization rules (2026-09-07): Settings manages category names and reversible visibility. Existing task references are preserved. Priority keys and order (none/low/medium/high) remain fixed; display labels can be renamed. Built-in routine icons can be renamed/hidden; custom emoji/symbol icons can be added/edited/hidden, with at least one enabled. Hidden icons remain on existing routines. The five routine colors and schedule/status/streak rules remain fixed. Customization persists in SQLite via migration 5. RoutineForm previews icon/color and RoutineSchedule renders them.

## Date entry rules (2026-09-07)

- New tasks and routines may only be created for today or a future local calendar date.
- Task dates and routine start dates use the Windows local date and expose today as the minimum date in the picker.
- The form also validates typed values, so a past date cannot be submitted by bypassing the picker.
- Existing tasks with historical dates remain editable without forcing a date migration. Routine schedule/name/time edits are today/future only; historical routine schedules are read-only.

## Plan tomorrow (approved 2026-09-08)

- Today links to `/plan/tomorrow`; no sidebar item is added. Back to Today returns to the live current day.
- Tomorrow uses the Windows local calendar date, advances with calendar arithmetic, and refreshes across midnight/focus. Open forms retain their explicit date and refresh their minimum valid date.
- Task and routine creation reuse existing repositories and forms, defaulting to tomorrow. Save acknowledges persistence; changing the date/schedule away from tomorrow explains where to find the saved item.
- Existing repeating routines appear when their schedule includes tomorrow. Weekly-target routines appear as Flexible, separate from scheduled count and first scheduled activity.
- Planning-mode task rows and routine tables offer no completion controls. No routine completion log is created by planning. Streaks remain anchored to the actual current date.
- Routine edits default to this date only. The user may explicitly replace the schedule from this date onward. One-off activities can use Custom dates; todos remain independent outcomes.
- Tasks planned and routines scheduled are counts for tomorrow. First activity is the earliest assigned task time or required routine time. Missing/unavailable data is not reported as zero.

## Flexible daily schedules (approved 2026-09-08)

- A routine combines an optional repeating rhythm with explicitly dated adjustments. All four schedule modes remain available; Custom dates is not a weekly target or an automatically recurring habit.
- Custom dates are required only on the dates chosen. A reusable activity with no occurrence on a date does not count toward that day's planning/completion metrics.
- Use an existing activity schedules the same routine ID on the chosen today/tomorrow date, with its own name, notes, icon, color and time. It creates no todo or completion log. One routine ID has at most one occurrence per date; distinct activities may share names.
- This date only saves an explicit occurrence override. Other dates and the repeating schedule do not change.
- This and future dates atomically replaces series revisions on/after the effective date, including any override on that effective date. Later explicit single-date adjustments remain authoritative. The dialog states this scope.
- Remove from this date is reversible through Use an existing activity / Add back. It excludes that date's activity from required counts, preserves logs and other dates, and is distinct from archiving the whole activity.
- Archive requires confirmation, hides the active definition and stops dates after its local archive date. History on/before the archive date remains visible. Permanent delete still requires explicit confirmation and removes all associated history.
- Last 7 days defaults to By day: actual dated name/time/status in chronological order. By routine is an optional comparison matrix; off days are not presented as missed activities. Archived routines remain in history.
- Custom dates and explicitly scheduled weekly-target activities count once as required, including in analytics and both streaks. Future plans do not affect today. Exempted/Skipped rules are unchanged.
- Migration 6 preserves IDs, existing logs and the latest legacy definition as a historical baseline. It cannot reconstruct names/times/schedules that older versions already overwrote. New edits preserve history from this upgrade onward.
