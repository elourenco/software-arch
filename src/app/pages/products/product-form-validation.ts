export type ProductFormState = {
  sku: string;
  name: string;
  quantity: string;
};

export type ProductFormErrors = Partial<Record<keyof ProductFormState, string>>;

export function validateProductForm(state: ProductFormState): ProductFormErrors {
  const errors: ProductFormErrors = {};
  const quantity = Number(state.quantity);

  if (!state.sku.trim()) errors.sku = "SKU obrigatorio.";
  if (state.name.trim().length < 2) errors.name = "Nome deve ter ao menos 2 caracteres.";
  if (!Number.isInteger(quantity) || quantity < 0) errors.quantity = "Quantidade deve ser zero ou maior.";

  return errors;
}

export function hasProductFormErrors(errors: ProductFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function normalizeProductInput(state: ProductFormState) {
  return {
    sku: state.sku.trim().toUpperCase(),
    name: state.name.trim(),
    quantity: Number(state.quantity),
  };
}
