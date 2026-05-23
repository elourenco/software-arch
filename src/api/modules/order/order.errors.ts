import { AppError } from "../../shared/errors/app-error";

export function adminRequired(): AppError {
  return new AppError("ADMIN_REQUIRED", "Admin role is required", 403);
}

export function orderNotFound(): AppError {
  return new AppError("ORDER_NOT_FOUND", "Order not found", 404);
}

export function orderAccessDenied(): AppError {
  return new AppError("ORDER_ACCESS_DENIED", "Order access denied", 403);
}

export function orderEmptyItems(): AppError {
  return new AppError("ORDER_EMPTY_ITEMS", "Order must contain at least one item", 400);
}

export function orderInsufficientStock(): AppError {
  return new AppError("ORDER_INSUFFICIENT_STOCK", "Insufficient product stock", 409);
}

export function orderInvalidStatusTransition(): AppError {
  return new AppError("ORDER_INVALID_STATUS_TRANSITION", "Invalid order status transition", 409);
}
