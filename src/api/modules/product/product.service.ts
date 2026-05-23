import type { RequestUser } from "../../shared/http/request-user";
import { adminRequired, productHasOrders, productNotFound, productSkuAlreadyExists } from "./product.errors";
import type { Product, PublicProduct } from "./product.model";
import { normalizeSku, type ProductRepository } from "./product.repository";
import type { CreateProductInput, UpdateProductInput } from "./product.schema";

/** Owns product business rules and admin-only write authorization. */
export class ProductService {
  constructor(private readonly products: ProductRepository) {}

  async listProducts(): Promise<PublicProduct[]> {
    return this.products.findAll();
  }

  async countProducts(): Promise<number> {
    return this.products.count();
  }

  async findProductById(id: string): Promise<PublicProduct> {
    const product = this.products.findById(id);
    if (!product) throw productNotFound();
    return product;
  }

  async createProduct(currentUser: RequestUser, input: CreateProductInput): Promise<PublicProduct> {
    assertAdmin(currentUser);
    const sku = normalizeSku(input.sku);
    if (this.products.findBySku(sku)) throw productSkuAlreadyExists();
    const now = new Date().toISOString();
    return this.products.create({
      id: crypto.randomUUID(),
      sku,
      name: input.name.trim(),
      quantity: input.quantity,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateProduct(
    currentUser: RequestUser,
    id: string,
    input: UpdateProductInput,
  ): Promise<PublicProduct> {
    assertAdmin(currentUser);
    const current = this.products.findById(id);
    if (!current) throw productNotFound();
    const sku = input.sku ? normalizeSku(input.sku) : undefined;
    const existing = sku ? this.products.findBySku(sku) : null;
    if (existing && existing.id !== id) throw productSkuAlreadyExists();
    const updated = this.products.update(id, {
      sku,
      name: input.name?.trim(),
      quantity: input.quantity,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) throw productNotFound();
    return updated;
  }

  async deleteProduct(currentUser: RequestUser, id: string): Promise<void> {
    assertAdmin(currentUser);
    if (!this.products.findById(id)) throw productNotFound();
    if (this.products.hasOrderItems(id)) throw productHasOrders();
    if (!this.products.delete(id)) throw productNotFound();
  }
}

function assertAdmin(user: Pick<RequestUser, "role">): void {
  if (user.role !== "admin") throw adminRequired();
}

export function toProductSnapshot(product: Product) {
  return {
    productId: product.id,
    skuSnapshot: product.sku,
    productNameSnapshot: product.name,
  };
}
