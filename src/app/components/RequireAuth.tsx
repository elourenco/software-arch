import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { clearAccessToken, getAccessToken, type AuthenticatedUser } from "../services/auth-session";
import { createApiClient } from "../services/api-client";

const api = createApiClient({ getToken: () => getAccessToken() });

type AuthState =
  | { status: "checking" }
  | { status: "authenticated"; currentUser: AuthenticatedUser }
  | { status: "anonymous" };

/** Validates the persisted JWT before rendering private routes. */
export function RequireAuth() {
  const location = useLocation();
  const [auth, setAuth] = useState<AuthState>({ status: "checking" });

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setAuth({ status: "anonymous" });
      return;
    }

    let active = true;
    api.get<AuthenticatedUser>("/auth/me")
      .then((currentUser) => {
        if (active) setAuth({ status: "authenticated", currentUser });
      })
      .catch(() => {
        clearAccessToken();
        if (active) setAuth({ status: "anonymous" });
      });

    return () => {
      active = false;
    };
  }, []);

  if (auth.status === "checking") {
    return <main className="auth-loading">Loading session...</main>;
  }

  if (auth.status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet context={{ currentUser: auth.currentUser }} />;
}
