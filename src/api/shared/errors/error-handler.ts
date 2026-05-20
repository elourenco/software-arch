import { AppError } from "./app-error";

type ErrorContext = { error: unknown; set: { status?: number | string } };

/** Converts known domain and validation errors into stable API payloads. */
export function handleApiError({ error, set }: ErrorContext) {
  if (error instanceof AppError) {
    set.status = error.statusCode;
    return { error: { code: error.code, message: error.message } };
  }

  if (isValidationError(error)) {
    set.status = 400;
    return { error: { code: "VALIDATION_ERROR", message: "Invalid request payload" } };
  }

  console.error(error);
  set.status = 500;
  return { error: { code: "INTERNAL_ERROR", message: "Unexpected server error" } };
}

function isValidationError(error: unknown): boolean {
  return error instanceof Error && (
    error.name.includes("Validation") ||
    error.message.includes("validation") ||
    error.message.includes("Expected")
  );
}
