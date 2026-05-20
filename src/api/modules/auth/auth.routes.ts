import { Elysia } from "elysia";
import type { AuthController } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.schema";

/** Registers `/api/auth` public and protected routes. */
export function authRoutes(controller: AuthController) {
  return new Elysia()
    .post("/api/auth/register", ({ body, set }) => controller.register(body, set), {
      body: registerSchema,
      detail: { tags: ["Auth"], summary: "Register user" },
    })
    .post("/api/auth/login", ({ body }) => controller.login(body), {
      body: loginSchema,
      detail: { tags: ["Auth"], summary: "Login user" },
    })
    .get("/api/auth/me", ({ request }) => controller.me(request), {
      detail: { tags: ["Auth"], summary: "Get current user" },
    });
}
