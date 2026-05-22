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
