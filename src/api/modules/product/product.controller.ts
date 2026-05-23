import type { RequestUser } from "../../shared/http/request-user";
import type { ProductService } from "./product.service";
import type { CreateProductInput, UpdateProductInput } from "./product.schema";

type StatusSetter = { status?: number | string };

/** HTTP boundary for product catalog operations. */
export class ProductController {
  constructor(private readonly products: ProductService) {}

  list() {
    return this.products.listProducts();
  }

  async count() {
    return { count: await this.products.countProducts() };
  }

  findById(id: string) {
    return this.products.findProductById(id);
  }

  async create(currentUser: RequestUser, body: CreateProductInput, set: StatusSetter) {
    set.status = 201;
    return this.products.createProduct(currentUser, body);
  }

  update(currentUser: RequestUser, id: string, body: UpdateProductInput) {
    return this.products.updateProduct(currentUser, id, body);
  }

  async delete(currentUser: RequestUser, id: string) {
    await this.products.deleteProduct(currentUser, id);
    return new Response(null, { status: 204 });
  }
}
