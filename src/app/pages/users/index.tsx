import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Field } from "../../components/Field";
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
import { getAccessToken } from "../../services/auth-session";
import {
  type UserFormErrors,
  type UserFormMode,
  type UserFormState,
  hasUserFormErrors,
  normalizeCreateUserInput,
  normalizeUpdateUserInput,
  validateUserForm,
} from "./user-form-validation";

type User = { id: string; name: string; email: string; role: "admin" | "user" };

const api = createApiClient({ getToken: () => getAccessToken() });
const emptyUserForm: UserFormState = { name: "", email: "", password: "", role: "user" };

/** User list page with create, search, edit, and delete workflows. */
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchName, setSearchName] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<UserFormMode>("create");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);
  const [formErrors, setFormErrors] = useState<UserFormErrors>({});
  const [formApiError, setFormApiError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
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

  async function saveUser(event: React.FormEvent) {
    event.preventDefault();
    const errors = validateUserForm(userForm, formMode);
    setFormErrors(errors);
    setFormApiError("");
    if (hasUserFormErrors(errors)) return;

    setIsSaving(true);
    try {
      if (formMode === "create") {
        await api.post<User>("/users", normalizeCreateUserInput(userForm));
      } else if (editingUser) {
        await api.put<User>(`/users/${editingUser.id}`, normalizeUpdateUserInput(userForm));
      }
      closeUserForm();
      await load();
    } catch (error) {
      setFormApiError(toUserFormErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  function updateUserField(field: keyof UserFormState, value: string) {
    setUserForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
    setFormApiError("");
  }

  function handleFormOpenChange(open: boolean) {
    if (isSaving) return;
    setIsFormOpen(open);
    if (open) {
      openCreateForm();
    } else {
      resetUserForm();
    }
  }

  function openCreateForm() {
    setFormMode("create");
    setEditingUser(null);
    setUserForm(emptyUserForm);
    setFormErrors({});
    setFormApiError("");
    setIsFormOpen(true);
  }

  function openEditForm(user: User) {
    setFormMode("edit");
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setFormErrors({});
    setFormApiError("");
    setIsFormOpen(true);
  }

  function closeUserForm() {
    setIsFormOpen(false);
    resetUserForm();
  }

  function resetUserForm() {
    setFormMode("create");
    setEditingUser(null);
    setUserForm(emptyUserForm);
    setFormErrors({});
    setFormApiError("");
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

  async function resetSearch() {
    setSearchName("");
    await load();
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
            <Button type="button" variant="ghost" onClick={() => void resetSearch()}>
              Reset
            </Button>
          </div>
          <Button
            type="button"
            onClick={openCreateForm}
          >
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
                    <Button type="button" variant="outline" size="sm" onClick={() => openEditForm(user)}>
                      <Edit />
                      Editar
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

      <Dialog open={isFormOpen} onOpenChange={handleFormOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formMode === "create" ? "Criar usuario" : "Editar usuario"}</DialogTitle>
            <DialogDescription>Dados obrigatorios para acesso e perfil.</DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={saveUser} noValidate>
            <Field
              label="Name"
              name="userName"
              value={userForm.name}
              onChange={(value) => updateUserField("name", value)}
              error={formErrors.name}
              required
              autoComplete="name"
              disabled={isSaving}
            />
            <Field
              label="Email"
              name="userEmail"
              type="email"
              value={userForm.email}
              onChange={(value) => updateUserField("email", value)}
              error={formErrors.email}
              required
              autoComplete="email"
              disabled={isSaving}
            />
            <Field
              label="Password"
              name="userPassword"
              type="password"
              value={userForm.password}
              onChange={(value) => updateUserField("password", value)}
              error={formErrors.password}
              required={formMode === "create"}
              autoComplete="new-password"
              disabled={isSaving}
            />
            <div className="field">
              <Label htmlFor="userRole">Role</Label>
              <select
                id="userRole"
                name="userRole"
                value={userForm.role}
                aria-invalid={formErrors.role ? true : undefined}
                aria-describedby={formErrors.role ? "userRole-error" : undefined}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSaving}
                onChange={(event) => updateUserField("role", event.currentTarget.value)}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              {formErrors.role && (
                <p id="userRole-error" className="text-sm text-destructive" role="alert">
                  {formErrors.role}
                </p>
              )}
            </div>
            {formApiError && <p className="text-sm text-destructive" role="alert">{formApiError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={isSaving} onClick={closeUserForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Salvando..." : formMode === "create" ? "Criar usuario" : "Salvar usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function toUserFormErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.code === "EMAIL_ALREADY_EXISTS") return "Email ja cadastrado.";
    if (error.code === "VALIDATION_ERROR") return "Dados invalidos.";
  }
  return "Could not save user.";
}
