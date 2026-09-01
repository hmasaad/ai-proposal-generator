import type { SessionUser } from "./types";
import { canDraft, canLockRates, canManageUsers, canViewOps, roleLabel } from "./permissions";

export { canDraft, canLockRates, canManageUsers, canViewOps, roleLabel };

export const SESSION_COOKIE = "studio_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 14;

function secret() {
  return process.env.AUTH_SECRET || "dev-northline-change-me";
}

function bytesToB64url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const byte of arr) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlToBytes(text: string) {
  const pad = "=".repeat((4 - (text.length % 4)) % 4);
  const raw = atob(text.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function hmacKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSession(user: SessionUser) {
  const payload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SEC,
  };
  const body = bytesToB64url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey();
  const sig = bytesToB64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  return `${body}.${sig}`;
}

export async function verifySession(token: string | null | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const key = await hmacKey();
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlToBytes(sig),
      new TextEncoder().encode(body),
    );
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(body))) as SessionUser & {
      exp?: number;
    };
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.id || !payload.email || !payload.role) return null;
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function readCookie(header: string | null | undefined, name: string) {
  if (!header) return null;
  const parts = header.split(";");
  for (const part of parts) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function sessionFromRequest(request: Request) {
  return verifySession(readCookie(request.headers.get("cookie"), SESSION_COOKIE));
}

export function sessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
