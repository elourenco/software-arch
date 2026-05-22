import type { Database } from "bun:sqlite";

const migrations = [
  {
    id: "001_create_users",
    sql: `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`,
  },
  {
    id: "002_seed_admin_user",
    sql: `
INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
SELECT
  '00000000-0000-4000-8000-000000000001',
  'Super Admin',
  'super@admin.app',
  '$2b$10$ZraFCfg9psd9T10clQNkCOcuWunXteqKGCULIgu0k7r/dskz1HvGq',
  'admin',
  '2026-05-20T00:00:00.000Z',
  '2026-05-20T00:00:00.000Z'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'super@admin.app'
);
`,
  },
] as const;

/** Applies embedded SQL migrations exactly once per database. */
export function runMigrations(db: Database): void {
  db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
  const findApplied = db.query("SELECT id FROM schema_migrations WHERE id = ?");
  const insert = db.query("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)");

  for (const migration of migrations) {
    if (findApplied.get(migration.id)) continue;
    db.transaction(() => {
      db.exec(migration.sql);
      insert.run(migration.id, new Date().toISOString());
    })();
  }
}
