import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { ProductRepository } from "../../../src/api/modules/product/product.repository";
import { ProductService } from "../../../src/api/modules/product/product.service";
import type { RequestUser } from "../../../src/api/shared/http/request-user";
import { createMigratedTestDatabase } from "../../helpers/test-db";

const admin: RequestUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "admin",
  createdAt: "2026-05-22T00:00:00.000Z",
  updatedAt: "2026-05-22T00:00:00.000Z",
};

const user: RequestUser = { ...admin, id: "user-1", email: "user@example.com", role: "user" };

describe("ProductService", () => {
  let db: Database;
  let repository: ProductRepository;
  let service: ProductService;
  const seededAdminId = "00000000-0000-4000-8000-000000000001";

  beforeEach(() => {
    db = createMigratedTestDatabase();
    repository = new ProductRepository(db);
    service = new ProductService(repository);
  });

  afterEach(() => db.close());

  test("allows admins to manage products and exposes public products", async () => {
    const product = await service.createProduct(admin, {
      sku: "sku-001",
      name: "Keyboard",
      quantity: 12,
    });

    expect(product.sku).toBe("SKU-001");
    expect(await service.countProducts()).toBe(1);
    expect(await service.listProducts()).toEqual([product]);
    expect((await service.updateProduct(admin, product.id, { quantity: 8 })).quantity).toBe(8);
    await service.deleteProduct(admin, product.id);
    await expect(service.findProductById(product.id)).rejects.toHaveProperty("code", "PRODUCT_NOT_FOUND");
  });

  test("blocks non-admin writes and duplicate SKUs", async () => {
    await expect(service.createProduct(user, {
      sku: "SKU-001",
      name: "Keyboard",
      quantity: 12,
    })).rejects.toHaveProperty("code", "ADMIN_REQUIRED");

    await service.createProduct(admin, { sku: "SKU-001", name: "Keyboard", quantity: 12 });
    await expect(service.createProduct(admin, {
      sku: "sku-001",
      name: "Other Keyboard",
      quantity: 5,
    })).rejects.toHaveProperty("code", "PRODUCT_SKU_ALREADY_EXISTS");
  });

  test("blocks deletion when a product is referenced by order items", async () => {
    const product = await service.createProduct(admin, { sku: "SKU-001", name: "Keyboard", quantity: 12 });
    db.query(`
      INSERT INTO orders (id, user_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run("order-1", seededAdminId, "em_andamento", "2026-05-22T00:00:00.000Z", "2026-05-22T00:00:00.000Z");
    db.query(`
      INSERT INTO order_items (id, order_id, product_id, sku_snapshot, product_name_snapshot, quantity, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run("item-1", "order-1", product.id, product.sku, product.name, 1, "2026-05-22T00:00:00.000Z");

    await expect(service.deleteProduct(admin, product.id)).rejects.toHaveProperty("code", "PRODUCT_HAS_ORDERS");
  });
});
