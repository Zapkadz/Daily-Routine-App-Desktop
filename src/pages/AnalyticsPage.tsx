import { eachDayOfInterval, endOfYear, format, getDay, startOfYear } from "date-fns";
import { Activity, CalendarCheck, CheckCircle2, Flame } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { analyticsRepository } from "../database/repositories/analyticsRepository";
import { calculateAnalytics } from "../services/analyticsService";
import type { StreakData } from "../types/analytics";
import { localDateKey } from "../utils/date";

function RateBar({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rate-row">
      <div><strong>{label}</strong><span>{detail}</span></div>
      <div className="rate-track"><span style={{ width: `${value}%` }} /></div>
      <b>{value}%</b>
    </div>
  );
}

export function AnalyticsPage() {
  const today = localDateKey();
  const currentYear = Number(today.slice(0, 4));
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<StreakData>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    void analyticsRepository.loadStreakData(today)
      .then(setData)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load analytics."));
  }, [today]);

  const summary = useMemo(() => data ? calculateAnalytics(data, year) : undefined, [data, year]);
  const years = useMemo(() => {
    const candidates = data ? [
      ...data.tasks.map((task) => Number(task.scheduledDate.slice(0, 4))),
      ...data.routines.map((routine) => Number(routine.startDate.slice(0, 4))),
      ...data.routineLogs.map((log) => Number(log.date.slice(0, 4))),
    ] : [];
    const first = candidates.sort()[0] ?? currentYear;
    return Array.from({ length: currentYear - Math.min(first, currentYear) + 1 }, (_, index) => currentYear - index);
  }, [currentYear, data]);
  const heatmapDates = useMemo(() => eachDayOfInterval({ start: startOfYear(new Date(year, 0, 1)), end: endOfYear(new Date(year, 0, 1)) }), [year]);
  const heatmapOffset = (getDay(heatmapDates[0]) + 6) % 7;
  const stateByDate = new Map(summary?.yearDays.map((day) => [day.date, day]));

  if (error) return <section className="page analytics-page"><p className="data-error">{error}</p></section>;
  if (!summary) return <section className="page analytics-page"><p className="eyebrow">Reading your progress…</p></section>;

  return (
    <section className="page analytics-page">
      <header className="page-header compact-header">
        <div><p className="eyebrow">Progress, made visible</p><h1>Analytics</h1><p className="header-copy">Understand consistency without turning your routine into a scoreboard.</p></div>
        <select className="year-select" value={year} onChange={(event) => setYear(Number(event.target.value))}>{years.map((item) => <option key={item}>{item}</option>)}</select>
      </header>

      <div className="analytics-kpis">
        <article><Activity /><span>Active routines</span><strong>{summary.activeRoutines}</strong><small>Currently scheduled</small></article>
        <article><CalendarCheck /><span>Planning rate</span><strong>{summary.planningRate}%</strong><small>{summary.plannedDays} of {summary.trackedDays} tracked days</small></article>
        <article><CheckCircle2 /><span>Completion rate</span><strong>{summary.completionRate}%</strong><small>{summary.completedDays} fully completed days</small></article>
        <article><Flame /><span>Completion streak</span><strong>{summary.streaks.completionCurrent}</strong><small>Longest: {summary.streaks.completionLongest} days</small></article>
      </div>

      <div className="analytics-layout">
        <article className="analytics-card heatmap-card">
          <div className="analytics-heading"><div><p className="eyebrow">Consistency map</p><h2>Daily activity</h2></div><div className="heatmap-legend"><i /> Planned <i className="complete" /> Completed</div></div>
          <div className="heatmap-scroll"><div className="analytics-heatmap">
            {Array.from({ length: heatmapOffset }, (_, index) => <span className="heatmap-cell blank" key={`blank-${index}`} />)}
            {heatmapDates.map((date) => {
              const key = format(date, "yyyy-MM-dd");
              const day = stateByDate.get(key);
              const future = key > today;
              const level = future ? "future" : day?.qualifiesForCompletion ? "complete" : day?.qualifiesForPlanning ? "planned" : day?.hasData ? "tracked" : "empty";
              return <span className={`heatmap-cell ${level}`} title={`${format(date, "MMM d")}: ${level}`} key={key} />;
            })}
          </div></div>
        </article>

        <article className="analytics-card snapshot-card">
          <div className="analytics-heading"><div><p className="eyebrow">Recent rhythm</p><h2>Completion snapshot</h2></div></div>
          <RateBar label="Last 7 days" value={summary.last7CompletionRate} detail="Completed tasks and routines" />
          <RateBar label="Last 30 days" value={summary.last30CompletionRate} detail="Completed tasks and routines" />
          <div className="task-counts">
            <div><strong>{summary.tasksCompletedThisWeek}</strong><span>Tasks this week</span></div>
            <div><strong>{summary.tasksCompletedThisMonth}</strong><span>Tasks this month</span></div>
            <div><strong>{summary.tasksCompleted}</strong><span>Tasks in {year}</span></div>
          </div>
          <div className="streak-pair"><div><span>Planning</span><strong>{summary.streaks.planningCurrent}</strong><small>current days</small></div><div><span>Best planning</span><strong>{summary.streaks.planningLongest}</strong><small>longest run</small></div></div>
        </article>

        <article className="analytics-card routine-chart-card">
          <div className="analytics-heading"><div><p className="eyebrow">By routine</p><h2>Routine completion</h2></div></div>
          {summary.routineStats.length === 0 ? <p className="analytics-empty">Create a routine and log progress to see comparisons.</p> : <div className="routine-bars">
            {summary.routineStats.map((routine) => <div className="routine-bar" key={routine.id}>
              <div><strong>{routine.name}</strong><span>{routine.completed}/{routine.expected}</span></div>
              <div className="rate-track"><span style={{ width: `${routine.rate}%`, background: routine.color }} /></div><b>{routine.rate}%</b>
            </div>)}
          </div>}
        </article>
      </div>
    </section>
  );
}
