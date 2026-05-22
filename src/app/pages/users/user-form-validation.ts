export type UserRole = "admin" | "user";

export type CreateUserFormState = {
  name: string;
  email: string;
  password: string;
  role: string;
};

export type CreateUserFormErrors = Partial<Record<keyof CreateUserFormState, string>>;

export type CreateUserRequest = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCreateUserForm(input: CreateUserFormState): CreateUserFormErrors {
  const errors: CreateUserFormErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();

  if (name.length < 2) errors.name = "Name must have at least 2 characters.";
  if (!EMAIL_PATTERN.test(email)) errors.email = "Use a valid email address.";
  if (input.password.length < 8) errors.password = "Password must have at least 8 characters.";
  if (!isUserRole(input.role)) errors.role = "Role must be admin or user.";

  return errors;
}

export function normalizeCreateUserInput(input: CreateUserFormState): CreateUserRequest {
  return {
    name: input.name.trim(),
    email: input.email.trim(),
    password: input.password,
    role: isUserRole(input.role) ? input.role : "user",
  };
}

export function hasCreateUserFormErrors(errors: CreateUserFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

function isUserRole(value: string): value is UserRole {
  return value === "admin" || value === "user";
}
