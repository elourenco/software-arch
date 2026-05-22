import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Field } from "../../components/Field";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { createApiClient } from "../../services/api-client";
import { getAccessToken } from "../../services/auth-session";

type User = { id: string; name: string; email: string; role: "admin" | "user" };
const api = createApiClient({ getToken: () => getAccessToken() });

/** User detail page for edit and delete flows. */
export default function UserDetailPage({ id }: { id: string }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    api.get<User>(`/users/${id}`).then((data) => {
      setUser(data);
      setName(data.name);
    });
  }, [id]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setUser(await api.put<User>(`/users/${id}`, { name }));
  }

  async function remove() {
    await api.delete(`/users/${id}`);
    navigate("/users");
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">Loading...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.email}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={save}>
          <Field label="Name" name="name" value={name} onChange={setName} />
          <div className="actions">
            <Button type="submit">Save</Button>
            <Button type="button" variant="destructive" onClick={remove}>Delete</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
