export type ApiClientOptions = {
  baseUrl?: string;
  getToken?: () => string | null;
  fetcher?: (request: Request) => Promise<Response>;
};

type ApiErrorPayload = { error?: { code?: string; message?: string } };

export type Product = {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = {
  sku: string;
  name: string;
  quantity: number;
};

export type OrderStatus = "em_andamento" | "concluido" | "cancelado";
export type AdminOrderStatus = Exclude<OrderStatus, "cancelado">;

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  skuSnapshot: string;
  productNameSnapshot: string;
  quantity: number;
  createdAt: string;
};

export type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string };
  items: OrderItem[];
};

export type CreateOrderInput = {
  items: Array<{ productId: string; quantity: number }>;
};

export type AdminDashboard = {
  usersCount: number;
  ordersCount: number;
  productsCount: number;
};

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/** Small HTTP client that keeps UI calls behind the `/api` boundary. */
export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = options.baseUrl ?? globalThis.location?.origin ?? "http://localhost:3000";
  const fetcher = options.fetcher ?? fetch;

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers = new Headers({ accept: "application/json" });
    const token = options.getToken?.();
    if (token) headers.set("authorization", `Bearer ${token}`);
    if (body) headers.set("content-type", "application/json");

    const response = await fetcher(new Request(`${baseUrl}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }));
    if (!response.ok) {
      const payload = await readApiErrorPayload(response);
      const apiError = payload?.error;
      throw new ApiClientError(
        response.status,
        apiError?.code,
        apiError?.message ?? `API request failed with ${response.status}`,
      );
    }
    return response.status === 204 ? undefined as T : response.json() as Promise<T>;
  }

  return {
    get: <T>(path: string) => request<T>("GET", path),
    post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
    put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
    patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
    delete: <T>(path: string) => request<T>("DELETE", path),
    listProducts: () => request<Product[]>("GET", "/products"),
    countProducts: () => request<{ count: number }>("GET", "/products/count"),
    createProduct: (body: ProductInput) => request<Product>("POST", "/products", body),
    updateProduct: (id: string, body: Partial<ProductInput>) => request<Product>("PUT", `/products/${id}`, body),
    deleteProduct: (id: string) => request<void>("DELETE", `/products/${id}`),
    listOrders: () => request<Order[]>("GET", "/orders"),
    getOrder: (id: string) => request<Order>("GET", `/orders/${id}`),
    createOrder: (body: CreateOrderInput) => request<Order>("POST", "/orders", body),
    cancelOrder: (id: string) => request<Order>("PATCH", `/orders/${id}/cancel`),
    listAdminOrders: () => request<Order[]>("GET", "/admin/orders"),
    getAdminOrder: (id: string) => request<Order>("GET", `/admin/orders/${id}`),
    getAdminDashboard: () => request<AdminDashboard>("GET", "/admin/dashboard"),
    updateAdminOrderStatus: (id: string, status: AdminOrderStatus) => (
      request<Order>("PATCH", `/admin/orders/${id}/status`, { status })
    ),
  };
}

async function readApiErrorPayload(response: Response): Promise<ApiErrorPayload | null> {
  if (!response.headers.get("content-type")?.includes("application/json")) return null;
  try {
    return await response.json() as ApiErrorPayload;
  } catch {
    return null;
  }
}
