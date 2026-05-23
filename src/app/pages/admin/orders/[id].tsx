import { Check, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";
import { createApiClient, type AdminOrderStatus, type Order } from "../../../services/api-client";
import { getAccessToken } from "../../../services/auth-session";
import { OrderItemsTable } from "../../orders/[id]";
import { StatusBadge, shortId } from "../../orders";

const api = createApiClient({ getToken: () => getAccessToken() });

/** Admin order detail with status update controls. */
export default function AdminOrderDetailPage({ id }: { id: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    setError("");
    try {
      setOrder(await api.getAdminOrder(id));
    } catch {
      setError("Nao foi possivel carregar pedido.");
    }
  }

  useEffect(() => { void load(); }, [id]);

  async function updateStatus(status: AdminOrderStatus) {
    if (!order) return;
    setIsSaving(true);
    setError("");
    try {
      setOrder(await api.updateAdminOrderStatus(order.id, status));
    } catch {
      setError("Nao foi possivel atualizar status.");
    } finally {
      setIsSaving(false);
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
      <CardContent className="page-stack">
        <div className="detail-grid">
          <div>
            <span className="detail-label">Usuario</span>
            <strong>{order.user?.name ?? order.userId}</strong>
            {order.user?.email && <span className="text-sm text-muted-foreground">{order.user.email}</span>}
          </div>
          <div>
            <span className="detail-label">Itens</span>
            <strong>{order.items.length}</strong>
          </div>
        </div>
        <OrderItemsTable order={order} />
      </CardContent>
      <CardFooter className="actions">
        <Button
          type="button"
          variant="secondary"
          disabled={isSaving || order.status === "cancelado"}
          onClick={() => void updateStatus("em_andamento")}
        >
          <Clock data-icon="inline-start" />
          Em andamento
        </Button>
        <Button
          type="button"
          disabled={isSaving || order.status === "cancelado"}
          onClick={() => void updateStatus("concluido")}
        >
          <Check data-icon="inline-start" />
          Concluido
        </Button>
      </CardFooter>
    </Card>
  );
}
