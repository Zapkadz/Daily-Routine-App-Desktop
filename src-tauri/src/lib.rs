use std::sync::atomic::Ordering;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};
use tauri_plugin_sql::{Migration, MigrationKind};
mod reminders;

pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_schema",
            sql: include_str!("../migrations/0001_initial.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_default_categories",
            sql: include_str!("../migrations/0002_default_categories.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add_task_recurrence_source",
            sql: include_str!("../migrations/0003_task_recurrence_source.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add_routine_start_date",
            sql: include_str!("../migrations/0004_routine_start_date.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "add_preferences",
            sql: include_str!("../migrations/0005_preferences.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "routine_occurrences_and_revisions",
            sql: include_str!("../migrations/0006_routine_occurrences.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "desktop_reminders",
            sql: include_str!("../migrations/0007_desktop_reminders.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            reminders::open(app)
        }))
        .plugin(
            tauri_plugin_autostart::Builder::new()
                .arg("--background")
                .build(),
        )
        .manage(reminders::ReminderState::default())
        .invoke_handler(tauri::generate_handler![
            reminders::get_reminder_settings,
            reminders::save_reminder_settings,
            reminders::set_reminder_autostart,
            reminders::test_reminder,
            reminders::refresh_reminders
        ])
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:daily-routine.db", migrations)
                .build(),
        )
        .setup(|app| {
            let open = MenuItem::with_id(app, "open", "Open Daily Routine", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit Daily Routine", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &quit])?;
            TrayIconBuilder::new()
                .icon(app.default_window_icon().expect("app icon").clone())
                .tooltip("Daily Routine")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => reminders::open(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;
            let settings = tauri::async_runtime::block_on(reminders::get_reminder_settings(
                app.handle().clone(),
            ));
            if let Ok(settings) = settings {
                reminders::apply_startup(app.handle(), &settings);
            }
            reminders::start(app.handle().clone());
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window
                    .state::<reminders::ReminderState>()
                    .background
                    .load(Ordering::Relaxed)
                {
                    if window.hide().is_ok() {
                        api.prevent_close();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Daily Routine");
}
