import { AppError } from "../../shared/errors/app-error";

export function invalidCredentials(): AppError {
  return new AppError("INVALID_CREDENTIALS", "Invalid email or password", 401);
}
