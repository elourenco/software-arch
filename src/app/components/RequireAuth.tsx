import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { createApiClient } from "../services/api-client";

const api = createApiClient({ getToken: () => localStorage.getItem("accessToken") });

type AuthStatus = "checking" | "authenticated" | "anonymous";

/** Validates the persisted JWT before rendering private routes. */
export function RequireAuth() {
  const location = useLocation();
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setStatus("anonymous");
      return;
    }

    let active = true;
    api.get("/auth/me")
      .then(() => {
        if (active) setStatus("authenticated");
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        if (active) setStatus("anonymous");
      });

    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") {
    return <main className="auth-loading">Loading session...</main>;
  }

  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
