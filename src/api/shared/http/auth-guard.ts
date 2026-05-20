import { AppError } from "../errors/app-error";

/** Extracts a Bearer token from request headers. */
export function getBearerToken(headers: Headers): string {
  const authorization = headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError("UNAUTHORIZED", "Missing bearer token", 401);
  }

  return authorization.slice("Bearer ".length);
}
