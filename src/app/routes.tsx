import { Navigate, type RouteObject, useParams } from "react-router";
import { Shell } from "./components/Shell";
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
    path: "/",
    element: <Shell />,
    children: [
      { index: true, id: "dashboard", element: <DashboardPage /> },
      { path: "login", id: "login", element: <LoginPage /> },
      { path: "users", id: "users", element: <UsersPage /> },
      { path: "users/:id", id: "user-detail", element: <UserDetailRoute /> },
      { path: "*", id: "not-found", element: <Navigate to="/" replace /> },
    ],
  },
];
