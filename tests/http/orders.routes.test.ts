import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { createApiApp } from "../../src/api/app";
import { createMigratedTestDatabase } from "../helpers/test-db";

describe("orders HTTP routes", () => {
  let db: Database;
  let app: ReturnType<typeof createApiApp>;
  let adminAuth: Headers;
  let buyerAuth: Headers;
  let otherAuth: Headers;
  let productId: string;

  beforeEach(async () => {
    db = createMigratedTestDatabase();
    app = createApiApp({ db, jwtSecret: "test-secret" });
    adminAuth = await login("super@admin.app", "123456");
    buyerAuth = await registerAndLogin("Buyer", "buyer@example.com");
    otherAuth = await registerAndLogin("Other Buyer", "other@example.com");
    productId = await createProduct("SKU-001", 12);
  });

  afterEach(() => db.close());

  async function registerAndLogin(name: string, email: string) {
    await app.handle(new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password: "strong-password" }),
    }));
    return login(email, "strong-password");
  }

  async function login(email: string, password: string) {
    const response = await app.handle(new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    }));
    const body = await response.json() as { accessToken: string };
    return new Headers({ authorization: `Bearer ${body.accessToken}` });
  }

  async function createProduct(sku: string, quantity: number) {
    const response = await app.handle(new Request("http://localhost/api/products", {
      method: "POST",
      headers: withJson(adminAuth),
      body: JSON.stringify({ sku, name: "Keyboard", quantity }),
    }));
    const product = await response.json() as { id: string };
    return product.id;
  }

  test("supports user order creation, ownership, cancellation, and admin status updates", async () => {
    const create = await app.handle(new Request("http://localhost/api/orders", {
      method: "POST",
      headers: withJson(buyerAuth),
      body: JSON.stringify({
        items: [
          { productId, quantity: 2 },
          { productId, quantity: 3 },
        ],
      }),
    }));
    const order = await create.json() as { id: string; status: string; items: Array<{ quantity: number }> };
    const buyerList = await app.handle(new Request("http://localhost/api/orders", { headers: buyerAuth }));
    const otherFind = await app.handle(new Request(`http://localhost/api/orders/${order.id}`, { headers: otherAuth }));
    const adminList = await app.handle(new Request("http://localhost/api/admin/orders", { headers: adminAuth }));
    const adminCount = await app.handle(new Request("http://localhost/api/admin/orders/count", { headers: adminAuth }));
    const adminFind = await app.handle(new Request(`http://localhost/api/admin/orders/${order.id}`, { headers: adminAuth }));
    const statusUpdate = await app.handle(new Request(`http://localhost/api/admin/orders/${order.id}/status`, {
      method: "PATCH",
      headers: withJson(adminAuth),
      body: JSON.stringify({ status: "concluido" }),
    }));
    const forbiddenAdmin = await app.handle(new Request("http://localhost/api/admin/orders", { headers: buyerAuth }));

    expect(create.status).toBe(201);
    expect(order.status).toBe("em_andamento");
    expect(order.items[0]?.quantity).toBe(5);
    expect(await buyerList.json()).toHaveLength(1);
    expect(otherFind.status).toBe(403);
    expect(await adminList.json()).toHaveLength(1);
    expect(await adminCount.json()).toEqual({ count: 1 });
    expect(adminFind.status).toBe(200);
    expect((await statusUpdate.json() as { status: string }).status).toBe("concluido");
    expect(forbiddenAdmin.status).toBe(403);
  });

  test("rejects insufficient stock and lets users cancel in-progress orders", async () => {
    const insufficient = await app.handle(new Request("http://localhost/api/orders", {
      method: "POST",
      headers: withJson(buyerAuth),
      body: JSON.stringify({ items: [{ productId, quantity: 20 }] }),
    }));
    const create = await app.handle(new Request("http://localhost/api/orders", {
      method: "POST",
      headers: withJson(buyerAuth),
      body: JSON.stringify({ items: [{ productId, quantity: 2 }] }),
    }));
    const order = await create.json() as { id: string };
    const cancel = await app.handle(new Request(`http://localhost/api/orders/${order.id}/cancel`, {
      method: "PATCH",
      headers: buyerAuth,
    }));
    const updateCancelled = await app.handle(new Request(`http://localhost/api/admin/orders/${order.id}/status`, {
      method: "PATCH",
      headers: withJson(adminAuth),
      body: JSON.stringify({ status: "concluido" }),
    }));

    expect(insufficient.status).toBe(409);
    expect(cancel.status).toBe(200);
    expect((await cancel.json() as { status: string }).status).toBe("cancelado");
    expect(updateCancelled.status).toBe(409);
  });
});

function withJson(headers: Headers) {
  const next = new Headers(headers);
  next.set("content-type", "application/json");
  return next;
}
