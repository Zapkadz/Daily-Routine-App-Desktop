use tauri_plugin_sql::{Migration, MigrationKind};

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
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:daily-routine.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running Daily Routine");
}
