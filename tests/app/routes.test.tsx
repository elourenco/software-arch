import { describe, expect, test } from "bun:test";
import { matchRoutes } from "react-router";
import { appRoutes } from "../../src/app/routes";

describe("appRoutes", () => {
  test.each([
    ["/", "dashboard"],
    ["/login", "login"],
    ["/users", "users"],
    ["/users/123", "user-detail"],
    ["/products", "products"],
    ["/orders", "orders"],
    ["/orders/123", "order-detail"],
    ["/admin/orders", "admin-orders"],
    ["/admin/orders/123", "admin-order-detail"],
  ])("matches %s to %s", (pathname, routeId) => {
    const matches = matchRoutes(appRoutes, pathname);

    expect(matches?.at(-1)?.route.id).toBe(routeId);
  });
});
