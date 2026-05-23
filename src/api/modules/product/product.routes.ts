import { Elysia } from "elysia";
import type { AuthService } from "../auth/auth.service";
import { getBearerToken } from "../../shared/http/auth-guard";
import type { ProductController } from "./product.controller";
import { createProductSchema, productIdParamsSchema, updateProductSchema } from "./product.schema";

/** Registers protected `/api/products` routes. */
export function productRoutes(controller: ProductController, auth: AuthService) {
  const guard = async (request: Request) => auth.me(getBearerToken(request.headers));

  return new Elysia()
    .resolve(async ({ request }) => ({ currentUser: await guard(request) }))
    .get("/api/products", () => controller.list(), {
      detail: { tags: ["Products"], summary: "Find all products" },
    })
    .get("/api/products/count", () => controller.count(), {
      detail: { tags: ["Products"], summary: "Count products" },
    })
    .get("/api/products/:id", ({ params }) => controller.findById(params.id), {
      params: productIdParamsSchema,
      detail: { tags: ["Products"], summary: "Find product by id" },
    })
    .post("/api/products", ({ body, currentUser, set }) => controller.create(currentUser, body, set), {
      body: createProductSchema,
      detail: { tags: ["Products"], summary: "Create product" },
    })
    .put("/api/products/:id", ({ params, body, currentUser }) => controller.update(currentUser, params.id, body), {
      params: productIdParamsSchema,
      body: updateProductSchema,
      detail: { tags: ["Products"], summary: "Update product" },
    })
    .delete("/api/products/:id", ({ params, currentUser }) => controller.delete(currentUser, params.id), {
      params: productIdParamsSchema,
      detail: { tags: ["Products"], summary: "Delete product" },
    });
}
