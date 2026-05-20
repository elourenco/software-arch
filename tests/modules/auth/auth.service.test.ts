import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { AuthService } from "../../../src/api/modules/auth/auth.service";
import { UserRepository } from "../../../src/api/modules/user/user.repository";
import { UserService } from "../../../src/api/modules/user/user.service";
import { createMigratedTestDatabase } from "../../helpers/test-db";

describe("AuthService", () => {
  let db: Database;
  let auth: AuthService;

  beforeEach(() => {
    db = createMigratedTestDatabase();
    const userService = new UserService(new UserRepository(db));
    auth = new AuthService(userService, "test-secret");
  });

  afterEach(() => db.close());

  test("registers, logs in, and resolves the current user", async () => {
    const registered = await auth.register({
      name: "Barbara Liskov",
      email: "barbara@example.com",
      password: "strong-password",
    });
    const session = await auth.login({
      email: "barbara@example.com",
      password: "strong-password",
    });
    const me = await auth.me(session.accessToken);

    expect(registered.user.email).toBe("barbara@example.com");
    expect(session.accessToken.split(".")).toHaveLength(3);
    expect(me.email).toBe("barbara@example.com");
  });

  test("rejects invalid credentials and invalid tokens", async () => {
    await auth.register({
      name: "Edsger Dijkstra",
      email: "edsger@example.com",
      password: "strong-password",
    });

    await expect(auth.login({
      email: "edsger@example.com",
      password: "wrong-password",
    })).rejects.toHaveProperty("code", "INVALID_CREDENTIALS");
    await expect(auth.me("not-a-token")).rejects.toHaveProperty("code", "UNAUTHORIZED");
  });
});
