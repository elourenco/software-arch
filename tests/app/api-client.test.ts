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

  test("exposes typed product and order helpers", async () => {
    const seen: Array<{ method: string; url: string; body?: string }> = [];
    const client = createApiClient({
      baseUrl: "http://example.com",
      fetcher: async (request) => {
        seen.push({
          method: request.method,
          url: request.url,
          body: request.method === "GET" ? undefined : await request.text(),
        });
        return Response.json({ ok: true });
      },
    });

    await client.createProduct({ sku: "SKU-001", name: "Keyboard", quantity: 12 });
    await client.createOrder({ items: [{ productId: "product-1", quantity: 2 }] });
    await client.updateAdminOrderStatus("order-1", "concluido");

    expect(seen).toEqual([
      {
        method: "POST",
        url: "http://example.com/api/products",
        body: JSON.stringify({ sku: "SKU-001", name: "Keyboard", quantity: 12 }),
      },
      {
        method: "POST",
        url: "http://example.com/api/orders",
        body: JSON.stringify({ items: [{ productId: "product-1", quantity: 2 }] }),
      },
      {
        method: "PATCH",
        url: "http://example.com/api/admin/orders/order-1/status",
        body: JSON.stringify({ status: "concluido" }),
      },
    ]);
  });
});
