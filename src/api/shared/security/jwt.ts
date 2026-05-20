import { AppError } from "../errors/app-error";

type JwtPayload = { sub: string; exp: number };

const encoder = new TextEncoder();

/** Signs a compact HS256 JWT for a user id. */
export async function signJwt(userId: string, secret: string, ttlSeconds = 3600): Promise<string> {
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({ sub: userId, exp: Math.floor(Date.now() / 1000) + ttlSeconds });
  const signature = await sign(`${header}.${payload}`, secret);
  return `${header}.${payload}.${signature}`;
}

/** Verifies a compact HS256 JWT and returns its subject. */
export async function verifyJwt(token: string, secret: string): Promise<JwtPayload> {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) throw unauthorized();
  const expected = await sign(`${header}.${payload}`, secret);
  if (!constantTimeEqual(signature, expected)) throw unauthorized();
  const parsed = JSON.parse(decode(payload)) as JwtPayload;
  if (!parsed.sub || parsed.exp < Math.floor(Date.now() / 1000)) throw unauthorized();
  return parsed;
}

async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return base64Url(new Uint8Array(bytes));
}

function encode(value: object): string {
  return base64Url(encoder.encode(JSON.stringify(value)));
}

function decode(value: string): string {
  return Buffer.from(value.replaceAll("-", "+").replaceAll("_", "/"), "base64").toString("utf8");
}

function base64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function constantTimeEqual(left: string, right: string): boolean {
  return left.length === right.length && crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

function unauthorized(): AppError {
  return new AppError("UNAUTHORIZED", "Invalid or expired token", 401);
}
