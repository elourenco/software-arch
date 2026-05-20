import { AppError } from "../../shared/errors/app-error";

export function userNotFound(): AppError {
  return new AppError("USER_NOT_FOUND", "User not found", 404);
}

export function emailAlreadyExists(): AppError {
  return new AppError("EMAIL_ALREADY_EXISTS", "Email already exists", 409);
}
