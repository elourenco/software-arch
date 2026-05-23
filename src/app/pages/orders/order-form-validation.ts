export type OrderFormItemState = {
  productId: string;
  quantity: string;
};

export type OrderFormState = {
  items: OrderFormItemState[];
};

export type OrderFormItemErrors = Partial<Record<keyof OrderFormItemState, string>>;
export type OrderFormErrors = {
  form?: string;
  items?: OrderFormItemErrors[];
};

export function validateOrderForm(state: OrderFormState): OrderFormErrors {
  if (state.items.length === 0) return { form: "Adicione ao menos um produto." };

  const itemErrors = state.items.map((item) => {
    const errors: OrderFormItemErrors = {};
    const quantity = Number(item.quantity);
    if (!item.productId) errors.productId = "Selecione um produto.";
    if (!Number.isInteger(quantity) || quantity < 1) errors.quantity = "Quantidade deve ser maior que zero.";
    return errors;
  });

  return itemErrors.some((errors) => Object.values(errors).some(Boolean)) ? { items: itemErrors } : {};
}

export function hasOrderFormErrors(errors: OrderFormErrors): boolean {
  return Boolean(errors.form || errors.items?.some((item) => Object.values(item).some(Boolean)));
}

export function normalizeOrderInput(state: OrderFormState) {
  return {
    items: state.items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
    })),
  };
}
