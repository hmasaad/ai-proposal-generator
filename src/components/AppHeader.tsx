"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { canViewOps, roleLabel } from "@/lib/permissions";
import { fetchMe } from "@/lib/storage";
import type { SessionUser } from "@/lib/types";

const links = [
  { href: "/", label: "New proposal" },
  { href: "/proposal", label: "Latest draft" },
  { href: "/delivery", label: "Delivery" },
  { href: "/lessons", label: "Studio memory" },
  { href: "/settings", label: "Studio profile" },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setReady(true);
    void fetchMe().then(setUser);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nav = [
    ...links,
    ...(user && canViewOps(user.role) ? [{ href: "/ops", label: "Ops" }] : []),
  ];

  return (
    <header className="no-print border-b border-rule">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-xl tracking-tight">Proposal Agent</span>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-ink-soft sm:inline">
            Software house
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1 text-sm">
            {nav.map((link) => {
              const active = ready && pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 transition ${
                    active
                      ? "bg-forest text-paper"
                      : "text-ink-soft hover:bg-paper-2 hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          {user && (
            <div className="hidden items-center gap-2 text-xs sm:flex">
              <span className="text-ink-soft">
                {user.name} · {roleLabel(user.role)}
              </span>
              <button type="button" onClick={() => void logout()} className="text-ink-soft hover:text-ink">
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
