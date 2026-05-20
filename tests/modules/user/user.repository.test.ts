import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
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
    expect(repository.count()).toBe(1);
    expect(repository.findAll()).toHaveLength(1);
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
});
