import type { Database } from "bun:sqlite";
import { createDatabase } from "../../src/api/database/database";
import { runMigrations } from "../../src/api/database/migrate";

/** Creates an isolated SQLite database with all migrations applied. */
export function createMigratedTestDatabase(): Database {
  const db = createDatabase(":memory:");
  runMigrations(db);
  return db;
}
