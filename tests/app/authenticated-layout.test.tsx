import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Outlet, RouterProvider, createMemoryRouter, useOutletContext } from "react-router";
import { AuthenticatedLayout } from "../../src/app/components/AuthenticatedLayout";
import type { AuthenticatedRouteContext } from "../../src/app/services/auth-session";

describe("AuthenticatedLayout", () => {
  test("renders admin navigation and the logged-in user's name", () => {
    const router = createMemoryRouter([
      {
        path: "/",
        element: (
          <Outlet
            context={{
              currentUser: {
                id: "user-1",
                name: "Grace Hopper",
                email: "grace@example.com",
                role: "admin",
                createdAt: "2026-05-21T00:00:00.000Z",
                updatedAt: "2026-05-21T00:00:00.000Z",
              },
            }}
          />
        ),
        children: [
          {
            path: "/",
            element: <AuthenticatedLayout />,
            children: [{ index: true, element: <p>Dashboard content</p> }],
          },
        ],
      },
    ]);

    const html = renderToStaticMarkup(<RouterProvider router={router} />);

    expect(html).toContain("Grace Hopper");
    expect(html).toContain("aria-haspopup=\"menu\"");
    expect(html).toContain("Usuarios");
    expect(html).toContain("Produtos");
    expect(html).toContain("Pedidos");
  });

  test("hides admin navigation for normal users", () => {
    const router = createMemoryRouter([
      {
        path: "/",
        element: (
          <Outlet
            context={{
              currentUser: {
                id: "user-1",
                name: "Buyer",
                email: "buyer@example.com",
                role: "user",
                createdAt: "2026-05-21T00:00:00.000Z",
                updatedAt: "2026-05-21T00:00:00.000Z",
              },
            }}
          />
        ),
        children: [
          {
            path: "/",
            element: <AuthenticatedLayout />,
            children: [{ index: true, element: <p>Dashboard content</p> }],
          },
        ],
      },
    ]);

    const html = renderToStaticMarkup(<RouterProvider router={router} />);

    expect(html).toContain("Buyer");
    expect(html).toContain("Pedidos");
    expect(html).not.toContain("Usuarios");
    expect(html).not.toContain("Produtos");
  });

  test("forwards authenticated context to nested private routes", () => {
    function NestedRoute() {
      const { currentUser } = useOutletContext<AuthenticatedRouteContext>();
      return <p>Nested user: {currentUser.email}</p>;
    }

    const router = createMemoryRouter([
      {
        path: "/",
        element: (
          <Outlet
            context={{
              currentUser: {
                id: "user-1",
                name: "Buyer",
                email: "buyer@example.com",
                role: "user",
                createdAt: "2026-05-21T00:00:00.000Z",
                updatedAt: "2026-05-21T00:00:00.000Z",
              },
            }}
          />
        ),
        children: [
          {
            path: "/",
            element: <AuthenticatedLayout />,
            children: [{ index: true, element: <NestedRoute /> }],
          },
        ],
      },
    ]);

    const html = renderToStaticMarkup(<RouterProvider router={router} />);

    expect(html).toContain("Nested user: buyer@example.com");
  });
});
