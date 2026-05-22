import { describe, expect, test } from "bun:test";
import { endAuthenticatedSession } from "../../src/app/services/auth-session";

describe("auth session", () => {
  test("ends the session by clearing the access token and replacing the route with login", () => {
    let token: string | null = "jwt-token";
    const navigations: Array<[string, { replace: boolean }]> = [];

    endAuthenticatedSession({
      storage: {
        getItem: () => token,
        removeItem: (key: string) => {
          if (key === "accessToken") token = null;
        },
      },
      navigate: (to, options) => navigations.push([to, options]),
    });

    expect(token).toBeNull();
    expect(navigations).toEqual([["/login", { replace: true }]]);
  });
});
