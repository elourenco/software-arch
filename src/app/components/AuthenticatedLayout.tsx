import { NavLink, Outlet } from "react-router";

function navClassName({ isActive }: { isActive: boolean }) {
  return isActive ? "sidebar-link sidebar-link-active" : "sidebar-link";
}

/** Private application chrome with primary sidebar navigation. */
export function AuthenticatedLayout() {
  return (
    <main className="auth-layout">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="sidebar-brand">Software Arch</div>
        <nav className="sidebar-nav">
          <NavLink className={navClassName} end to="/">
            Dashboard
          </NavLink>
          <NavLink className={navClassName} to="/users">
            Users
          </NavLink>
        </nav>
      </aside>
      <section className="auth-main">
        <header className="auth-header">
          <a className="header-link" href="/api/openapi">OpenAPI</a>
        </header>
        <div className="auth-content">
          <Outlet />
        </div>
      </section>
    </main>
  );
}
