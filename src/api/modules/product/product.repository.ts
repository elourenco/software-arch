import type { Database } from "bun:sqlite";
import { productSkuAlreadyExists } from "./product.errors";
import { mapProductRow, type ProductRow } from "./product.mapper";
import type { Product, UpdateProductData } from "./product.model";

type SqlParam = string | number;

/** Persists products through Bun SQLite prepared statements. */
export class ProductRepository {
  constructor(private readonly db: Database) {}

  create(product: Product): Product {
    const normalized = { ...product, sku: normalizeSku(product.sku) };
    try {
      this.db.query(`
        INSERT INTO products (id, sku, name, quantity, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        normalized.id,
        normalized.sku,
        normalized.name,
        normalized.quantity,
        normalized.createdAt,
        normalized.updatedAt,
      );
      return normalized;
    } catch (error) {
      if (String(error).includes("UNIQUE constraint failed: products.sku")) throw productSkuAlreadyExists();
      throw error;
    }
  }

  findAll(): Product[] {
    return this.rows("SELECT * FROM products ORDER BY created_at DESC, name ASC");
  }

  count(): number {
    return Number((this.db.query("SELECT COUNT(*) as count FROM products").get() as { count: number }).count);
  }

  findById(id: string): Product | null {
    return this.row("SELECT * FROM products WHERE id = ?", id);
  }

  findBySku(sku: string): Product | null {
    return this.row("SELECT * FROM products WHERE sku = ?", normalizeSku(sku));
  }

  update(id: string, data: UpdateProductData & { updatedAt: string }): Product | null {
    const current = this.findById(id);
    if (!current) return null;
    return this.createReplacement({
      ...current,
      sku: data.sku ? normalizeSku(data.sku) : current.sku,
      name: data.name ?? current.name,
      quantity: data.quantity ?? current.quantity,
      updatedAt: data.updatedAt,
    });
  }

  delete(id: string): boolean {
    return this.db.query("DELETE FROM products WHERE id = ?").run(id).changes > 0;
  }

  hasOrderItems(id: string): boolean {
    const result = this.db.query("SELECT COUNT(*) as count FROM order_items WHERE product_id = ?").get(id) as {
      count: number;
    };
    return Number(result.count) > 0;
  }

  private createReplacement(product: Product): Product {
    try {
      this.db.query("UPDATE products SET sku = ?, name = ?, quantity = ?, updated_at = ? WHERE id = ?")
        .run(product.sku, product.name, product.quantity, product.updatedAt, product.id);
      return product;
    } catch (error) {
      if (String(error).includes("UNIQUE constraint failed: products.sku")) throw productSkuAlreadyExists();
      throw error;
    }
  }

  private row(sql: string, ...params: SqlParam[]): Product | null {
    const row = this.db.query(sql).get(...params) as ProductRow | null;
    return row ? mapProductRow(row) : null;
  }

  private rows(sql: string, ...params: SqlParam[]): Product[] {
    return (this.db.query(sql).all(...params) as ProductRow[]).map(mapProductRow);
  }
}

export function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase();
}
