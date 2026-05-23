import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { createApiClient, type Order } from "../../../services/api-client";
import { getAccessToken } from "../../../services/auth-session";
import { StatusBadge, shortId } from "../../orders";

const api = createApiClient({ getToken: () => getAccessToken() });

/** Admin order list with status tags and detail navigation. */
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listAdminOrders()
      .then(setOrders)
      .catch(() => setError("Nao foi possivel carregar pedidos."));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos</CardTitle>
      </CardHeader>
      <CardContent className="page-stack">
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{shortId(order.id)}</TableCell>
                <TableCell>{order.user?.email ?? order.userId}</TableCell>
                <TableCell><StatusBadge status={order.status} /></TableCell>
                <TableCell>{order.items.length}</TableCell>
                <TableCell>
                  <div className="table-actions">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/admin/orders/${order.id}`}>
                        <Eye data-icon="inline-start" />
                        Visualizar
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={5}>
                  Nenhum pedido encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
