import indexHtml from "../app/entrypoints/index.html";
import { existsSync } from "node:fs";

const pagesDir = new URL("../app/pages", import.meta.url).pathname;
const pages = existsSync(pagesDir)
  ? new Bun.FileSystemRouter({ style: "nextjs", dir: pagesDir })
  : null;

/** HTML routes Bun should bundle and serve as React entrypoints. */
export const frontendRoutes = {
  "/": indexHtml,
  "/login": indexHtml,
  "/users": indexHtml,
  "/users/:id": indexHtml,
};

/** Returns true when the URL maps to a React page. */
export function isFrontendRoute(pathname: string): boolean {
  return Boolean(pages?.match(pathname)) || pathname === "/" || pathname === "/login" ||
    pathname === "/users" || /^\/users\/[^/]+$/.test(pathname);
}
