"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "New proposal" },
  { href: "/proposal", label: "Latest draft" },
  { href: "/delivery", label: "Delivery" },
  { href: "/lessons", label: "Studio memory" },
  { href: "/settings", label: "Studio profile" },
];

export function AppHeader() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <header className="no-print border-b border-rule">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-xl tracking-tight">Proposal Agent</span>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-ink-soft sm:inline">
            Software house
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((link) => {
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
      </div>
    </header>
  );
}
