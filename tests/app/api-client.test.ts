import { describe, expect, test } from "bun:test";
import { ApiClientError, createApiClient } from "../../src/app/services/api-client";

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

  test("throws typed errors with API error payloads", async () => {
    const client = createApiClient({
      baseUrl: "http://example.com",
      fetcher: async () => Response.json(
        { error: { code: "EMAIL_ALREADY_EXISTS", message: "Email already exists" } },
        { status: 409 },
      ),
    });

    await expect(client.post("/users", {})).rejects.toMatchObject({
      status: 409,
      code: "EMAIL_ALREADY_EXISTS",
      message: "Email already exists",
    });
  });
});
