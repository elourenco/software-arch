import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Field } from "../../components/Field";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { ApiClientError, createApiClient, type Product } from "../../services/api-client";
import { getAccessToken } from "../../services/auth-session";
import {
  type ProductFormErrors,
  type ProductFormState,
  hasProductFormErrors,
  normalizeProductInput,
  validateProductForm,
} from "./product-form-validation";

const api = createApiClient({ getToken: () => getAccessToken() });
const emptyProductForm: ProductFormState = { sku: "", name: "", quantity: "0" };

/** Admin product management page. */
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [formApiError, setFormApiError] = useState("");
  const [listError, setListError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setListError("");
    try {
      setProducts(await api.listProducts());
    } catch {
      setListError("Nao foi possivel carregar produtos.");
    }
  }

  useEffect(() => { void load(); }, []);

  function openCreateForm() {
    setEditingProduct(null);
    setProductForm(emptyProductForm);
    setFormErrors({});
    setFormApiError("");
    setIsFormOpen(true);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setProductForm({ sku: product.sku, name: product.name, quantity: String(product.quantity) });
    setFormErrors({});
    setFormApiError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingProduct(null);
    setProductForm(emptyProductForm);
    setFormErrors({});
    setFormApiError("");
  }

  function updateField(field: keyof ProductFormState, value: string) {
    setProductForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
    setFormApiError("");
  }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault();
    const errors = validateProductForm(productForm);
    setFormErrors(errors);
    setFormApiError("");
    if (hasProductFormErrors(errors)) return;

    setIsSaving(true);
    try {
      const input = normalizeProductInput(productForm);
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, input);
      } else {
        await api.createProduct(input);
      }
      closeForm();
      await load();
    } catch (error) {
      setFormApiError(toProductFormErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteProduct(product: Product) {
    if (!confirm(`Deletar ${product.sku}?`)) return;
    setDeletingId(product.id);
    setListError("");
    try {
      await api.deleteProduct(product.id);
      await load();
    } catch (error) {
      setListError(toProductDeleteErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="toolbar">
          <CardTitle>Produtos</CardTitle>
          <Button type="button" onClick={openCreateForm}>
            <Plus data-icon="inline-start" />
            Criar produto
          </Button>
        </div>
      </CardHeader>
      <CardContent className="page-stack">
        {listError && <p className="text-sm text-destructive" role="alert">{listError}</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.sku}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>
                  <Badge variant={product.quantity > 0 ? "secondary" : "outline"}>{product.quantity}</Badge>
                </TableCell>
                <TableCell>
                  <div className="table-actions">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEditForm(product)}>
                      <Edit data-icon="inline-start" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === product.id}
                      onClick={() => void deleteProduct(product)}
                    >
                      <Trash2 data-icon="inline-start" />
                      {deletingId === product.id ? "Deletando..." : "Deletar"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={4}>
                  Nenhum produto cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isFormOpen} onOpenChange={(open) => (open ? openCreateForm() : closeForm())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar produto" : "Criar produto"}</DialogTitle>
            <DialogDescription>Informe SKU, nome e quantidade disponivel.</DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={saveProduct} noValidate>
            <Field label="SKU" name="productSku" value={productForm.sku} onChange={(value) => updateField("sku", value)} error={formErrors.sku} disabled={isSaving} required />
            <Field label="Nome" name="productName" value={productForm.name} onChange={(value) => updateField("name", value)} error={formErrors.name} disabled={isSaving} required />
            <Field label="Quantidade" name="productQuantity" type="number" min="0" value={productForm.quantity} onChange={(value) => updateField("quantity", value)} error={formErrors.quantity} disabled={isSaving} required />
            {formApiError && <p className="text-sm text-destructive" role="alert">{formApiError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={isSaving} onClick={closeForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar produto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function toProductFormErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.code === "PRODUCT_SKU_ALREADY_EXISTS") return "SKU ja cadastrado.";
    if (error.code === "ADMIN_REQUIRED") return "Apenas admin pode salvar produtos.";
  }
  return "Nao foi possivel salvar produto.";
}

function toProductDeleteErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError && error.code === "PRODUCT_HAS_ORDERS") {
    return "Produto ja usado em pedido e nao pode ser deletado.";
  }
  return "Nao foi possivel deletar produto.";
}
