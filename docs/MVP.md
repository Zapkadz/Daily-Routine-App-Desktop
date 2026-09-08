# MVP Specification

Version: 1.0  
Status: Approved for implementation  
Platform: Windows desktop  
UI language: English

## Goal

Create a calm, minimalist desktop planner that combines daily todos, daily routines, weekly/monthly planning, streaks, and basic analytics in one offline-capable application.

## In scope

### Today dashboard

- Show the current date and a short greeting.
- Show today's todos.
- Show today's daily routines.
- Show today's planning and completion progress.
- Show current Planning Streak and Completion Streak.
- Add a task quickly.
- Add a routine quickly.
- Optional daily note.

### Tasks

- Create, edit, archive, and delete tasks.
- Mark tasks complete or incomplete.
- Set title, description, date, time, priority, category, and recurrence.
- Show Today, Upcoming, Overdue, Completed, and All Tasks views.
- Filter and sort tasks.

### Daily routines

- Create, edit, archive, and delete routines.
- Set routine name, description, icon, color, schedule, and reminder time.
- Support every day, selected weekdays, a target number of days per week, and Custom dates.
- Reuse activities and override individual dates; explicitly choose this date only or this and future dates when editing.
- Preserve historical schedule definitions and view Last 7 days by day (default) or by routine.
- Record a daily routine log.
- Mark a routine completed, skipped, or exempted.
- Show routine history and streaks.

### Calendar

- Weekly Planner with Monday-Sunday columns.
- Monthly Planner with Monday-first weeks.
- Navigate backward and forward.
- Jump to Today.
- Create tasks from calendar cells.
- Move tasks to another date.
- Show daily task and routine indicators.

### Analytics

- Active Routines.
- Tasks Completed.
- Planning Streak.
- Completion Streak.
- Longest Planning Streak.
- Longest Completion Streak.
- Planning Rate.
- Completion Rate.
- Planning heatmap.
- Completion heatmap.
- Completion by routine.
- Tasks completed by day/week/month.

### Local data and desktop behavior

- Store data locally in SQLite.
- Work without an internet connection.
- Persist data after restarting the app.
- Export data to JSON.
- Import data from JSON.
- Support Windows packaging.

## Out of scope for MVP

- Google Calendar integration.
- Microsoft Outlook integration.
- Login or user accounts.
- Cloud sync.
- Mobile app.
- Collaboration or sharing.
- AI planning.
- Advanced time tracking.
- Two-way external calendar sync.

## Visual direction

- Minimalist white/cream background.
- Light borders and subtle shadows.
- Rounded cards.
- Green as the primary completion color.
- Red/orange for missed, overdue, or interrupted states.
- Spacious dashboard layout inspired by the supplied reference images.
- The reference images define visual direction only, not mandatory text or functionality.

## MVP acceptance criteria

- A user can create a task for a specific date.
- A user can create a routine for a specific schedule.
- A user can see both on Today.
- A user can mark tasks and routines complete.
- A user can navigate weekly and monthly views.
- Planning Streak and Completion Streak update correctly.
- Analytics update after data changes.
- Data survives app restart.
- JSON export and import work.
- The application can run offline on Windows.
