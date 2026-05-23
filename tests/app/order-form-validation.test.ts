import { describe, expect, test } from "bun:test";
import {
  hasOrderFormErrors,
  normalizeOrderInput,
  validateOrderForm,
} from "../../src/app/pages/orders/order-form-validation";

describe("order form validation", () => {
  test("normalizes valid order items", () => {
    const state = { items: [{ productId: "product-1", quantity: "2" }] };
    const errors = validateOrderForm(state);

    expect(hasOrderFormErrors(errors)).toBe(false);
    expect(normalizeOrderInput(state)).toEqual({
      items: [{ productId: "product-1", quantity: 2 }],
    });
  });

  test("rejects empty or invalid order items", () => {
    expect(validateOrderForm({ items: [] })).toEqual({ form: "Adicione ao menos um produto." });
    expect(validateOrderForm({ items: [{ productId: "", quantity: "0" }] })).toEqual({
      items: [{ productId: "Selecione um produto.", quantity: "Quantidade deve ser maior que zero." }],
    });
  });
});
