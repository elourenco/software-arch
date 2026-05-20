export type ApiClientOptions = {
  baseUrl?: string;
  getToken?: () => string | null;
  fetcher?: (request: Request) => Promise<Response>;
};

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
    if (!response.ok) throw new Error(`API request failed with ${response.status}`);
    return response.status === 204 ? undefined as T : response.json() as Promise<T>;
  }

  return {
    get: <T>(path: string) => request<T>("GET", path),
    post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
    put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
    delete: <T>(path: string) => request<T>("DELETE", path),
  };
}
