import { describe, expect, test } from "bun:test";
import {
  type UserFormState,
  normalizeCreateUserInput,
  normalizeUpdateUserInput,
  validateUserForm,
} from "../../src/app/pages/users/user-form-validation";

describe("user form validation", () => {
  test("accepts valid create-user data", () => {
    const input: UserFormState = {
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "strong-password",
      role: "admin",
    };

    expect(validateUserForm(input, "create")).toEqual({});
    expect(normalizeCreateUserInput(input)).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "strong-password",
      role: "admin",
    });
  });

  test("rejects invalid create-user data before submitting", () => {
    expect(validateUserForm({
      name: "A",
      email: "not-email",
      password: "short",
      role: "owner",
    }, "create")).toEqual({
      name: "Name must have at least 2 characters.",
      email: "Use a valid email address.",
      password: "Password must have at least 8 characters.",
      role: "Role must be admin or user.",
    });
  });

  test("accepts edit-user data with an empty password", () => {
    const input: UserFormState = {
      name: "Grace Hopper",
      email: "grace@example.com",
      password: "",
      role: "user",
    };

    expect(validateUserForm(input, "edit")).toEqual({});
    expect(normalizeUpdateUserInput(input)).toEqual({
      name: "Grace Hopper",
      email: "grace@example.com",
      role: "user",
    });
  });

  test("rejects short edit-user passwords when provided", () => {
    expect(validateUserForm({
      name: "Grace Hopper",
      email: "grace@example.com",
      password: "short",
      role: "user",
    }, "edit")).toEqual({
      password: "Password must have at least 8 characters.",
    });
  });
});
