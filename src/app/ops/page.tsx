"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { formatDateTime, formatUsd } from "@/lib/format";
import { canManageUsers, roleLabel } from "@/lib/permissions";
import { fetchMe } from "@/lib/storage";
import type { AuditEvent, SessionUser, StudioRole, UsageEvent } from "@/lib/types";

export default function OpsPage() {
  const [me, setMe] = useState<SessionUser | null>(null);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [usage, setUsage] = useState<UsageEvent[]>([]);
  const [month, setMonth] = useState({ costUsd: 0, totalTokens: 0, runs: 0, key: "" });
  const [users, setUsers] = useState<SessionUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<StudioRole>("sales");
  const [password, setPassword] = useState("");
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  async function load() {
    const user = await fetchMe();
    setMe(user);
    const response = await fetch("/api/ops");
    const payload = (await response.json()) as {
      error?: string;
      audit?: AuditEvent[];
      usage?: { events?: UsageEvent[]; month?: typeof month };
      users?: SessionUser[];
    };
    if (!response.ok) {
      setError(payload.error || "Could not load ops.");
      return;
    }
    setAudit(payload.audit ?? []);
    setUsage(payload.usage?.events ?? []);
    if (payload.usage?.month) setMonth(payload.usage.month);
    setUsers(payload.users ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setInviteMsg(null);
    const response = await fetch("/api/ops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, role, password }),
    });
    const payload = (await response.json()) as { error?: string; user?: SessionUser };
    if (!response.ok) {
      setInviteMsg(payload.error || "Could not invite.");
      return;
    }
    setEmail("");
    setName("");
    setPassword("");
    setInviteMsg(`Invited ${payload.user?.email}`);
    void load();
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-moss">Product / ops</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight">Studio ops</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-soft">
          Who generated or sent a bid, and what that generation cost in tokens. Shared across
          signed-in users — not this browser.
        </p>
        {error && <p className="mt-4 text-sm text-copper">{error}</p>}

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="This month" value={formatUsd(month.costUsd)} hint={month.key} />
          <Stat
            label="Tokens this month"
            value={month.totalTokens.toLocaleString()}
            hint={`${month.runs} run${month.runs === 1 ? "" : "s"}`}
          />
          <Stat
            label="Gemini 3.6 Flash"
            value="$0.75 / $3.75"
            hint="Per 1M input / output through Dec 2026"
          />
        </section>

        {me && canManageUsers(me.role) && (
          <form
            onSubmit={(event) => void invite(event)}
            className="mt-10 rounded-3xl border border-rule bg-white/50 p-5"
          >
            <h2 className="font-serif text-xl">Invite someone</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Name"
                className="rounded-xl border border-rule bg-white/70 px-3 py-2 text-sm"
              />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                className="rounded-xl border border-rule bg-white/70 px-3 py-2 text-sm"
              />
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as StudioRole)}
                className="rounded-xl border border-rule bg-white/70 px-3 py-2 text-sm"
              >
                <option value="sales">Sales — can draft</option>
                <option value="finance">Finance — can lock rates</option>
                <option value="admin">Admin</option>
              </select>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Temporary password (8+)"
                className="rounded-xl border border-rule bg-white/70 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="mt-4 rounded-full bg-forest px-4 py-2 text-sm text-paper"
            >
              Invite
            </button>
            {inviteMsg && <p className="mt-2 text-sm text-ink-soft">{inviteMsg}</p>}
            {users.length > 0 && (
              <ul className="mt-4 space-y-1 text-sm">
                {users.map((item) => (
                  <li key={item.id}>
                    {item.name} · {item.email} · {roleLabel(item.role)}
                  </li>
                ))}
              </ul>
            )}
          </form>
        )}

        <section className="mt-10">
          <h2 className="font-serif text-xl">Audit log</h2>
          <ul className="mt-4 space-y-2">
            {audit.map((item) => (
              <li key={item.id} className="rounded-2xl border border-rule bg-white/50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-moss">
                  {item.action.replace(/_/g, " ")} · {roleLabel(item.role)} ·{" "}
                  {formatDateTime(item.at)}
                </p>
                <p className="mt-1 text-sm">
                  {item.userName}{" "}
                  <span className="text-ink-soft">({item.email})</span>
                </p>
                <p className="mt-1 text-sm text-ink-soft">{item.detail}</p>
              </li>
            ))}
            {audit.length === 0 && <li className="text-sm text-ink-soft">No events yet.</li>}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl">Generation cost</h2>
          <ul className="mt-4 space-y-2">
            {usage.map((item) => (
              <li key={item.id} className="rounded-2xl border border-rule bg-white/50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.14em] text-moss">
                  {item.action} · {formatDateTime(item.at)}
                </p>
                <p className="mt-1 text-sm">
                  {item.userName}
                  {item.projectTitle ? ` · ${item.projectTitle}` : ""}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {item.totalTokens.toLocaleString()} tokens ({item.inputTokens.toLocaleString()} in
                  / {item.outputTokens.toLocaleString()} out
                  {item.thoughtTokens ? ` + ${item.thoughtTokens.toLocaleString()} thought` : ""})
                  · {formatUsd(item.costUsd)} · {item.model}
                </p>
              </li>
            ))}
            {usage.length === 0 && (
              <li className="text-sm text-ink-soft">No billed generations yet.</li>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-rule bg-white/50 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-moss">{label}</p>
      <p className="mt-2 font-serif text-2xl">{value}</p>
      <p className="mt-1 text-xs text-ink-soft">{hint}</p>
    </div>
  );
}
