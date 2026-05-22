import { Navigate, type RouteObject, useParams } from "react-router";
import { AuthenticatedLayout } from "./components/AuthenticatedLayout";
import { PublicLayout } from "./components/PublicLayout";
import { RequireAuth } from "./components/RequireAuth";
import DashboardPage from "./pages";
import LoginPage from "./pages/login";
import UsersPage from "./pages/users";
import UserDetailPage from "./pages/users/[id]";

function UserDetailRoute() {
  const { id = "" } = useParams();
  return <UserDetailPage id={id} />;
}

export const appRoutes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: "/login", id: "login", element: <LoginPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AuthenticatedLayout />,
        children: [
          { path: "/", id: "dashboard", element: <DashboardPage /> },
          { path: "/users", id: "users", element: <UsersPage /> },
          { path: "/users/:id", id: "user-detail", element: <UserDetailRoute /> },
        ],
      },
    ],
  },
  { path: "*", id: "not-found", element: <Navigate to="/" replace /> },
];
