import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { friendlyModelError, isFreeTierQuota } from "./model-errors";
import { sessionFromRequest } from "./session";
import type { SessionUser, StudioRole } from "./types";

const USERS_PATH = path.join(process.cwd(), "data", "users.json");

export type UserRecord = SessionUser & {
  passwordHash: string;
  createdAt: string;
};

type UsersFile = { users: UserRecord[] };

const DEMO_PASSWORD = process.env.STUDIO_DEMO_PASSWORD || "northline";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [, salt, hash] = stored.split("$");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 32);
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), next);
  } catch {
    return false;
  }
}

async function readUsers(): Promise<UsersFile> {
  try {
    const raw = await readFile(USERS_PATH, "utf8");
    return JSON.parse(raw) as UsersFile;
  } catch {
    return { users: [] };
  }
}

async function writeUsers(file: UsersFile) {
  await mkdir(path.dirname(USERS_PATH), { recursive: true });
  await writeFile(USERS_PATH, JSON.stringify(file, null, 2), "utf8");
}

function publicUser(user: UserRecord): SessionUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function ensureUsers() {
  const file = await readUsers();
  if (file.users.length) return file.users.map(publicUser);

  const seeded: UserRecord[] = [
    {
      id: "user-priya",
      email: "priya@northline.example",
      name: "Priya Shah",
      role: "sales",
      passwordHash: hashPassword(DEMO_PASSWORD),
      createdAt: new Date().toISOString(),
    },
    {
      id: "user-james",
      email: "james@northline.example",
      name: "James Chen",
      role: "finance",
      passwordHash: hashPassword(DEMO_PASSWORD),
      createdAt: new Date().toISOString(),
    },
    {
      id: "user-admin",
      email: "admin@northline.example",
      name: "Studio admin",
      role: "admin",
      passwordHash: hashPassword(DEMO_PASSWORD),
      createdAt: new Date().toISOString(),
    },
  ];
  await writeUsers({ users: seeded });
  return seeded.map(publicUser);
}

export async function authenticate(email: string, password: string) {
  await ensureUsers();
  const file = await readUsers();
  const user = file.users.find(
    (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
  );
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  return publicUser(user);
}

export async function listUsers() {
  await ensureUsers();
  return (await readUsers()).users.map(publicUser);
}

export async function createUser(input: {
  email: string;
  name: string;
  role: StudioRole;
  password: string;
}) {
  await ensureUsers();
  const file = await readUsers();
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password || input.password.length < 8) {
    throw new Error("Email and a password of at least 8 characters are required.");
  }
  if (file.users.some((item) => item.email === email)) {
    throw new Error("That email already has an account.");
  }
  const user: UserRecord = {
    id: crypto.randomUUID(),
    email,
    name: input.name.trim() || email,
    role: input.role,
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };
  file.users.push(user);
  await writeUsers(file);
  return publicUser(user);
}

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireSession(request: Request): Promise<SessionUser> {
  await ensureUsers();
  const user = await sessionFromRequest(request);
  if (!user) throw new AuthError(401, "Sign in to continue.");
  return user;
}

export function jsonError(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  const message = friendlyModelError(error);
  return Response.json(
    { error: message },
    { status: isFreeTierQuota(error) ? 429 : 500 },
  );
}
