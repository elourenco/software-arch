import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { OrderRepository } from "../../../src/api/modules/order/order.repository";
import { OrderService } from "../../../src/api/modules/order/order.service";
import { ProductRepository } from "../../../src/api/modules/product/product.repository";
import { UserRepository } from "../../../src/api/modules/user/user.repository";
import type { RequestUser } from "../../../src/api/shared/http/request-user";
import { createMigratedTestDatabase } from "../../helpers/test-db";

const admin: RequestUser = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Super Admin",
  email: "super@admin.app",
  role: "admin",
  createdAt: "2026-05-20T00:00:00.000Z",
  updatedAt: "2026-05-20T00:00:00.000Z",
};

const user: RequestUser = {
  id: "user-1",
  name: "Buyer",
  email: "buyer@example.com",
  role: "user",
  createdAt: "2026-05-22T00:00:00.000Z",
  updatedAt: "2026-05-22T00:00:00.000Z",
};

const otherUser: RequestUser = { ...user, id: "user-2", email: "other@example.com" };

describe("OrderService", () => {
  let db: Database;
  let service: OrderService;
  let products: ProductRepository;

  beforeEach(() => {
    db = createMigratedTestDatabase();
    db.query(`
      INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.id,
      user.name,
      user.email,
      "hash",
      user.role,
      user.createdAt,
      user.updatedAt,
      otherUser.id,
      otherUser.name,
      otherUser.email,
      "hash",
      otherUser.role,
      otherUser.createdAt,
      otherUser.updatedAt,
    );
    products = new ProductRepository(db);
    products.create({
      id: "product-1",
      sku: "SKU-001",
      name: "Keyboard",
      quantity: 12,
      createdAt: "2026-05-22T00:00:00.000Z",
      updatedAt: "2026-05-22T00:00:00.000Z",
    });
    service = new OrderService(new OrderRepository(db), new UserRepository(db), products);
  });

  afterEach(() => db.close());

  test("creates orders by consolidating duplicate items", async () => {
    const order = await service.createOrder(user, {
      items: [
        { productId: "product-1", quantity: 2 },
        { productId: "product-1", quantity: 3 },
      ],
    });

    expect(order.userId).toBe(user.id);
    expect(order.items).toHaveLength(1);
    expect(order.items[0]?.quantity).toBe(5);
    expect(products.findById("product-1")?.quantity).toBe(7);
  });

  test("rejects empty orders and insufficient stock", async () => {
    await expect(service.createOrder(user, { items: [] }))
      .rejects.toHaveProperty("code", "ORDER_EMPTY_ITEMS");
    await expect(service.createOrder(user, { items: [{ productId: "product-1", quantity: 20 }] }))
      .rejects.toHaveProperty("code", "ORDER_INSUFFICIENT_STOCK");
    expect(products.findById("product-1")?.quantity).toBe(12);
  });

  test("restricts user access and cancel transitions", async () => {
    const order = await service.createOrder(user, { items: [{ productId: "product-1", quantity: 2 }] });

    await expect(service.findOrder(otherUser, order.id)).rejects.toHaveProperty("code", "ORDER_ACCESS_DENIED");
    expect((await service.cancelOrder(user, order.id)).status).toBe("cancelado");
    await expect(service.cancelOrder(user, order.id)).rejects.toHaveProperty(
      "code",
      "ORDER_INVALID_STATUS_TRANSITION",
    );
  });

  test("allows admin status updates except for cancelled orders", async () => {
    const order = await service.createOrder(user, { items: [{ productId: "product-1", quantity: 2 }] });

    expect((await service.updateAdminOrderStatus(admin, order.id, { status: "concluido" })).status).toBe("concluido");
    await expect(service.updateAdminOrderStatus(user, order.id, { status: "em_andamento" }))
      .rejects.toHaveProperty("code", "ADMIN_REQUIRED");

    const cancelled = await service.createOrder(user, { items: [{ productId: "product-1", quantity: 1 }] });
    await service.cancelOrder(user, cancelled.id);
    await expect(service.updateAdminOrderStatus(admin, cancelled.id, { status: "concluido" }))
      .rejects.toHaveProperty("code", "ORDER_INVALID_STATUS_TRANSITION");
  });

  test("returns admin dashboard counts", async () => {
    await service.createOrder(user, { items: [{ productId: "product-1", quantity: 2 }] });

    await expect(service.getAdminDashboard(user)).rejects.toHaveProperty("code", "ADMIN_REQUIRED");
    expect(await service.getAdminDashboard(admin)).toEqual({
      usersCount: 2,
      ordersCount: 1,
      productsCount: 1,
    });
  });
});
