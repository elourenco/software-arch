export interface Product {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export type PublicProduct = Product;

export type CreateProductData = Pick<Product, "name" | "quantity" | "sku">;

export type UpdateProductData = Partial<CreateProductData>;
