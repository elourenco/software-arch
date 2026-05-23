import { ChevronUpIcon, LogOutIcon } from "lucide-react";
import { NavLink, Outlet, useNavigate, useOutletContext } from "react-router";
import { endAuthenticatedSession, type AuthenticatedRouteContext } from "../services/auth-session";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

function navClassName({ isActive }: { isActive: boolean }) {
  return isActive ? "sidebar-link sidebar-link-active" : "sidebar-link";
}

/** Private application chrome with primary sidebar navigation. */
export function AuthenticatedLayout() {
  const navigate = useNavigate();
  const { currentUser } = useOutletContext<AuthenticatedRouteContext>();

  return (
    <main className="auth-layout">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="sidebar-brand">Software Arch</div>
        <nav className="sidebar-nav">
          <NavLink className={navClassName} end to="/">
            Dashboard
          </NavLink>
          <NavLink className={navClassName} to="/orders">
            Pedidos
          </NavLink>
          {currentUser.role === "admin" && (
            <>
              <NavLink className={navClassName} to="/users">
                Usuarios
              </NavLink>
              <NavLink className={navClassName} to="/products">
                Produtos
              </NavLink>
              <NavLink className={navClassName} to="/admin/orders">
                Pedidos admin
              </NavLink>
            </>
          )}
        </nav>
        <footer className="sidebar-footer">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-haspopup="menu"
                aria-label={`Open session menu for ${currentUser.name}`}
                className="sidebar-user-trigger"
                variant="ghost"
              >
                <span className="sidebar-user-copy">
                  <span className="sidebar-user-name">{currentUser.name}</span>
                  <span className="sidebar-user-email">{currentUser.email}</span>
                </span>
                <ChevronUpIcon aria-hidden="true" data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56" side="top">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{currentUser.name}</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => endAuthenticatedSession({ navigate })}>
                  <LogOutIcon aria-hidden="true" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </footer>
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
