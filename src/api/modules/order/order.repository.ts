import type { Database } from "bun:sqlite";
import { productNotFound } from "../product/product.errors";
import { orderInsufficientStock } from "./order.errors";
import { mapOrderRows, type OrderRow } from "./order.mapper";
import type { AdminOrderStatus, CreateOrderData, Order } from "./order.model";

type ProductStockRow = {
  id: string;
  sku: string;
  name: string;
  quantity: number;
};

/** Persists orders and owns stock mutation transactions. */
export class OrderRepository {
  constructor(private readonly db: Database) {}

  createOrder(data: CreateOrderData): Order {
    return this.db.transaction(() => {
      this.db.query(`
        INSERT INTO orders (id, user_id, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(data.id, data.userId, data.status, data.createdAt, data.updatedAt);

      for (const item of data.items) {
        const product = this.findProductForStock(item.productId);
        if (!product) throw productNotFound();
        if (product.quantity < item.quantity) throw orderInsufficientStock();

        const stockUpdate = this.db.query(`
          UPDATE products
          SET quantity = quantity - ?, updated_at = ?
          WHERE id = ? AND quantity >= ?
        `).run(item.quantity, data.updatedAt, item.productId, item.quantity);
        if (stockUpdate.changes === 0) throw orderInsufficientStock();

        this.db.query(`
          INSERT INTO order_items (
            id,
            order_id,
            product_id,
            sku_snapshot,
            product_name_snapshot,
            quantity,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          crypto.randomUUID(),
          data.id,
          item.productId,
          product.sku,
          product.name,
          item.quantity,
          data.createdAt,
        );
      }

      const created = this.findById(data.id);
      if (!created) throw new Error("Created order could not be loaded");
      return created;
    })();
  }

  findById(id: string): Order | null {
    return this.findOne("WHERE o.id = ?", id);
  }

  findByIdForUser(id: string, userId: string): Order | null {
    return this.findOne("WHERE o.id = ? AND o.user_id = ?", id, userId);
  }

  findAllByUser(userId: string): Order[] {
    return this.findMany("WHERE o.user_id = ?", userId);
  }

  findAllAdmin(): Order[] {
    return this.findMany("");
  }

  countAll(): number {
    return Number((this.db.query("SELECT COUNT(*) as count FROM orders").get() as { count: number }).count);
  }

  cancelOrder(id: string, updatedAt: string): Order | null {
    const current = this.findById(id);
    if (!current) return null;

    return this.db.transaction(() => {
      this.db.query("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").run("cancelado", updatedAt, id);
      for (const item of current.items) {
        this.db.query("UPDATE products SET quantity = quantity + ?, updated_at = ? WHERE id = ?")
          .run(item.quantity, updatedAt, item.productId);
      }
      return this.findById(id);
    })();
  }

  updateStatus(id: string, status: AdminOrderStatus, updatedAt: string): Order | null {
    const result = this.db.query("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").run(status, updatedAt, id);
    return result.changes > 0 ? this.findById(id) : null;
  }

  private findOne(whereClause: string, ...params: string[]): Order | null {
    return this.findMany(whereClause, ...params)[0] ?? null;
  }

  private findMany(whereClause: string, ...params: string[]): Order[] {
    const rows = this.db.query(`
      SELECT
        o.id AS order_id,
        o.user_id,
        o.status,
        o.created_at AS order_created_at,
        o.updated_at AS order_updated_at,
        u.name AS user_name,
        u.email AS user_email,
        oi.id AS item_id,
        oi.product_id,
        oi.sku_snapshot,
        oi.product_name_snapshot,
        oi.quantity,
        oi.created_at AS item_created_at
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN users u ON u.id = o.user_id
      ${whereClause}
      ORDER BY o.created_at DESC, oi.created_at ASC
    `).all(...params) as OrderRow[];
    return mapOrderRows(rows);
  }

  private findProductForStock(productId: string): ProductStockRow | null {
    return this.db.query("SELECT id, sku, name, quantity FROM products WHERE id = ?").get(productId) as ProductStockRow | null;
  }
}
