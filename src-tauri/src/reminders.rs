use chrono::{Datelike, Local, NaiveDate, NaiveTime, Timelike};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{Row, SqlitePool};
use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Mutex,
    },
    time::{Duration, Instant},
};
use tauri::{AppHandle, Manager};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_sql::{DbInstances, DbPool};
use tokio::sync::Notify;
use winrt_notification::{Duration as ToastDuration, IconCrop, Sound, Toast};

#[derive(Default)]
pub struct ReminderState {
    pub wake: Notify,
    pub background: AtomicBool,
    pub last_error: Mutex<Option<String>>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    enabled: bool,
    sound: bool,
    background: bool,
    autostart: bool,
    last_error: Option<String>,
}

async fn pool(app: &AppHandle) -> Result<SqlitePool, String> {
    let state = app.state::<DbInstances>();
    let dbs = state.0.read().await;
    match dbs.get("sqlite:daily-routine.db") {
        Some(DbPool::Sqlite(pool)) => Ok(pool.clone()),
        _ => Err("The planner database is not ready. Reopen the app.".into()),
    }
}

#[tauri::command]
pub fn refresh_reminders(state: tauri::State<ReminderState>) {
    state.wake.notify_one();
}

#[tauri::command]
pub async fn get_reminder_settings(app: AppHandle) -> Result<Settings, String> {
    let db = pool(&app).await?;
    let row = sqlx::query("SELECT enabled,sound,background FROM reminder_settings WHERE id=1")
        .fetch_one(&db)
        .await
        .map_err(|e| e.to_string())?;
    Ok(Settings {
        enabled: row.get::<i64, _>("enabled") == 1,
        sound: row.get::<i64, _>("sound") == 1,
        background: row.get::<i64, _>("background") == 1,
        autostart: app.autolaunch().is_enabled().map_err(|e| e.to_string())?,
        last_error: app
            .state::<ReminderState>()
            .last_error
            .lock()
            .unwrap()
            .clone(),
    })
}

#[tauri::command]
pub async fn save_reminder_settings(
    app: AppHandle,
    enabled: bool,
    sound: bool,
    background: bool,
) -> Result<(), String> {
    let db = pool(&app).await?;
    sqlx::query("UPDATE reminder_settings SET enabled=?,sound=?,background=? WHERE id=1")
        .bind(enabled)
        .bind(sound)
        .bind(background)
        .execute(&db)
        .await
        .map_err(|e| e.to_string())?;
    let state = app.state::<ReminderState>();
    state.background.store(background, Ordering::Relaxed);
    state.wake.notify_one();
    Ok(())
}

#[tauri::command]
pub fn set_reminder_autostart(app: AppHandle, enabled: bool) -> Result<(), String> {
    if enabled {
        app.autolaunch().enable()
    } else {
        app.autolaunch().disable()
    }
    .map_err(|e| e.to_string())
}

fn show_notification(
    title: &str,
    body: &str,
    sound: bool,
    icon: &std::path::Path,
) -> Result<(), String> {
    Toast::new("com.dailyroutine.desktop")
        .title(title)
        .text1(body)
        .icon(icon, IconCrop::Square, "Daily Routine")
        .duration(ToastDuration::Long)
        .sound(if sound { Some(Sound::Reminder) } else { None })
        .show()
        .map_err(|e| format!("Windows could not show the reminder: {e}"))
}

#[tauri::command]
pub async fn test_reminder(app: AppHandle) -> Result<(), String> {
    let icon = app
        .path()
        .resolve("icons/128x128.png", tauri::path::BaseDirectory::Resource)
        .map_err(|e| e.to_string())?;
    let settings = get_reminder_settings(app).await?;
    tauri::async_runtime::spawn_blocking(move || {
        show_notification(
            "Your reminder is ready",
            "This is how your routine reminders will appear.",
            settings.sound,
            &icon,
        )
    })
    .await
    .map_err(|e| e.to_string())?
}

#[derive(Debug)]
struct Event {
    id: String,
    name: String,
    time: NaiveTime,
}

fn scheduled(snapshot: &Value, date: NaiveDate, explicit: bool) -> bool {
    let key = date.to_string();
    if snapshot["startDate"]
        .as_str()
        .is_none_or(|start| start > key.as_str())
    {
        return false;
    }
    if snapshot["reminderEnabled"].as_bool() != Some(true) {
        return false;
    }
    if explicit {
        return true;
    }
    let rule: Value = serde_json::from_str(snapshot["frequencyRule"].as_str().unwrap_or("{}"))
        .unwrap_or(Value::Null);
    match snapshot["frequencyType"].as_str() {
        Some("daily") => true,
        Some("weekdays") => rule["weekdays"].as_array().is_some_and(|days| {
            days.iter()
                .any(|d| d.as_u64() == Some(date.weekday().number_from_monday() as u64))
        }),
        Some("custom_dates") => rule["dates"]
            .as_array()
            .is_some_and(|days| days.iter().any(|d| d.as_str() == Some(key.as_str()))),
        _ => false,
    }
}

async fn events(db: &SqlitePool, date: NaiveDate) -> Result<Vec<Event>, String> {
    // A single statement gives a consistent snapshot of revisions, overrides and logs.
    let rows = sqlx::query("SELECT r.id, COALESCE(o.snapshot,v.snapshot) AS snapshot, o.routine_id IS NOT NULL AS explicit
        FROM routines r JOIN routine_revisions v ON v.routine_id=r.id
          AND v.effective_date=(SELECT MAX(v2.effective_date) FROM routine_revisions v2 WHERE v2.routine_id=r.id AND v2.effective_date<=?)
        LEFT JOIN routine_occurrences o ON o.routine_id=r.id AND o.date=?
        LEFT JOIN routine_logs l ON l.routine_id=r.id AND l.date=?
        LEFT JOIN reminder_deliveries d ON d.routine_id=r.id AND d.date=?
        WHERE r.is_active=1 AND r.archived_at IS NULL AND COALESCE(o.removed,0)=0
          AND COALESCE(l.status,'pending')='pending' AND d.routine_id IS NULL")
        .bind(date.to_string()).bind(date.to_string()).bind(date.to_string()).bind(date.to_string())
        .fetch_all(db).await.map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows {
        let snapshot: Value =
            serde_json::from_str(row.get::<&str, _>("snapshot")).map_err(|e| e.to_string())?;
        if !scheduled(&snapshot, date, row.get::<i64, _>("explicit") == 1) {
            continue;
        }
        if let Ok(time) =
            NaiveTime::parse_from_str(snapshot["reminderTime"].as_str().unwrap_or(""), "%H:%M")
        {
            result.push(Event {
                id: row.get("id"),
                name: snapshot["name"].as_str().unwrap_or("Routine").to_owned(),
                time,
            });
        }
    }
    result.sort_by_key(|event| event.time);
    Ok(result)
}

fn due(time: NaiveTime, now: NaiveTime) -> bool {
    let age = now.signed_duration_since(time).num_seconds();
    (0..=300).contains(&age)
}

pub fn open(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

pub fn apply_startup(app: &AppHandle, settings: &Settings) {
    app.state::<ReminderState>()
        .background
        .store(settings.background, Ordering::Relaxed);
    if settings.background && std::env::args().any(|arg| arg == "--background") {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.hide();
        }
    }
}

pub fn start(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let state = app.state::<ReminderState>();
        let mut next = None::<NaiveTime>;
        let mut refresh = true;
        let mut last = Local::now();
        let mut last_load = Instant::now();
        loop {
            let now = Local::now();
            let clock_changed = now.date_naive() != last.date_naive()
                || now.offset() != last.offset()
                || now.signed_duration_since(last).num_seconds() < 0
                || now.signed_duration_since(last).num_seconds() > 35;
            if refresh
                || clock_changed
                || last_load.elapsed() >= Duration::from_secs(300)
                || next.is_some_and(|t| t <= now.time())
            {
                let result: Result<(), String> = async {
                    let db = pool(&app).await?;
                    let settings = get_reminder_settings(app.clone()).await?;
                    state.background.store(settings.background, Ordering::Relaxed);
                    next = None;
                    if !settings.enabled { return Ok(()); }
                    for event in events(&db, now.date_naive()).await? {
                        if event.time > now.time() { next = Some(event.time); break; }
                        if !due(event.time, now.time()) { continue; }
                        // Durable claim BEFORE OS dispatch: at most one attempt per routine/date,
                        // even across restart, a repeated clock hour, or a process crash.
                        let claimed = sqlx::query("INSERT OR IGNORE INTO reminder_deliveries(routine_id,date,attempted_at,outcome) VALUES (?,?,?,'claimed')")
                            .bind(&event.id).bind(now.date_naive().to_string()).bind(now.to_rfc3339())
                            .execute(&db).await.map_err(|e| e.to_string())?.rows_affected();
                        if claimed == 0 { continue; }
                        let body = format!("{} · Time to begin", event.time.format("%H:%M"));
                        let title = event.name;
                        let icon = app.path().resolve("icons/128x128.png", tauri::path::BaseDirectory::Resource).map_err(|e| e.to_string())?;
                        let sound = settings.sound;
                        let sent = tauri::async_runtime::spawn_blocking(move || show_notification(&title, &body, sound, &icon))
                            .await.map_err(|e| e.to_string())?;
                        sqlx::query("UPDATE reminder_deliveries SET outcome=? WHERE routine_id=? AND date=?")
                            .bind(if sent.is_ok() { "sent" } else { "failed" }).bind(&event.id).bind(now.date_naive().to_string())
                            .execute(&db).await.map_err(|e| e.to_string())?;
                        if let Err(error) = sent { *state.last_error.lock().unwrap() = Some(error); }
                    }
                    Ok(())
                }.await;
                if let Err(error) = result {
                    *state.last_error.lock().unwrap() = Some(error);
                }
                last_load = Instant::now();
            }
            last = now;
            // Only the clock is sampled at most every 30s; SQL is refreshed on writes,
            // deadlines, midnight/clock changes and a five-minute recovery fallback.
            let seconds = next
                .map(|t| {
                    t.num_seconds_from_midnight()
                        .saturating_sub(now.time().num_seconds_from_midnight())
                        as u64
                })
                .unwrap_or(30)
                .clamp(1, 30);
            refresh = tokio::select! {
                _ = state.wake.notified() => true,
                _ = tokio::time::sleep(Duration::from_secs(seconds)) => false,
            };
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    #[test]
    #[ignore = "Sends a real Windows toast; run only after installing the app"]
    fn installed_windows_notification_smoke() {
        show_notification(
            "Học tiếng Nhật",
            "17:42 · Time to begin",
            false,
            &std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("icons/128x128.png"),
        )
        .unwrap();
    }
    #[test]
    fn schedule_modes_and_opt_in() {
        let day = NaiveDate::from_ymd_opt(2026, 9, 8).unwrap();
        let mut s = json!({"startDate":"2026-09-08","reminderEnabled":true,"frequencyType":"daily","frequencyRule":"{}"});
        assert!(scheduled(&s, day, false));
        s["frequencyType"] = json!("weekly_target");
        assert!(!scheduled(&s, day, false));
        assert!(scheduled(&s, day, true));
        s["frequencyType"] = json!("custom_dates");
        s["frequencyRule"] = json!("{\"dates\":[\"2026-09-09\"]}");
        assert!(!scheduled(&s, day, false));
        s["frequencyType"] = json!("weekdays");
        s["frequencyRule"] = json!("{\"weekdays\":[2]}");
        assert!(scheduled(&s, day, false));
        s["reminderEnabled"] = json!(false);
        assert!(!scheduled(&s, day, true));
    }
    #[test]
    fn bounded_catch_up() {
        let time = NaiveTime::from_hms_opt(8, 0, 0).unwrap();
        assert!(!due(time, NaiveTime::from_hms_opt(7, 59, 59).unwrap()));
        assert!(due(time, time));
        assert!(due(time, NaiveTime::from_hms_opt(8, 5, 0).unwrap()));
        assert!(!due(time, NaiveTime::from_hms_opt(8, 5, 1).unwrap()));
    }

    #[tokio::test]
    async fn database_resolves_overrides_and_suppresses_logs_archives_and_duplicates() {
        let db = sqlx::sqlite::SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();
        for migration in [
            include_str!("../migrations/0001_initial.sql"),
            include_str!("../migrations/0002_default_categories.sql"),
            include_str!("../migrations/0003_task_recurrence_source.sql"),
            include_str!("../migrations/0004_routine_start_date.sql"),
            include_str!("../migrations/0005_preferences.sql"),
            include_str!("../migrations/0006_routine_occurrences.sql"),
            include_str!("../migrations/0007_desktop_reminders.sql"),
        ] {
            sqlx::raw_sql(migration).execute(&db).await.unwrap();
        }
        let date = NaiveDate::from_ymd_opt(2026, 9, 8).unwrap();
        sqlx::query("INSERT INTO routines(id,name,color,frequency_type,frequency_rule,created_at,start_date,reminder_time,reminder_enabled) VALUES('r','Read','green','daily','{}','2026-09-08','2026-09-08','08:00',1)").execute(&db).await.unwrap();
        assert_eq!(events(&db, date).await.unwrap().len(), 1);
        let snapshot = json!({"name":"Study tomorrow","startDate":"2026-09-08","frequencyType":"daily","frequencyRule":"{}","reminderTime":"10:00","reminderEnabled":true}).to_string();
        sqlx::query(
            "INSERT INTO routine_occurrences(routine_id,date,snapshot) VALUES('r','2026-09-08',?)",
        )
        .bind(snapshot)
        .execute(&db)
        .await
        .unwrap();
        let resolved = events(&db, date).await.unwrap();
        assert_eq!(resolved[0].name, "Study tomorrow");
        assert_eq!(resolved[0].time, NaiveTime::from_hms_opt(10, 0, 0).unwrap());
        sqlx::query("UPDATE routine_occurrences SET removed=1")
            .execute(&db)
            .await
            .unwrap();
        assert!(events(&db, date).await.unwrap().is_empty());
        sqlx::query("UPDATE routine_occurrences SET removed=0")
            .execute(&db)
            .await
            .unwrap();
        sqlx::query("INSERT INTO routine_logs(id,routine_id,date,status) VALUES('l','r','2026-09-08','completed')").execute(&db).await.unwrap();
        assert!(events(&db, date).await.unwrap().is_empty());
        sqlx::query("UPDATE routine_logs SET status='pending'")
            .execute(&db)
            .await
            .unwrap();
        sqlx::query("INSERT INTO reminder_deliveries VALUES('r','2026-09-08','now','claimed')")
            .execute(&db)
            .await
            .unwrap();
        assert!(events(&db, date).await.unwrap().is_empty());
        assert_eq!(
            events(&db, date.succ_opt().unwrap()).await.unwrap().len(),
            1
        );
        sqlx::query("UPDATE routines SET archived_at='2026-09-08'")
            .execute(&db)
            .await
            .unwrap();
        assert!(events(&db, date.succ_opt().unwrap())
            .await
            .unwrap()
            .is_empty());
    }
}
