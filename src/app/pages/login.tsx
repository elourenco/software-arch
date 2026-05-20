import { useState } from "react";
import { Field } from "../components/Field";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { createApiClient } from "../services/api-client";

const api = createApiClient();

/** Login page for acquiring a demo JWT. */
export default function LoginPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("strong-password");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const session = await api.post<{ accessToken: string }>("/auth/login", { email, password });
      localStorage.setItem("accessToken", session.accessToken);
      setMessage("Authenticated. You can manage users now.");
    } catch {
      setMessage("Authentication failed.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <Field label="Email" name="email" value={email} onChange={setEmail} />
          <Field label="Password" name="password" type="password" value={password} onChange={setPassword} />
          <Button type="submit">Sign in</Button>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
