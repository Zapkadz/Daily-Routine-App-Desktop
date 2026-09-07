import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  CheckSquare2,
  LayoutDashboard,
  Moon,
  Repeat2,
  Settings,
  Sun,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const navigation = [
  { label: "Today", to: "/today", icon: LayoutDashboard },
  { label: "Tasks", to: "/tasks", icon: CheckSquare2 },
  { label: "Daily Routine", to: "/routines", icon: Repeat2 },
  { label: "Weekly Planner", to: "/weekly", icon: CalendarRange },
  { label: "Monthly Planner", to: "/monthly", icon: CalendarDays },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
];

export function AppShell() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? "app-frame dark" : "app-frame"}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">D</div>
          <div>
            <strong>Daily Routine</strong>
            <span>Your everyday rhythm</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              aria-label={label}
              title={label}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" aria-label={darkMode ? "Light mode" : "Dark mode"} type="button" onClick={() => setDarkMode((value) => !value)}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span>{darkMode ? "Light mode" : "Dark mode"}</span>
          </button>
          <NavLink to="/settings" className="nav-item" aria-label="Settings" title="Settings">
            <Settings size={18} strokeWidth={1.8} />
            <span>Settings</span>
          </NavLink>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
