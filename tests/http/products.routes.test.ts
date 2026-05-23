import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { createApiApp } from "../../src/api/app";
import { createMigratedTestDatabase } from "../helpers/test-db";

describe("products HTTP routes", () => {
  let db: Database;
  let app: ReturnType<typeof createApiApp>;
  let adminAuth: Headers;
  let userAuth: Headers;

  beforeEach(async () => {
    db = createMigratedTestDatabase();
    app = createApiApp({ db, jwtSecret: "test-secret" });
    adminAuth = await login("super@admin.app", "123456");

    await app.handle(new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Buyer", email: "buyer@example.com", password: "strong-password" }),
    }));
    userAuth = await login("buyer@example.com", "strong-password");
  });

  afterEach(() => db.close());

  async function login(email: string, password: string) {
    const response = await app.handle(new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    }));
    const body = await response.json() as { accessToken: string };
    return new Headers({ authorization: `Bearer ${body.accessToken}` });
  }

  test("protects product writes and supports product CRUD", async () => {
    const forbidden = await app.handle(new Request("http://localhost/api/products", {
      method: "POST",
      headers: withJson(userAuth),
      body: JSON.stringify({ sku: "SKU-001", name: "Keyboard", quantity: 12 }),
    }));
    const create = await app.handle(new Request("http://localhost/api/products", {
      method: "POST",
      headers: withJson(adminAuth),
      body: JSON.stringify({ sku: "sku-001", name: "Keyboard", quantity: 12 }),
    }));
    const product = await create.json() as { id: string; sku: string; quantity: number };
    const duplicate = await app.handle(new Request("http://localhost/api/products", {
      method: "POST",
      headers: withJson(adminAuth),
      body: JSON.stringify({ sku: "SKU-001", name: "Other", quantity: 2 }),
    }));
    const list = await app.handle(new Request("http://localhost/api/products", { headers: userAuth }));
    const count = await app.handle(new Request("http://localhost/api/products/count", { headers: userAuth }));
    const find = await app.handle(new Request(`http://localhost/api/products/${product.id}`, { headers: userAuth }));
    const update = await app.handle(new Request(`http://localhost/api/products/${product.id}`, {
      method: "PUT",
      headers: withJson(adminAuth),
      body: JSON.stringify({ quantity: 9 }),
    }));
    const remove = await app.handle(new Request(`http://localhost/api/products/${product.id}`, {
      method: "DELETE",
      headers: adminAuth,
    }));

    expect(forbidden.status).toBe(403);
    expect(create.status).toBe(201);
    expect(product.sku).toBe("SKU-001");
    expect(duplicate.status).toBe(409);
    expect(await list.json()).toHaveLength(1);
    expect(await count.json()).toEqual({ count: 1 });
    expect(find.status).toBe(200);
    expect((await update.json() as { quantity: number }).quantity).toBe(9);
    expect(remove.status).toBe(204);
  });
});

function withJson(headers: Headers) {
  const next = new Headers(headers);
  next.set("content-type", "application/json");
  return next;
}
