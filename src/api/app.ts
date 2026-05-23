import type { Database } from "bun:sqlite";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { env } from "./config/env";
import { createDatabase } from "./database/database";
import { runMigrations } from "./database/migrate";
import { AuthController } from "./modules/auth/auth.controller";
import { authRoutes } from "./modules/auth/auth.routes";
import { AuthService } from "./modules/auth/auth.service";
import { OrderController } from "./modules/order/order.controller";
import { OrderRepository } from "./modules/order/order.repository";
import { orderRoutes } from "./modules/order/order.routes";
import { OrderService } from "./modules/order/order.service";
import { ProductController } from "./modules/product/product.controller";
import { ProductRepository } from "./modules/product/product.repository";
import { productRoutes } from "./modules/product/product.routes";
import { ProductService } from "./modules/product/product.service";
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

  const userRepository = new UserRepository(db);
  const productRepository = new ProductRepository(db);
  const orderRepository = new OrderRepository(db);
  const userService = new UserService(userRepository);
  const productService = new ProductService(productRepository);
  const orderService = new OrderService(orderRepository, userRepository, productRepository);
  const authService = new AuthService(userService, options.jwtSecret ?? env.JWT_SECRET);
  const userController = new UserController(userService);
  const productController = new ProductController(productService);
  const orderController = new OrderController(orderService);
  const authController = new AuthController(authService);

  return new Elysia()
    .use(openapi({
      path: "/api/openapi",
      specPath: "/api/openapi/json",
      scalar: {
        url: "/api/openapi/json",
      },
      documentation: {
        info: { title: "Software Arch API", version: "1.0.0" },
        tags: [
          { name: "Health", description: "Runtime health checks" },
          { name: "Auth", description: "JWT authentication" },
          { name: "Users", description: "User CRUD operations" },
          { name: "Products", description: "Product catalog and inventory operations" },
          { name: "Orders", description: "User order workflows" },
          { name: "Admin", description: "Administrative order and dashboard workflows" },
        ],
      },
    }))
    .onError(handleApiError)
    .get("/api/health", () => ({ status: "ok", timestamp: new Date().toISOString() }), {
      detail: { tags: ["Health"], summary: "Health check" },
    })
    .use(authRoutes(authController))
    .use(userRoutes(userController, authService))
    .use(productRoutes(productController, authService))
    .use(orderRoutes(orderController, authService));
}
