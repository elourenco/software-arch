import type { Product } from "./product.model";

export type ProductRow = {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  created_at: string;
  updated_at: string;
};

/** Maps the SQLite row shape into the product domain model. */
export function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    quantity: row.quantity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
