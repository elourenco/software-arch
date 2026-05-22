export type UserRole = "admin" | "user";
export type UserFormMode = "create" | "edit";

export type UserFormState = {
  name: string;
  email: string;
  password: string;
  role: string;
};

export type UserFormErrors = Partial<Record<keyof UserFormState, string>>;

export type CreateUserRequest = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type UpdateUserRequest = {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
};

export type CreateUserFormState = UserFormState;
export type CreateUserFormErrors = UserFormErrors;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUserForm(input: UserFormState, mode: UserFormMode): UserFormErrors {
  const errors: UserFormErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const passwordRequired = mode === "create";
  const passwordProvided = input.password.length > 0;

  if (name.length < 2) errors.name = "Name must have at least 2 characters.";
  if (!EMAIL_PATTERN.test(email)) errors.email = "Use a valid email address.";
  if ((passwordRequired || passwordProvided) && input.password.length < 8) {
    errors.password = "Password must have at least 8 characters.";
  }
  if (!isUserRole(input.role)) errors.role = "Role must be admin or user.";

  return errors;
}

export function validateCreateUserForm(input: CreateUserFormState): CreateUserFormErrors {
  return validateUserForm(input, "create");
}

export function normalizeCreateUserInput(input: UserFormState): CreateUserRequest {
  return {
    name: input.name.trim(),
    email: input.email.trim(),
    password: input.password,
    role: isUserRole(input.role) ? input.role : "user",
  };
}

export function normalizeUpdateUserInput(input: UserFormState): UpdateUserRequest {
  const request: UpdateUserRequest = {
    name: input.name.trim(),
    email: input.email.trim(),
    role: isUserRole(input.role) ? input.role : "user",
  };
  if (input.password.length > 0) request.password = input.password;
  return request;
}

export function hasUserFormErrors(errors: UserFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export const hasCreateUserFormErrors = hasUserFormErrors;

function isUserRole(value: string): value is UserRole {
  return value === "admin" || value === "user";
}
