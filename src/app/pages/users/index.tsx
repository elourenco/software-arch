import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Field } from "../../components/Field";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { createApiClient } from "../../services/api-client";

type User = { id: string; name: string; email: string; role: "admin" | "user" };
const api = createApiClient({ getToken: () => localStorage.getItem("accessToken") });

/** User list page with create and search workflows. */
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  async function load(path = "/users") {
    setUsers(await api.get<User[]>(path));
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    await api.post("/users", { name, email, password: "strong-password", role: "user" });
    setName("");
    setEmail("");
    await load();
  }

  useEffect(() => { void load(); }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form className="grid" onSubmit={create}>
          <Field label="Name" name="name" value={name} onChange={setName} />
          <Field label="Email" name="email" value={email} onChange={setEmail} />
          <Button type="submit">Create</Button>
        </form>
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => load(`/users/search?name=${encodeURIComponent(name)}`)}
          >
            Search
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Button asChild variant="link" className="h-auto p-0">
                    <Link to={`/users/${user.id}`}>{user.name}</Link>
                  </Button>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={3}>
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
