import { Elysia } from "elysia";
import type { AuthService } from "../auth/auth.service";
import { getBearerToken } from "../../shared/http/auth-guard";
import type { OrderController } from "./order.controller";
import { createOrderSchema, orderIdParamsSchema, updateOrderStatusSchema } from "./order.schema";

/** Registers protected user and admin order routes. */
export function orderRoutes(controller: OrderController, auth: AuthService) {
  const guard = async (request: Request) => auth.me(getBearerToken(request.headers));

  return new Elysia()
    .resolve(async ({ request }) => ({ currentUser: await guard(request) }))
    .get("/api/orders", ({ currentUser }) => controller.list(currentUser), {
      detail: { tags: ["Orders"], summary: "Find current user's orders" },
    })
    .get("/api/orders/:id", ({ currentUser, params }) => controller.find(currentUser, params.id), {
      params: orderIdParamsSchema,
      detail: { tags: ["Orders"], summary: "Find current user's order by id" },
    })
    .post("/api/orders", ({ currentUser, body, set }) => controller.create(currentUser, body, set), {
      body: createOrderSchema,
      detail: { tags: ["Orders"], summary: "Create order" },
    })
    .patch("/api/orders/:id/cancel", ({ currentUser, params }) => controller.cancel(currentUser, params.id), {
      params: orderIdParamsSchema,
      detail: { tags: ["Orders"], summary: "Cancel current user's order" },
    })
    .get("/api/admin/orders", ({ currentUser }) => controller.adminList(currentUser), {
      detail: { tags: ["Admin"], summary: "Find all orders" },
    })
    .get("/api/admin/orders/count", ({ currentUser }) => controller.adminCount(currentUser), {
      detail: { tags: ["Admin"], summary: "Count all orders" },
    })
    .get("/api/admin/orders/:id", ({ currentUser, params }) => controller.adminFind(currentUser, params.id), {
      params: orderIdParamsSchema,
      detail: { tags: ["Admin"], summary: "Find any order by id" },
    })
    .patch("/api/admin/orders/:id/status", ({ currentUser, params, body }) => (
      controller.adminUpdateStatus(currentUser, params.id, body)
    ), {
      params: orderIdParamsSchema,
      body: updateOrderStatusSchema,
      detail: { tags: ["Admin"], summary: "Update order status" },
    })
    .get("/api/admin/dashboard", ({ currentUser }) => controller.adminDashboard(currentUser), {
      detail: { tags: ["Admin"], summary: "Get admin dashboard metrics" },
    });
}
