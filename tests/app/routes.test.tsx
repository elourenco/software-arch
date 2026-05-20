import { describe, expect, test } from "bun:test";
import { matchRoutes } from "react-router";
import { appRoutes } from "../../src/app/routes";

describe("appRoutes", () => {
  test.each([
    ["/", "dashboard"],
    ["/login", "login"],
    ["/users", "users"],
    ["/users/123", "user-detail"],
  ])("matches %s to %s", (pathname, routeId) => {
    const matches = matchRoutes(appRoutes, pathname);

    expect(matches?.at(-1)?.route.id).toBe(routeId);
  });
});
