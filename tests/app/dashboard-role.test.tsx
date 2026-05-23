import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Outlet, RouterProvider, createMemoryRouter } from "react-router";
import DashboardPage from "../../src/app/pages";
import type { AuthenticatedUser } from "../../src/app/services/auth-session";

const baseUser: AuthenticatedUser = {
  id: "user-1",
  name: "Buyer",
  email: "buyer@example.com",
  role: "user",
  createdAt: "2026-05-22T00:00:00.000Z",
  updatedAt: "2026-05-22T00:00:00.000Z",
};

describe("DashboardPage", () => {
  test("renders the user dashboard entry point for normal users", () => {
    const html = renderDashboard(baseUser);

    expect(html).toContain("Meus pedidos");
    expect(html).toContain("Novo pedido");
  });

  test("renders admin metrics entry point for admins", () => {
    const html = renderDashboard({ ...baseUser, role: "admin" });

    expect(html).toContain("Dashboard admin");
    expect(html).toContain("Usuarios cadastrados");
    expect(html).toContain("Pedidos");
    expect(html).toContain("Produtos");
  });
});

function renderDashboard(currentUser: AuthenticatedUser) {
  const router = createMemoryRouter([
    {
      path: "/",
      element: <Outlet context={{ currentUser }} />,
      children: [{ index: true, element: <DashboardPage /> }],
    },
  ]);

  return renderToStaticMarkup(<RouterProvider router={router} />);
}
