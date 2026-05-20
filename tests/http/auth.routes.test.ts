import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { createApiApp } from "../../src/api/app";
import { createMigratedTestDatabase } from "../helpers/test-db";

describe("auth HTTP routes", () => {
  let db: Database;
  let app: ReturnType<typeof createApiApp>;

  beforeEach(() => {
    db = createMigratedTestDatabase();
    app = createApiApp({ db, jwtSecret: "test-secret" });
  });

  afterEach(() => db.close());

  test("registers, logs in, and returns me with a bearer token", async () => {
    const register = await app.handle(new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Alan Kay", email: "alan@example.com", password: "strong-password" }),
      headers: { "content-type": "application/json" },
    }));
    expect(register.status).toBe(201);
    expect(await register.json()).not.toHaveProperty("passwordHash");

    const login = await app.handle(new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "alan@example.com", password: "strong-password" }),
      headers: { "content-type": "application/json" },
    }));
    const session = await login.json() as { accessToken: string };
    const me = await app.handle(new Request("http://localhost/api/auth/me", {
      headers: { authorization: `Bearer ${session.accessToken}` },
    }));

    expect(login.status).toBe(200);
    expect(me.status).toBe(200);
    expect((await me.json() as { email: string }).email).toBe("alan@example.com");
  });
});
