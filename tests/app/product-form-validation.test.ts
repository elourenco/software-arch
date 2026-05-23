import { describe, expect, test } from "bun:test";
import {
  hasProductFormErrors,
  normalizeProductInput,
  validateProductForm,
} from "../../src/app/pages/products/product-form-validation";

describe("product form validation", () => {
  test("normalizes valid product input", () => {
    const errors = validateProductForm({ sku: " sku-001 ", name: " Keyboard ", quantity: "12" });

    expect(hasProductFormErrors(errors)).toBe(false);
    expect(normalizeProductInput({ sku: " sku-001 ", name: " Keyboard ", quantity: "12" })).toEqual({
      sku: "SKU-001",
      name: "Keyboard",
      quantity: 12,
    });
  });

  test("rejects invalid product input", () => {
    const errors = validateProductForm({ sku: "", name: "A", quantity: "-1" });

    expect(errors).toEqual({
      sku: "SKU obrigatorio.",
      name: "Nome deve ter ao menos 2 caracteres.",
      quantity: "Quantidade deve ser zero ou maior.",
    });
  });
});
