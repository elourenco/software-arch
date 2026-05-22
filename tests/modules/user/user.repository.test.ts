import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { runMigrations } from "../../../src/api/database/migrate";
import { verifyPassword } from "../../../src/api/shared/security/password";
import { AppError } from "../../../src/api/shared/errors/app-error";
import { UserRepository } from "../../../src/api/modules/user/user.repository";
import { createMigratedTestDatabase } from "../../helpers/test-db";

describe("UserRepository", () => {
  let db: Database;
  let repository: UserRepository;

  beforeEach(() => {
    db = createMigratedTestDatabase();
    repository = new UserRepository(db);
  });

  afterEach(() => db.close());

  test("persists and queries users through prepared statements", () => {
    const initialCount = repository.count();
    const created = repository.create({
      id: "user-1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      passwordHash: "hashed",
      role: "user",
      createdAt: "2026-05-19T00:00:00.000Z",
      updatedAt: "2026-05-19T00:00:00.000Z",
    });

    expect(created.email).toBe("ada@example.com");
    expect(repository.count()).toBe(initialCount + 1);
    expect(repository.findAll()).toHaveLength(initialCount + 1);
    expect(repository.findById("user-1")?.name).toBe("Ada Lovelace");
    expect(repository.findByEmail("ada@example.com")?.id).toBe("user-1");
    expect(repository.findByName("love")).toHaveLength(1);
  });

  test("updates, deletes, and converts duplicate emails to domain errors", () => {
    const user = repository.create({
      id: "user-1",
      name: "Grace Hopper",
      email: "grace@example.com",
      passwordHash: "hashed",
      role: "admin",
      createdAt: "2026-05-19T00:00:00.000Z",
      updatedAt: "2026-05-19T00:00:00.000Z",
    });

    const updated = repository.update(user.id, {
      name: "Rear Admiral Grace Hopper",
      updatedAt: "2026-05-20T00:00:00.000Z",
    });

    expect(updated?.name).toBe("Rear Admiral Grace Hopper");
    expect(() => repository.create({ ...user, id: "user-2" })).toThrow(AppError);
    expect(repository.delete(user.id)).toBe(true);
    expect(repository.findById(user.id)).toBeNull();
  });

  test("seeds the admin user idempotently through migrations", async () => {
    const admin = repository.findByEmail("super@admin.app");

    expect(admin?.name).toBe("Super Admin");
    expect(admin?.role).toBe("admin");
    expect(await verifyPassword("123456", admin?.passwordHash ?? "")).toBe(true);

    runMigrations(db);

    expect(repository.findByEmail("super@admin.app")?.id).toBe(admin?.id);
    expect(repository.findByName("Super Admin")).toHaveLength(1);
  });

  test("does not overwrite an existing admin email when the seed migration runs", () => {
    db.query("UPDATE users SET name = ?, password_hash = ?, role = ? WHERE email = ?")
      .run("Existing Admin", "existing-hash", "user", "super@admin.app");
    db.query("DELETE FROM schema_migrations WHERE id = ?").run("002_seed_admin_user");

    runMigrations(db);

    const admin = repository.findByEmail("super@admin.app");
    expect(admin?.name).toBe("Existing Admin");
    expect(admin?.passwordHash).toBe("existing-hash");
    expect(admin?.role).toBe("user");
  });
});
