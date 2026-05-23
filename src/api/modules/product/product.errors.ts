import { AppError } from "../../shared/errors/app-error";

export function adminRequired(): AppError {
  return new AppError("ADMIN_REQUIRED", "Admin role is required", 403);
}

export function productNotFound(): AppError {
  return new AppError("PRODUCT_NOT_FOUND", "Product not found", 404);
}

export function productSkuAlreadyExists(): AppError {
  return new AppError("PRODUCT_SKU_ALREADY_EXISTS", "Product SKU already exists", 409);
}

export function productHasOrders(): AppError {
  return new AppError("PRODUCT_HAS_ORDERS", "Product is already referenced by orders", 409);
}
