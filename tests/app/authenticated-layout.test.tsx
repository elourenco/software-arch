import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Outlet, RouterProvider, createMemoryRouter } from "react-router";
import { AuthenticatedLayout } from "../../src/app/components/AuthenticatedLayout";

describe("AuthenticatedLayout", () => {
  test("renders the logged-in user's name as a sidebar footer menu trigger", () => {
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
  });
});
