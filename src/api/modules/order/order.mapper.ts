import type { Order, OrderItem, OrderStatus } from "./order.model";

export type OrderRow = {
  order_id: string;
  user_id: string;
  status: OrderStatus;
  order_created_at: string;
  order_updated_at: string;
  user_name: string | null;
  user_email: string | null;
  item_id: string;
  product_id: string;
  sku_snapshot: string;
  product_name_snapshot: string;
  quantity: number;
  item_created_at: string;
};

/** Groups joined order/item rows into order aggregates. */
export function mapOrderRows(rows: OrderRow[]): Order[] {
  const orders = new Map<string, Order>();

  for (const row of rows) {
    const existing = orders.get(row.order_id);
    const item: OrderItem = {
      id: row.item_id,
      orderId: row.order_id,
      productId: row.product_id,
      skuSnapshot: row.sku_snapshot,
      productNameSnapshot: row.product_name_snapshot,
      quantity: row.quantity,
      createdAt: row.item_created_at,
    };

    if (existing) {
      existing.items.push(item);
      continue;
    }

    orders.set(row.order_id, {
      id: row.order_id,
      userId: row.user_id,
      status: row.status,
      createdAt: row.order_created_at,
      updatedAt: row.order_updated_at,
      user: row.user_name && row.user_email
        ? { id: row.user_id, name: row.user_name, email: row.user_email }
        : undefined,
      items: [item],
    });
  }

  return Array.from(orders.values());
}
