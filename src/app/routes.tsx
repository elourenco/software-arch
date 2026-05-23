import { Navigate, type RouteObject, useParams } from "react-router";
import { AuthenticatedLayout } from "./components/AuthenticatedLayout";
import { PublicLayout } from "./components/PublicLayout";
import { RequireAuth } from "./components/RequireAuth";
import DashboardPage from "./pages";
import AdminOrderDetailPage from "./pages/admin/orders/[id]";
import AdminOrdersPage from "./pages/admin/orders";
import OrderDetailPage from "./pages/orders/[id]";
import OrdersPage from "./pages/orders";
import ProductsPage from "./pages/products";
import LoginPage from "./pages/login";
import UsersPage from "./pages/users";
import UserDetailPage from "./pages/users/[id]";

function UserDetailRoute() {
  const { id = "" } = useParams();
  return <UserDetailPage id={id} />;
}

function OrderDetailRoute() {
  const { id = "" } = useParams();
  return <OrderDetailPage id={id} />;
}

function AdminOrderDetailRoute() {
  const { id = "" } = useParams();
  return <AdminOrderDetailPage id={id} />;
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
          { path: "/orders", id: "orders", element: <OrdersPage /> },
          { path: "/orders/:id", id: "order-detail", element: <OrderDetailRoute /> },
          { path: "/users", id: "users", element: <UsersPage /> },
          { path: "/users/:id", id: "user-detail", element: <UserDetailRoute /> },
          { path: "/products", id: "products", element: <ProductsPage /> },
          { path: "/admin/orders", id: "admin-orders", element: <AdminOrdersPage /> },
          { path: "/admin/orders/:id", id: "admin-order-detail", element: <AdminOrderDetailRoute /> },
        ],
      },
    ],
  },
  { path: "*", id: "not-found", element: <Navigate to="/" replace /> },
];
