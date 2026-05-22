import { describe, expect, test } from "bun:test";
import {
  type CreateUserFormState,
  normalizeCreateUserInput,
  validateCreateUserForm,
} from "../../src/app/pages/users/user-form-validation";

describe("validateCreateUserForm", () => {
  test("accepts valid create-user data", () => {
    const input: CreateUserFormState = {
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "strong-password",
      role: "admin",
    };

    expect(validateCreateUserForm(input)).toEqual({});
    expect(normalizeCreateUserInput(input)).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "strong-password",
      role: "admin",
    });
  });

  test("rejects invalid create-user data before submitting", () => {
    expect(validateCreateUserForm({
      name: "A",
      email: "not-email",
      password: "short",
      role: "owner",
    })).toEqual({
      name: "Name must have at least 2 characters.",
      email: "Use a valid email address.",
      password: "Password must have at least 8 characters.",
      role: "Role must be admin or user.",
    });
  });
});
