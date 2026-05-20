import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { createApiClient } from "../services/api-client";

const api = createApiClient();

/** Dashboard page with runtime health visibility. */
export default function DashboardPage() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    api.get<{ status: string }>("/health")
      .then((health) => setStatus(health.status))
      .catch(() => setStatus("offline"));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bun Fullstack MVC API</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          Runtime status
          <Badge variant={status === "ok" ? "default" : "secondary"}>{status}</Badge>
        </p>
      </CardContent>
      <CardFooter className="actions">
        <Button asChild>
          <Link to="/login">Login</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/users">Manage users</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
