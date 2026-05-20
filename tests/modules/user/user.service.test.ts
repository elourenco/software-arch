import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { UserRepository } from "../../../src/api/modules/user/user.repository";
import { UserService } from "../../../src/api/modules/user/user.service";
import { verifyPassword } from "../../../src/api/shared/security/password";
import { createMigratedTestDatabase } from "../../helpers/test-db";

describe("UserService", () => {
  let db: Database;
  let repository: UserRepository;
  let service: UserService;

  beforeEach(() => {
    db = createMigratedTestDatabase();
    repository = new UserRepository(db);
    service = new UserService(repository);
  });

  afterEach(() => db.close());

  test("creates public users without leaking password hashes", async () => {
    const user = await service.createUser({
      name: "Linus Torvalds",
      email: "linus@example.com",
      password: "strong-password",
      role: "user",
    });

    const stored = repository.findByEmail("linus@example.com");
    expect(user).not.toHaveProperty("passwordHash");
    expect(stored?.passwordHash).not.toBe("strong-password");
    expect(await verifyPassword("strong-password", stored?.passwordHash ?? "")).toBe(true);
  });

  test("supports CRUD operations with domain errors", async () => {
    const created = await service.createUser({
      name: "Margaret Hamilton",
      email: "margaret@example.com",
      password: "strong-password",
      role: "admin",
    });

    expect(await service.countUsers()).toBe(1);
    expect(await service.searchUsersByName("ham")).toHaveLength(1);
    expect((await service.updateUser(created.id, { name: "M. Hamilton" })).name).toBe("M. Hamilton");
    await expect(service.createUser({
      name: "Duplicate",
      email: "margaret@example.com",
      password: "strong-password",
      role: "user",
    })).rejects.toHaveProperty("code", "EMAIL_ALREADY_EXISTS");
    await service.deleteUser(created.id);
    await expect(service.findUserById(created.id)).rejects.toHaveProperty("code", "USER_NOT_FOUND");
  });
});
