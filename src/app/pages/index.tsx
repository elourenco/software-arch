import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { createApiClient, type AdminDashboard } from "../services/api-client";
import { getAccessToken, type AuthenticatedRouteContext } from "../services/auth-session";

const api = createApiClient({ getToken: () => getAccessToken() });

/** Role-aware dashboard entry point. */
export default function DashboardPage() {
  const { currentUser } = useOutletContext<AuthenticatedRouteContext>();
  const [status, setStatus] = useState("checking");
  const [metrics, setMetrics] = useState<AdminDashboard | null>(null);

  useEffect(() => {
    api.get<{ status: string }>("/health")
      .then((health) => setStatus(health.status))
      .catch(() => setStatus("offline"));

    if (currentUser.role === "admin") {
      api.getAdminDashboard()
        .then(setMetrics)
        .catch(() => setMetrics(null));
    }
  }, []);

  if (currentUser.role !== "admin") {
    return (
      <div className="page-stack">
        <Card>
          <CardHeader>
            <CardTitle>Meus pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Acompanhe pedidos em andamento, visualize itens e cancele pedidos ainda nao concluidos.
            </p>
          </CardContent>
          <CardFooter className="actions">
            <Button asChild>
              <Link to="/orders">Novo pedido</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <h1>Dashboard admin</h1>
          <p>Visao operacional de usuarios, produtos e pedidos.</p>
        </div>
        <Badge variant={status === "ok" ? "default" : "secondary"}>API {status}</Badge>
      </div>
      <div className="metric-grid">
        <MetricCard label="Usuarios cadastrados" value={metrics?.usersCount ?? 0} />
        <MetricCard label="Pedidos" value={metrics?.ordersCount ?? 0} />
        <MetricCard label="Produtos" value={metrics?.productsCount ?? 0} />
      </div>
      <div className="actions">
        <Button asChild>
          <Link to="/admin/orders">Ver pedidos</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/products">Gerenciar produtos</Link>
        </Button>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="metric-value">{value}</p>
      </CardContent>
    </Card>
  );
}
