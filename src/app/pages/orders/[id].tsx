import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { createApiClient, type Order } from "../../services/api-client";
import { getAccessToken } from "../../services/auth-session";
import { StatusBadge, shortId } from ".";

const api = createApiClient({ getToken: () => getAccessToken() });

/** User order detail page. */
export default function OrderDetailPage({ id }: { id: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      setOrder(await api.getOrder(id));
    } catch {
      setError("Nao foi possivel carregar pedido.");
    }
  }

  useEffect(() => { void load(); }, [id]);

  async function cancelOrder() {
    if (!order || !confirm(`Cancelar pedido ${order.id}?`)) return;
    try {
      setOrder(await api.cancelOrder(order.id));
    } catch {
      setError("Nao foi possivel cancelar pedido.");
    }
  }

  if (error) return <p className="text-sm text-destructive" role="alert">{error}</p>;
  if (!order) return <p className="text-sm text-muted-foreground">Carregando pedido...</p>;

  return (
    <Card>
      <CardHeader>
        <div className="toolbar">
          <CardTitle>Pedido {shortId(order.id)}</CardTitle>
          <StatusBadge status={order.status} />
        </div>
      </CardHeader>
      <CardContent>
        <OrderItemsTable order={order} />
      </CardContent>
      {order.status === "em_andamento" && (
        <CardFooter className="actions">
          <Button type="button" variant="destructive" onClick={() => void cancelOrder()}>
            <Trash2 data-icon="inline-start" />
            Cancelar pedido
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export function OrderItemsTable({ order }: { order: Order }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Produto</TableHead>
          <TableHead>Quantidade</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {order.items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.skuSnapshot}</TableCell>
            <TableCell>{item.productNameSnapshot}</TableCell>
            <TableCell>{item.quantity}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
