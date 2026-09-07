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
- The existing `reminderTime` / `reminder_time` field stores the event's time in this version; setting it does not imply notification delivery.
- Each activity keeps its own daily completion log, even when two activities have the same name at different times.

- A routine is a reusable definition; a `RoutineLog` records its status for one date.
- A routine must have a name and schedule.
- Supported MVP schedules:
  - Every day.
  - Selected weekdays.
  - Target number of days per week.
- `daily` routines are required on every calendar date from their start date.
- `weekdays` routines use ISO weekday numbers where Monday is 1 and Sunday is 7.
- `weekly_target` routines are flexible goals: they are available every day but are not automatically required on a specific date.
- A flexible `weekly_target` routine only contributes to daily completion analytics on a date where the user records a log for it.
- A flexible `weekly_target` routine by itself does not satisfy the scheduled-routine requirement for Planning Streak.
- `completed` means the routine was completed for that date.
- `skipped` means the routine was intentionally not completed and does not count as complete.
- `exempted` means the date is excluded from the routine's required completion calculation.
- Archiving a routine stops future occurrences but preserves historical logs.

## Planning Streak

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
- Existing records with historical dates remain editable without forcing a date migration. Keeping their original date is allowed for history; changing them to a different past date is not.

## Plan tomorrow (approved 2026-09-08)

- Today links to `/plan/tomorrow`; no sidebar item is added. Back to Today returns to the live current day.
- Tomorrow uses the Windows local calendar date, advances with calendar arithmetic, and refreshes across midnight/focus. Open forms retain their explicit date and refresh their minimum valid date.
- Task and routine creation reuse existing repositories and forms, defaulting to tomorrow. Save acknowledges persistence; changing the date/schedule away from tomorrow explains where to find the saved item.
- Existing repeating routines appear when their schedule includes tomorrow. Weekly-target routines appear as Flexible, separate from scheduled count and first scheduled activity.
- Planning-mode task rows and routine tables offer no completion controls. No routine completion log is created by planning. Streaks remain anchored to the actual current date.
- Routine edits affect the repeating definition; the planning page and edit dialog state this explicitly. One-off events use tasks with a time.
- Tasks planned and routines scheduled are counts for tomorrow. First activity is the earliest assigned task time or required routine time. Missing/unavailable data is not reported as zero.
