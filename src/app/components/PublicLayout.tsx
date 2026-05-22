import { Outlet } from "react-router";

/** Public chrome for unauthenticated routes. */
export function PublicLayout() {
  return (
    <main className="public-layout">
      <header className="public-header">
        <a className="header-link" href="/api/openapi">OpenAPI</a>
      </header>
      <section className="public-content">
        <Outlet />
      </section>
    </main>
  );
}
