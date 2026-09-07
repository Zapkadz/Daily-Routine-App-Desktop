import { isTauri } from "@tauri-apps/api/core";
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getDatabase } from "../database/client";
import { AppShell } from "./AppShell";
import { SettingsPage } from "../pages/SettingsPage";
import { usePreferencesStore } from '../stores/preferencesStore';
import { TasksPage } from "../pages/TasksPage";
import { TodayPage } from "../pages/TodayPage";
import { RoutinesPage } from "../pages/RoutinesPage";
import { WeeklyPlannerPage } from "../pages/WeeklyPlannerPage";
import { MonthlyPlannerPage } from "../pages/MonthlyPlannerPage";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { PlanTomorrowPage } from '../pages/PlanTomorrowPage';

export function App() {
  useEffect(() => {
    if (!isTauri()) return;
    void usePreferencesStore.getState().load();

    void getDatabase().catch((error: unknown) => {
      console.error("Failed to initialize the local database", error);
    });
  }, []);

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/plan/tomorrow" element={<PlanTomorrowPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/routines" element={<RoutinesPage />} />
        <Route path="/weekly" element={<WeeklyPlannerPage />} />
        <Route path="/monthly" element={<MonthlyPlannerPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
