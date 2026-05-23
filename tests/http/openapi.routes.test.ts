import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { createApiApp } from "../../src/api/app";
import { createMigratedTestDatabase } from "../helpers/test-db";

describe("openapi documentation routes", () => {
  let db: Database;
  let app: ReturnType<typeof createApiApp>;

  beforeEach(() => {
    db = createMigratedTestDatabase();
    app = createApiApp({ db, jwtSecret: "test-secret" });
  });

  afterEach(() => db.close());

  test("exposes the generated OpenAPI document paths", async () => {
    const response = await app.handle(new Request("http://localhost/api/openapi/json"));
    const spec = await response.json() as {
      openapi: string;
      paths: Record<string, unknown>;
    };

    expect(response.status).toBe(200);
    expect(spec.openapi).toBe("3.0.3");
    const paths = Object.keys(spec.paths);
    expect(paths).toHaveLength(19);
    expect(paths).toEqual(expect.arrayContaining([
      "/api/health",
      "/api/auth/register",
      "/api/auth/login",
      "/api/auth/me",
      "/api/users",
      "/api/users/count",
      "/api/users/search",
      "/api/users/{id}",
      "/api/products",
      "/api/products/count",
      "/api/products/{id}",
      "/api/orders",
      "/api/orders/{id}",
      "/api/orders/{id}/cancel",
      "/api/admin/orders",
      "/api/admin/orders/count",
      "/api/admin/orders/{id}",
      "/api/admin/orders/{id}/status",
      "/api/admin/dashboard",
    ]));
  });

  test("renders Scalar with an absolute OpenAPI spec URL", async () => {
    const response = await app.handle(new Request("http://localhost/api/openapi"));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("id=\"api-reference\"");
    expect(html).toContain("\"url\":\"/api/openapi/json\"");
    expect(html).not.toContain("\"url\":\"api/openapi/json\"");
  });
});
