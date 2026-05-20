import { describe, expect, test } from "bun:test";
import { createApiClient } from "../../src/app/services/api-client";

describe("createApiClient", () => {
  test("prefixes API requests and sends bearer tokens", async () => {
    let captured: Request | undefined;
    const client = createApiClient({
      baseUrl: "http://example.com",
      getToken: () => "abc",
      fetcher: async (request) => {
        captured = request;
        return Response.json({ ok: true });
      },
    });

    await client.get("/users");

    expect(captured?.url).toBe("http://example.com/api/users");
    expect(captured?.headers.get("authorization")).toBe("Bearer abc");
  });
});
