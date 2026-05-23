import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { createApiApp } from "../../src/api/app";
import { createMigratedTestDatabase } from "../helpers/test-db";

describe("users HTTP routes", () => {
  let db: Database;
  let app: ReturnType<typeof createApiApp>;
  let token: string;

  beforeEach(async () => {
    db = createMigratedTestDatabase();
    app = createApiApp({ db, jwtSecret: "test-secret" });
    await app.handle(new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Admin", email: "admin@example.com", password: "strong-password" }),
      headers: { "content-type": "application/json" },
    }));
    const login = await app.handle(new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@example.com", password: "strong-password" }),
      headers: { "content-type": "application/json" },
    }));
    token = ((await login.json()) as { accessToken: string }).accessToken;
  });

  afterEach(() => db.close());

  test("protects user routes and supports CRUD, count, and search", async () => {
    expect((await app.handle(new Request("http://localhost/api/users"))).status).toBe(401);
    const auth = { authorization: `Bearer ${token}`, "content-type": "application/json" };
    const create = await app.handle(new Request("http://localhost/api/users", {
      method: "POST",
      body: JSON.stringify({ name: "Donald Knuth", email: "donald@example.com", password: "strong-password", role: "user" }),
      headers: auth,
    }));
    const created = await create.json() as { id: string; email: string };

    expect(create.status).toBe(201);
    expect(created).not.toHaveProperty("passwordHash");
    const list = await app.handle(new Request("http://localhost/api/users", { headers: auth }));
    const listedUsers = await list.json() as Array<{ email: string }>;
    const count = await app.handle(new Request("http://localhost/api/users/count", { headers: auth }));
    const searchSuperAdmin = await app.handle(new Request("http://localhost/api/users/search?name=Super", { headers: auth }));
    const searchCurrentUser = await app.handle(new Request("http://localhost/api/users/search?name=Admin", { headers: auth }));
    const searchKnuth = await app.handle(new Request("http://localhost/api/users/search?name=knu", { headers: auth }));

    expect(list.status).toBe(200);
    expect(listedUsers.map((user) => user.email)).toEqual(["donald@example.com"]);
    expect(await count.json()).toEqual({ count: 1 });
    expect(await searchSuperAdmin.json()).toEqual([]);
    expect(await searchCurrentUser.json()).toEqual([]);
    expect(searchKnuth.status).toBe(200);
    expect((await app.handle(new Request(`http://localhost/api/users/${created.id}`, { headers: auth }))).status).toBe(200);
    expect((await app.handle(new Request(`http://localhost/api/users/${created.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: "D. Knuth" }),
      headers: auth,
    }))).status).toBe(200);
    expect((await app.handle(new Request(`http://localhost/api/users/${created.id}`, {
      method: "DELETE",
      headers: auth,
    }))).status).toBe(204);
  });

  test("rejects invalid user creation payloads", async () => {
    const auth = { authorization: `Bearer ${token}`, "content-type": "application/json" };
    const invalid = await app.handle(new Request("http://localhost/api/users", {
      method: "POST",
      body: JSON.stringify({ name: "A", email: "not-email", password: "short", role: "user" }),
      headers: auth,
    }));

    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({
      error: { code: "VALIDATION_ERROR", message: "Invalid request payload" },
    });
  });
});
