# Users List Create Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework `/users` into a table-first management page with create-user modal, explicit edit/delete actions, and verified create validation on both UI and API boundaries.

**Architecture:** Keep the existing React Router shape and the `/api` boundary through `src/app/services/api-client.ts`. Preserve `/users/:id` for editing, add only the creation modal to `/users`, and leave the backend contract unchanged except for test coverage. Use small UI primitives consistent with the existing manual shadcn/Radix style.

**Tech Stack:** Bun, React 19, React Router 7, Elysia, Zod, Bun SQLite, radix-ui, lucide-react, bun:test.

---

## File Structure

- Modify `tests/http/users.routes.test.ts`: add explicit invalid-create coverage for `POST /api/users`.
- Modify `src/app/services/api-client.ts`: preserve current API client shape and add a typed `ApiClientError` carrying HTTP status and API error code.
- Modify `tests/app/api-client.test.ts`: verify non-2xx API errors expose `status`, `code`, and `message`.
- Create `src/app/pages/users/user-form-validation.ts`: small pure validation helper for create-user form state.
- Create `tests/app/user-form-validation.test.ts`: cover valid/invalid client-side form validation without rendering React.
- Modify `src/app/components/Field.tsx`: support native input props and field-level errors.
- Create `src/app/components/ui/dialog.tsx`: local Radix dialog primitive matching existing UI component style.
- Modify `src/app/pages/users/index.tsx`: implement toolbar, modal form, validation, typed API error handling, and table action column.

## Task 1: Backend Create Validation Coverage

**Files:**
- Modify: `tests/http/users.routes.test.ts`

- [ ] **Step 1: Add failing HTTP validation test**

Add this test after the existing CRUD test:

```ts
test("rejects invalid user creation payloads", async () => {
  const auth = { authorization: `Bearer ${token}`, "content-type": "application/json" };
  const invalid = await app.handle(new Request("http://localhost/api/users", {
    method: "POST",
    body: JSON.stringify({ name: "A", email: "not-email", password: "short", role: "user" }),
    headers: auth,
  }));

  expect(invalid.status).toBe(400);
  expect(await invalid.json()).toEqual({
    error: { code: "VALIDATION_ERROR", message: "Invalid request payload" },
  });
});
```

- [ ] **Step 2: Run focused test**

Run:

```bash
bun test tests/http/users.routes.test.ts
```

Expected: PASS if the API route is already correctly guarded by `createUserSchema`; otherwise fail with a non-400 response.

- [ ] **Step 3: Fix backend only if the test fails**

If the test fails because validation is missing, ensure `src/api/modules/user/user.routes.ts` keeps:

```ts
.post("/api/users", ({ body, set }) => controller.create(body, set), {
  body: createUserSchema,
  detail: { tags: ["Users"], summary: "Create user" },
})
```

- [ ] **Step 4: Re-run focused test**

Run:

```bash
bun test tests/http/users.routes.test.ts
```

Expected: PASS.

## Task 2: Typed API Client Errors

**Files:**
- Modify: `src/app/services/api-client.ts`
- Modify: `tests/app/api-client.test.ts`

- [ ] **Step 1: Add failing API client error test**

Add `ApiClientError` to the import and this test:

```ts
import { ApiClientError, createApiClient } from "../../src/app/services/api-client";

test("throws typed errors with API error payloads", async () => {
  const client = createApiClient({
    baseUrl: "http://example.com",
    fetcher: async () => Response.json(
      { error: { code: "EMAIL_ALREADY_EXISTS", message: "Email already exists" } },
      { status: 409 },
    ),
  });

  await expect(client.post("/users", {})).rejects.toMatchObject({
    status: 409,
    code: "EMAIL_ALREADY_EXISTS",
    message: "Email already exists",
  });
});
```

- [ ] **Step 2: Run focused test and verify failure**

Run:

```bash
bun test tests/app/api-client.test.ts
```

Expected before implementation: FAIL because `ApiClientError` is not exported or request failures do not expose parsed API error details.

- [ ] **Step 3: Implement `ApiClientError`**

Update `src/app/services/api-client.ts` with:

```ts
type ApiErrorPayload = { error?: { code?: string; message?: string } };

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}
```

Update the non-OK branch in `request`:

```ts
if (!response.ok) {
  const payload = await readApiErrorPayload(response);
  const apiError = payload?.error;
  throw new ApiClientError(
    response.status,
    apiError?.code,
    apiError?.message ?? `API request failed with ${response.status}`,
  );
}
```

Add helper:

```ts
async function readApiErrorPayload(response: Response): Promise<ApiErrorPayload | null> {
  if (!response.headers.get("content-type")?.includes("application/json")) return null;
  try {
    return await response.json() as ApiErrorPayload;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Re-run focused test**

Run:

```bash
bun test tests/app/api-client.test.ts
```

Expected: PASS.

## Task 3: Client-Side Create Form Validation

**Files:**
- Create: `src/app/pages/users/user-form-validation.ts`
- Create: `tests/app/user-form-validation.test.ts`

- [ ] **Step 1: Add failing validation tests**

Create `tests/app/user-form-validation.test.ts`:

```ts
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
    expect(normalizeCreateUserInput(input)).toEqual(input);
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
```

- [ ] **Step 2: Run focused test and verify failure**

Run:

```bash
bun test tests/app/user-form-validation.test.ts
```

Expected before implementation: FAIL because the module does not exist.

- [ ] **Step 3: Implement validation helper**

Create `src/app/pages/users/user-form-validation.ts`:

```ts
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
```

- [ ] **Step 4: Re-run focused test**

Run:

```bash
bun test tests/app/user-form-validation.test.ts
```

Expected: PASS.

## Task 4: Users Page Modal and Action Column

**Files:**
- Modify: `src/app/components/Field.tsx`
- Create: `src/app/components/ui/dialog.tsx`
- Modify: `src/app/pages/users/index.tsx`

- [ ] **Step 1: Update `Field` for errors and native input props**

Replace `FieldProps` and render logic with:

```tsx
import type React from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type FieldProps = Omit<React.ComponentProps<"input">, "onChange"> & {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

/** Controlled input with consistent label, spacing, and validation feedback. */
export function Field({ label, name, type = "text", value, onChange, error, id, ...props }: FieldProps) {
  const inputId = id ?? name;
  const errorId = `${inputId}-error`;

  return (
    <div className="field">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        name={name}
        type={type}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.currentTarget.value)}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add Radix dialog primitive**

Create `src/app/components/ui/dialog.tsx`:

```tsx
import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn("fixed inset-0 z-50 bg-black/50", className)}
      {...props}
    />
  );
}

function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg border bg-background p-6 shadow-lg",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2 text-left", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-lg font-semibold", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
};
```

- [ ] **Step 3: Replace `UsersPage` implementation**

Update `src/app/pages/users/index.tsx` to:

```tsx
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Field } from "../../components/Field";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { ApiClientError, createApiClient } from "../../services/api-client";
import {
  type CreateUserFormErrors,
  type CreateUserFormState,
  hasCreateUserFormErrors,
  normalizeCreateUserInput,
  validateCreateUserForm,
} from "./user-form-validation";

type User = { id: string; name: string; email: string; role: "admin" | "user" };

const api = createApiClient({ getToken: () => localStorage.getItem("accessToken") });
const emptyCreateForm: CreateUserFormState = { name: "", email: "", password: "", role: "user" };

/** User list page with create, search, edit, and delete workflows. */
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchName, setSearchName] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserFormState>(emptyCreateForm);
  const [createErrors, setCreateErrors] = useState<CreateUserFormErrors>({});
  const [createApiError, setCreateApiError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [listError, setListError] = useState("");

  async function load(path = "/users") {
    setListError("");
    try {
      setUsers(await api.get<User[]>(path));
    } catch {
      setListError("Could not load users.");
    }
  }

  function updateCreateField(field: keyof CreateUserFormState, value: string) {
    setCreateForm((current) => ({ ...current, [field]: value }));
    setCreateErrors((current) => ({ ...current, [field]: undefined }));
    setCreateApiError("");
  }

  function handleCreateOpenChange(open: boolean) {
    if (isCreating) return;
    setIsCreateOpen(open);
    if (open) {
      setCreateForm(emptyCreateForm);
      setCreateErrors({});
      setCreateApiError("");
    }
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    const errors = validateCreateUserForm(createForm);
    setCreateErrors(errors);
    setCreateApiError("");
    if (hasCreateUserFormErrors(errors)) return;

    setIsCreating(true);
    try {
      await api.post<User>("/users", normalizeCreateUserInput(createForm));
      setIsCreateOpen(false);
      setCreateForm(emptyCreateForm);
      await load();
    } catch (error) {
      setCreateApiError(toCreateUserErrorMessage(error));
    } finally {
      setIsCreating(false);
    }
  }

  async function searchUsers() {
    const query = searchName.trim();
    await load(query ? `/users/search?name=${encodeURIComponent(query)}` : "/users");
  }

  async function deleteUser(user: User) {
    if (!confirm(`Delete ${user.email}?`)) return;
    setDeletingId(user.id);
    try {
      await api.delete(`/users/${user.id}`);
      await load();
    } catch {
      setListError("Could not delete user.");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <Field label="Search by name" name="searchName" value={searchName} onChange={setSearchName} />
            <Button type="button" variant="secondary" onClick={() => void searchUsers()}>
              <Search />
              Search
            </Button>
          </div>
          <Button type="button" onClick={() => handleCreateOpenChange(true)}>
            <Plus />
            Criar usuario
          </Button>
        </div>

        {listError && <p className="text-sm text-destructive" role="alert">{listError}</p>}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/users/${user.id}`}>
                        <Edit />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === user.id}
                      onClick={() => void deleteUser(user)}
                    >
                      <Trash2 />
                      {deletingId === user.id ? "Deletando..." : "Deletar"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={4}>
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isCreateOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar usuario</DialogTitle>
            <DialogDescription>Dados obrigatorios para acesso e perfil.</DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={create} noValidate>
            <Field label="Name" name="createName" value={createForm.name} onChange={(value) => updateCreateField("name", value)} error={createErrors.name} required autoComplete="name" disabled={isCreating} />
            <Field label="Email" name="createEmail" type="email" value={createForm.email} onChange={(value) => updateCreateField("email", value)} error={createErrors.email} required autoComplete="email" disabled={isCreating} />
            <Field label="Password" name="createPassword" type="password" value={createForm.password} onChange={(value) => updateCreateField("password", value)} error={createErrors.password} required autoComplete="new-password" disabled={isCreating} />
            <div className="field">
              <Label htmlFor="createRole">Role</Label>
              <select
                id="createRole"
                name="createRole"
                value={createForm.role}
                aria-invalid={createErrors.role ? true : undefined}
                aria-describedby={createErrors.role ? "createRole-error" : undefined}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isCreating}
                onChange={(event) => updateCreateField("role", event.currentTarget.value)}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              {createErrors.role && <p id="createRole-error" className="text-sm text-destructive" role="alert">{createErrors.role}</p>}
            </div>
            {createApiError && <p className="text-sm text-destructive" role="alert">{createApiError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={isCreating} onClick={() => handleCreateOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Criando..." : "Criar usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function toCreateUserErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.code === "EMAIL_ALREADY_EXISTS") return "Email ja cadastrado.";
    if (error.code === "VALIDATION_ERROR") return "Dados invalidos.";
  }
  return "Could not create user.";
}
```

- [ ] **Step 4: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: PASS. If formatting or type issues appear, fix only touched files.

## Task 5: Full Verification

**Files:**
- All modified files from Tasks 1-4.

- [ ] **Step 1: Run focused tests**

Run:

```bash
bun test tests/http/users.routes.test.ts tests/app/api-client.test.ts tests/app/user-form-validation.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run required repo verification**

Run:

```bash
bun run typecheck
bun test
```

Expected: PASS.

- [ ] **Step 3: Run build verification**

Run:

```bash
bun run build
```

Expected: PASS because frontend and server bundle still compile through `scripts/build.ts`.

- [ ] **Step 4: Inspect final diff**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; status includes only plan and implementation files.

## Self-Review

- Spec coverage: Tasks cover backend validation confirmation, client validation, modal create flow, table action column, edit route preservation, delete from list, typed API error feedback, and verification.
- Placeholder scan: no TBD/TODO/fill-in placeholders.
- Type consistency: `CreateUserFormState`, `CreateUserFormErrors`, `ApiClientError`, and `User` are consistently named across tests and implementation.
