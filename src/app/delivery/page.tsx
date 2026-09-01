"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { DeliveryWorkspace } from "@/components/DeliveryWorkspace";
import { loadCompany, loadProposal, saveProposal, hydrateStudio } from "@/lib/storage";
import { applyInvestment } from "@/lib/workflow";
import type { CompanyProfile, Proposal } from "@/lib/types";

export default function DeliveryPage() {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      await hydrateStudio();
      setProposal(loadProposal());
      setCompany(loadCompany());
      setReady(true);
    })();
  }, []);

  function persist(next: Proposal) {
    const rolled = applyInvestment({
      ...next,
      updatedAt: new Date().toISOString(),
    });
    setProposal(rolled);
    saveProposal(rolled, { index: false });
  }

  if (!ready) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-xl px-6 py-24 text-center text-ink-soft">
          Loading delivery workspace…
        </main>
      </div>
    );
  }

  if (!proposal || !company) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-xl px-6 py-24 text-center">
          <h1 className="font-serif text-3xl">No signed brief yet</h1>
          <p className="mt-3 text-ink-soft">
            Generate a proposal first. Kickoff, RAID, and epics are built from that same brief.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-forest px-5 py-2.5 text-sm text-paper"
          >
            Start a proposal
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <DeliveryWorkspace proposal={proposal} company={company} onChange={persist} />
    </div>
  );
}
