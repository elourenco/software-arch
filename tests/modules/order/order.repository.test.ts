import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { OrderRepository } from "../../../src/api/modules/order/order.repository";
import { ProductRepository } from "../../../src/api/modules/product/product.repository";
import { createMigratedTestDatabase } from "../../helpers/test-db";

describe("OrderRepository", () => {
  let db: Database;
  let orders: OrderRepository;
  let products: ProductRepository;
  const userId = "00000000-0000-4000-8000-000000000001";

  beforeEach(() => {
    db = createMigratedTestDatabase();
    orders = new OrderRepository(db);
    products = new ProductRepository(db);
    products.create({
      id: "product-1",
      sku: "SKU-001",
      name: "Keyboard",
      quantity: 12,
      createdAt: "2026-05-22T00:00:00.000Z",
      updatedAt: "2026-05-22T00:00:00.000Z",
    });
  });

  afterEach(() => db.close());

  test("creates an order with item snapshots and decrements stock", () => {
    const order = orders.createOrder({
      id: "order-1",
      userId,
      status: "em_andamento",
      createdAt: "2026-05-22T00:00:00.000Z",
      updatedAt: "2026-05-22T00:00:00.000Z",
      items: [{ productId: "product-1", quantity: 2 }],
    });

    expect(order.items).toEqual([
      expect.objectContaining({
        productId: "product-1",
        skuSnapshot: "SKU-001",
        productNameSnapshot: "Keyboard",
        quantity: 2,
      }),
    ]);
    expect(products.findById("product-1")?.quantity).toBe(10);
    expect(orders.findAllByUser(userId)).toHaveLength(1);
    expect(orders.findAllAdmin()).toHaveLength(1);
    expect(orders.countAll()).toBe(1);
  });

  test("restores stock when an order is cancelled", () => {
    orders.createOrder({
      id: "order-1",
      userId,
      status: "em_andamento",
      createdAt: "2026-05-22T00:00:00.000Z",
      updatedAt: "2026-05-22T00:00:00.000Z",
      items: [{ productId: "product-1", quantity: 3 }],
    });

    const cancelled = orders.cancelOrder("order-1", "2026-05-23T00:00:00.000Z");

    expect(cancelled?.status).toBe("cancelado");
    expect(products.findById("product-1")?.quantity).toBe(12);
  });

  test("keeps stock unchanged when creation fails for insufficient stock", () => {
    expect(() => orders.createOrder({
      id: "order-1",
      userId,
      status: "em_andamento",
      createdAt: "2026-05-22T00:00:00.000Z",
      updatedAt: "2026-05-22T00:00:00.000Z",
      items: [{ productId: "product-1", quantity: 20 }],
    })).toThrow();

    expect(products.findById("product-1")?.quantity).toBe(12);
    expect(orders.countAll()).toBe(0);
  });
});
