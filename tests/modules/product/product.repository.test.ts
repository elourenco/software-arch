import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { AppError } from "../../../src/api/shared/errors/app-error";
import { ProductRepository } from "../../../src/api/modules/product/product.repository";
import { createMigratedTestDatabase } from "../../helpers/test-db";

describe("ProductRepository", () => {
  let db: Database;
  let repository: ProductRepository;
  const seededAdminId = "00000000-0000-4000-8000-000000000001";

  beforeEach(() => {
    db = createMigratedTestDatabase();
    repository = new ProductRepository(db);
  });

  afterEach(() => db.close());

  test("persists products and normalizes SKU through prepared statements", () => {
    const product = repository.create({
      id: "product-1",
      sku: "sku-001",
      name: "Keyboard",
      quantity: 12,
      createdAt: "2026-05-22T00:00:00.000Z",
      updatedAt: "2026-05-22T00:00:00.000Z",
    });

    expect(product.sku).toBe("SKU-001");
    expect(repository.count()).toBe(1);
    expect(repository.findAll().map((item) => item.sku)).toEqual(["SKU-001"]);
    expect(repository.findById("product-1")?.name).toBe("Keyboard");
    expect(repository.findBySku("sku-001")?.id).toBe("product-1");
  });

  test("updates, deletes, and converts duplicate SKUs to domain errors", () => {
    const product = repository.create({
      id: "product-1",
      sku: "SKU-001",
      name: "Keyboard",
      quantity: 12,
      createdAt: "2026-05-22T00:00:00.000Z",
      updatedAt: "2026-05-22T00:00:00.000Z",
    });

    const updated = repository.update(product.id, {
      name: "Mechanical Keyboard",
      quantity: 9,
      updatedAt: "2026-05-23T00:00:00.000Z",
    });

    expect(updated?.name).toBe("Mechanical Keyboard");
    expect(updated?.quantity).toBe(9);
    expect(() => repository.create({ ...product, id: "product-2" })).toThrow(AppError);
    expect(repository.delete(product.id)).toBe(true);
    expect(repository.findById(product.id)).toBeNull();
  });

  test("detects products already referenced by order items", () => {
    repository.create({
      id: "product-1",
      sku: "SKU-001",
      name: "Keyboard",
      quantity: 12,
      createdAt: "2026-05-22T00:00:00.000Z",
      updatedAt: "2026-05-22T00:00:00.000Z",
    });
    db.query(`
      INSERT INTO orders (id, user_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run("order-1", seededAdminId, "em_andamento", "2026-05-22T00:00:00.000Z", "2026-05-22T00:00:00.000Z");
    db.query(`
      INSERT INTO order_items (id, order_id, product_id, sku_snapshot, product_name_snapshot, quantity, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run("item-1", "order-1", "product-1", "SKU-001", "Keyboard", 1, "2026-05-22T00:00:00.000Z");

    expect(repository.hasOrderItems("product-1")).toBe(true);
  });
});
