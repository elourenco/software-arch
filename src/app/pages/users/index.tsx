import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
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
            onClick={() => handleCreateOpenChange(true)}
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
            <Field
              label="Name"
              name="createName"
              value={createForm.name}
              onChange={(value) => updateCreateField("name", value)}
              error={createErrors.name}
              required
              autoComplete="name"
              disabled={isCreating}
            />
            <Field
              label="Email"
              name="createEmail"
              type="email"
              value={createForm.email}
              onChange={(value) => updateCreateField("email", value)}
              error={createErrors.email}
              required
              autoComplete="email"
              disabled={isCreating}
            />
            <Field
              label="Password"
              name="createPassword"
              type="password"
              value={createForm.password}
              onChange={(value) => updateCreateField("password", value)}
              error={createErrors.password}
              required
              autoComplete="new-password"
              disabled={isCreating}
            />
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
              {createErrors.role && (
                <p id="createRole-error" className="text-sm text-destructive" role="alert">
                  {createErrors.role}
                </p>
              )}
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
