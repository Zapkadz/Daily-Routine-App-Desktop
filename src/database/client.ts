import Database from "@tauri-apps/plugin-sql";
import { invoke } from '@tauri-apps/api/core';

let databasePromise: Promise<Database> | null = null;

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = Database.load("sqlite:daily-routine.db").then(database => {
      const execute = database.execute.bind(database);
      database.execute = async (...args: Parameters<Database['execute']>) => {
        const result = await execute(...args);
        // A wake-up failure must never turn an already committed save into a failed save.
        void invoke('refresh_reminders').catch(error => console.error('Reminder refresh failed', error));
        return result;
      };
      return database;
    }).catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}
