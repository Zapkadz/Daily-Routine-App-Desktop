import { isTauri } from "@tauri-apps/api/core";
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getDatabase } from "../database/client";
import { AppShell } from "./AppShell";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { TasksPage } from "../pages/TasksPage";
import { TodayPage } from "../pages/TodayPage";
import { RoutinesPage } from "../pages/RoutinesPage";
import { WeeklyPlannerPage } from "../pages/WeeklyPlannerPage";
import { MonthlyPlannerPage } from "../pages/MonthlyPlannerPage";
import { AnalyticsPage } from "../pages/AnalyticsPage";

export function App() {
  useEffect(() => {
    if (!isTauri()) return;

    void getDatabase().catch((error: unknown) => {
      console.error("Failed to initialize the local database", error);
    });
  }, []);

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/routines" element={<RoutinesPage />} />
        <Route path="/weekly" element={<WeeklyPlannerPage />} />
        <Route path="/monthly" element={<MonthlyPlannerPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
      </Route>
    </Routes>
  );
}
