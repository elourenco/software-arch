export const ACCESS_TOKEN_STORAGE_KEY = "accessToken";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
  updatedAt: string;
};

export type AuthenticatedRouteContext = {
  currentUser: AuthenticatedUser;
};

type AuthSessionStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;
type NavigateTo = (to: string, options: { replace: true }) => void;

export function getAccessToken(storage: Pick<AuthSessionStorage, "getItem"> = localStorage) {
  return storage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string, storage: Pick<AuthSessionStorage, "setItem"> = localStorage) {
  storage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken(storage: Pick<AuthSessionStorage, "removeItem"> = localStorage) {
  storage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function endAuthenticatedSession({
  storage = localStorage,
  navigate,
}: {
  storage?: Pick<AuthSessionStorage, "getItem" | "removeItem">;
  navigate: NavigateTo;
}) {
  clearAccessToken(storage);
  navigate("/login", { replace: true });
}
