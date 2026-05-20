import { NavLink, Outlet } from "react-router";

/** Shared chrome for the demo React application. */
export function Shell() {
  return (
    <main className="shell">
      <nav className="nav">
        <NavLink className={({ isActive }) => isActive ? "nav-link nav-link-active" : "nav-link"} end to="/">
          Dashboard
        </NavLink>
        <NavLink className={({ isActive }) => isActive ? "nav-link nav-link-active" : "nav-link"} to="/login">
          Login
        </NavLink>
        <NavLink className={({ isActive }) => isActive ? "nav-link nav-link-active" : "nav-link"} to="/users">
          Users
        </NavLink>
        <a href="/api/openapi">OpenAPI</a>
      </nav>
      <Outlet />
    </main>
  );
}
