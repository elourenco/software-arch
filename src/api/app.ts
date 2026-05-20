import type { Database } from "bun:sqlite";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { env } from "./config/env";
import { createDatabase } from "./database/database";
import { runMigrations } from "./database/migrate";
import { AuthController } from "./modules/auth/auth.controller";
import { authRoutes } from "./modules/auth/auth.routes";
import { AuthService } from "./modules/auth/auth.service";
import { UserController } from "./modules/user/user.controller";
import { UserRepository } from "./modules/user/user.repository";
import { userRoutes } from "./modules/user/user.routes";
import { UserService } from "./modules/user/user.service";
import { handleApiError } from "./shared/errors/error-handler";

export type ApiAppOptions = {
  db?: Database;
  jwtSecret?: string;
  migrate?: boolean;
};

/** Creates the REST API with all modules and cross-cutting plugins. */
export function createApiApp(options: ApiAppOptions = {}) {
  const db = options.db ?? createDatabase();
  if (options.migrate ?? true) runMigrations(db);

  const userService = new UserService(new UserRepository(db));
  const authService = new AuthService(userService, options.jwtSecret ?? env.JWT_SECRET);
  const userController = new UserController(userService);
  const authController = new AuthController(authService);

  return new Elysia()
    .use(openapi({
      path: "/api/openapi",
      specPath: "/api/openapi/json",
      documentation: {
        info: { title: "Software Arch API", version: "1.0.0" },
        tags: [
          { name: "Health", description: "Runtime health checks" },
          { name: "Auth", description: "JWT authentication" },
          { name: "Users", description: "User CRUD operations" },
        ],
      },
    }))
    .onError(handleApiError)
    .get("/api/health", () => ({ status: "ok", timestamp: new Date().toISOString() }), {
      detail: { tags: ["Health"], summary: "Health check" },
    })
    .use(authRoutes(authController))
    .use(userRoutes(userController, authService));
}
