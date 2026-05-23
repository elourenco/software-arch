import { Elysia } from "elysia";
import type { AuthService } from "../auth/auth.service";
import type { UserController } from "./user.controller";
import { createUserSchema, searchUserQuerySchema, updateUserSchema, userIdParamsSchema } from "./user.schema";
import { getBearerToken } from "../../shared/http/auth-guard";

/** Registers protected `/api/users` routes. */
export function userRoutes(controller: UserController, auth: AuthService) {
  const guard = async (request: Request) => auth.me(getBearerToken(request.headers));

  return new Elysia()
    .resolve(async ({ request }) => ({ currentUser: await guard(request) }))
    .get("/api/users", ({ currentUser }) => controller.list(currentUser.id), {
      detail: { tags: ["Users"], summary: "Find all users" },
    })
    .get("/api/users/count", ({ currentUser }) => controller.count(currentUser.id), {
      detail: { tags: ["Users"], summary: "Count users" },
    })
    .get("/api/users/search", ({ query, currentUser }) => controller.search(query.name, currentUser.id), {
      query: searchUserQuerySchema,
      detail: { tags: ["Users"], summary: "Find users by name" },
    })
    .get("/api/users/:id", ({ params }) => controller.findById(params.id), {
      params: userIdParamsSchema,
      detail: { tags: ["Users"], summary: "Find user by id" },
    })
    .post("/api/users", ({ body, set }) => controller.create(body, set), {
      body: createUserSchema,
      detail: { tags: ["Users"], summary: "Create user" },
    })
    .put("/api/users/:id", ({ params, body }) => controller.update(params.id, body), {
      params: userIdParamsSchema,
      body: updateUserSchema,
      detail: { tags: ["Users"], summary: "Update user" },
    })
    .delete("/api/users/:id", ({ params }) => controller.delete(params.id), {
      params: userIdParamsSchema,
      detail: { tags: ["Users"], summary: "Delete user" },
    });
}
