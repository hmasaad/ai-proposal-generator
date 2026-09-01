"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("priya@northline.example");
  const [password, setPassword] = useState("northline");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Could not sign in.");
      }
      router.push(search.get("next") || "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">Northline studio</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">Sign in</h1>
      <p className="mt-3 text-[15px] leading-7 text-ink-soft">
        Shared studio memory, a locked rate card, and an audit of who generated or sent a bid.
        Not this browser alone.
      </p>
      <form className="mt-8 space-y-4" onSubmit={(event) => void submit(event)}>
        <label className="block text-sm">
          <span className="text-ink-soft">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-rule bg-white/70 px-3 py-2"
            autoComplete="username"
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-soft">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-rule bg-white/70 px-3 py-2"
            autoComplete="current-password"
          />
        </label>
        {error && <p className="text-sm text-copper">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-forest py-3 text-sm text-paper disabled:opacity-40"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-xs leading-5 text-ink-soft">
        Demo: Priya (sales) · James (finance) · admin — password{" "}
        <code className="rounded bg-paper-2 px-1">northline</code>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
