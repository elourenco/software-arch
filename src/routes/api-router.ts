type ApiHandler = {
  handle(request: Request): Response | Promise<Response>;
};

/** Delegates `/api` requests to the Elysia application. */
export function handleApiRequest(api: ApiHandler, request: Request): Response | Promise<Response> {
  return api.handle(request);
}
