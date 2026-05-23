import { Eye, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { createApiClient, type Order, type Product } from "../../services/api-client";
import { getAccessToken } from "../../services/auth-session";
import {
  type OrderFormErrors,
  type OrderFormState,
  hasOrderFormErrors,
  normalizeOrderInput,
  validateOrderForm,
} from "./order-form-validation";

const api = createApiClient({ getToken: () => getAccessToken() });
const emptyOrderForm: OrderFormState = { items: [] };

/** User dashboard with order cards and order creation. */
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderForm, setOrderForm] = useState<OrderFormState>(emptyOrderForm);
  const [formErrors, setFormErrors] = useState<OrderFormErrors>({});
  const [formApiError, setFormApiError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [listError, setListError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function load() {
    setListError("");
    try {
      const [nextOrders, nextProducts] = await Promise.all([api.listOrders(), api.listProducts()]);
      setOrders(nextOrders);
      setProducts(nextProducts);
    } catch {
      setListError("Nao foi possivel carregar pedidos.");
    }
  }

  useEffect(() => { void load(); }, []);

  function addItem() {
    const firstProduct = products.find((product) => product.quantity > 0);
    setOrderForm((current) => ({
      items: [...current.items, { productId: firstProduct?.id ?? "", quantity: "1" }],
    }));
    setFormErrors({});
    setFormApiError("");
  }

  function updateItem(index: number, field: "productId" | "quantity", value: string) {
    setOrderForm((current) => ({
      items: current.items.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
    setFormErrors({});
    setFormApiError("");
  }

  function removeItem(index: number) {
    setOrderForm((current) => ({ items: current.items.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function openCreateForm() {
    setOrderForm(emptyOrderForm);
    setFormErrors({});
    setFormApiError("");
    setIsFormOpen(true);
  }

  function closeCreateForm() {
    setIsFormOpen(false);
    setOrderForm(emptyOrderForm);
    setFormErrors({});
    setFormApiError("");
  }

  async function saveOrder(event: React.FormEvent) {
    event.preventDefault();
    const errors = validateOrderForm(orderForm);
    setFormErrors(errors);
    setFormApiError("");
    if (hasOrderFormErrors(errors)) return;

    setIsSaving(true);
    try {
      await api.createOrder(normalizeOrderInput(orderForm));
      closeCreateForm();
      await load();
    } catch {
      setFormApiError("Nao foi possivel efetivar pedido. Verifique o estoque.");
    } finally {
      setIsSaving(false);
    }
  }

  async function cancelOrder(order: Order) {
    if (!confirm(`Cancelar pedido ${order.id}?`)) return;
    setCancellingId(order.id);
    try {
      await api.cancelOrder(order.id);
      await load();
    } catch {
      setListError("Nao foi possivel cancelar pedido.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <h1>Meus pedidos</h1>
          <p>Acompanhe status, itens e cancelamento de pedidos em andamento.</p>
        </div>
        <Button type="button" onClick={openCreateForm}>
          <Plus data-icon="inline-start" />
          Novo pedido
        </Button>
      </div>

      {listError && <p className="text-sm text-destructive" role="alert">{listError}</p>}

      <div className="order-card-grid">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="toolbar">
                <CardTitle>Pedido {shortId(order.id)}</CardTitle>
                <StatusBadge status={order.status} />
              </div>
            </CardHeader>
            <CardContent className="page-stack">
              <p className="text-sm text-muted-foreground">{order.items.length} item(ns)</p>
              <p className="text-sm text-muted-foreground">Criado em {formatDate(order.createdAt)}</p>
            </CardContent>
            <CardFooter className="actions">
              <Button asChild variant="outline" size="sm">
                <Link to={`/orders/${order.id}`}>
                  <Eye data-icon="inline-start" />
                  Visualizar
                </Link>
              </Button>
              {order.status === "em_andamento" && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={cancellingId === order.id}
                  onClick={() => void cancelOrder(order)}
                >
                  <Trash2 data-icon="inline-start" />
                  {cancellingId === order.id ? "Cancelando..." : "Cancelar"}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
        {orders.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>}
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => (open ? openCreateForm() : closeCreateForm())}>
        <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo pedido</DialogTitle>
            <DialogDescription>Adicione produtos com estoque disponivel.</DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={saveOrder} noValidate>
            <div className="page-stack">
              {orderForm.items.map((item, index) => (
                <div className="order-item-row" key={`${index}-${item.productId}`}>
                  <div className="field">
                    <Label htmlFor={`product-${index}`}>Produto</Label>
                    <select
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      id={`product-${index}`}
                      value={item.productId}
                      onChange={(event) => updateItem(index, "productId", event.currentTarget.value)}
                    >
                      <option value="">Selecione</option>
                      {products.map((product) => (
                        <option disabled={product.quantity === 0} key={product.id} value={product.id}>
                          {product.sku} - {product.name} ({product.quantity})
                        </option>
                      ))}
                    </select>
                    {formErrors.items?.[index]?.productId && (
                      <p className="text-sm text-destructive" role="alert">{formErrors.items[index]?.productId}</p>
                    )}
                  </div>
                  <div className="field">
                    <Label htmlFor={`quantity-${index}`}>Quantidade</Label>
                    <input
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      id={`quantity-${index}`}
                      min="1"
                      type="number"
                      value={item.quantity}
                      onChange={(event) => updateItem(index, "quantity", event.currentTarget.value)}
                    />
                    {formErrors.items?.[index]?.quantity && (
                      <p className="text-sm text-destructive" role="alert">{formErrors.items[index]?.quantity}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="justify-self-end md:col-span-2"
                    onClick={() => removeItem(index)}
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="secondary" onClick={addItem}>
              <Plus data-icon="inline-start" />
              Adicionar produto
            </Button>
            {formErrors.form && <p className="text-sm text-destructive" role="alert">{formErrors.form}</p>}
            {formApiError && <p className="text-sm text-destructive" role="alert">{formApiError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={isSaving} onClick={closeCreateForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Efetivando..." : "Efetivar pedido"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function StatusBadge({ status }: { status: Order["status"] }) {
  const variant = status === "cancelado" ? "destructive" : status === "concluido" ? "default" : "secondary";
  return <Badge variant={variant}>{formatStatus(status)}</Badge>;
}

export function formatStatus(status: Order["status"]) {
  if (status === "em_andamento") return "em andamento";
  return status;
}

export function shortId(id: string) {
  return id.slice(0, 8);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}
