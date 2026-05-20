import { createApiApp } from "./api/app";
import { env } from "./api/config/env";
import { handleApiRequest } from "./routes/api-router";
import { frontendRoutes, isFrontendRoute } from "./routes/frontend-router";

const api = createApiApp();

const server = Bun.serve({
  port: env.PORT,
  routes: frontendRoutes,
  development: env.NODE_ENV !== "production",
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api")) return handleApiRequest(api, request);
    if (isFrontendRoute(url.pathname)) return new Response(null, { status: 404 });
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at ${server.url}`);
