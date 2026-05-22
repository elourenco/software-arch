import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Field } from "../components/Field";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { setAccessToken } from "../services/auth-session";
import { createApiClient } from "../services/api-client";

const api = createApiClient();
type RedirectState = { from?: { pathname?: string; search?: string; hash?: string } };

/** Login page for acquiring a demo JWT. */
export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("super@admin.app");
  const [password, setPassword] = useState("123456");
  const [message, setMessage] = useState("");
  const state = location.state as RedirectState | null;
  const from = `${state?.from?.pathname ?? "/"}${state?.from?.search ?? ""}${state?.from?.hash ?? ""}`;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const session = await api.post<{ accessToken: string }>("/auth/login", { email, password });
      setAccessToken(session.accessToken);
      setMessage("Authenticated. You can manage users now.");
      navigate(from, { replace: true });
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
