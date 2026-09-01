"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ValidationReportCard } from "@/components/ValidationReport";
import { attachValidation, runEvalSuite } from "@/lib/eval";
import { fetchMe, hydrateStudio, loadCompany, loadProposal } from "@/lib/storage";
import type { ValidationReport } from "@/lib/types";

type Suite = ReturnType<typeof runEvalSuite>;

export default function EvalsPage() {
  const [suite, setSuite] = useState<Suite | null>(null);
  const [live, setLive] = useState<{
    projectTitle: string;
    clientName: string;
    validation?: ValidationReport;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      await fetchMe();
      await hydrateStudio();
      setSuite(runEvalSuite());
      const proposal = loadProposal();
      const company = loadCompany();
      if (proposal && company) {
        const checked = attachValidation(proposal, company);
        setLive({
          projectTitle: checked.projectTitle,
          clientName: checked.clientName,
          validation: checked.validation,
        });
      }
      const response = await fetch("/api/evals");
      const payload = (await response.json()) as {
        error?: string;
        suite?: Suite;
        live?: typeof live;
      };
      if (!response.ok) {
        setError(payload.error || "Could not load server evals.");
        return;
      }
      if (payload.suite) setSuite(payload.suite);
      if (payload.live) setLive(payload.live);
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-moss">Validation / evals</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight">Does the draft hold up?</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-soft">
          Golden fixtures plus the latest bid, scored without another model call. Rate card, rollup,
          exclusions, must-haves, and week-1 checklist. Run{" "}
          <code className="rounded bg-paper-2 px-1">npm run eval</code> in CI.
        </p>
        {error && <p className="mt-4 text-sm text-copper">{error}</p>}

        {suite && (
          <section className="mt-8">
            <h2 className="font-serif text-xl">Fixture suite</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {suite.passed ? "All fixtures behaved as expected." : "A fixture did not match its expectation."}
            </p>
            <ul className="mt-4 space-y-3">
              {suite.results.map((item) => (
                <li key={item.id} className="rounded-3xl border border-rule bg-white/50 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-moss">
                    {item.ok ? "Pass" : "Fail"} · expect {item.expect} · score {item.report.score}
                  </p>
                  <p className="mt-1 font-medium">{item.label}</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {item.report.errorCount} errors · {item.report.warningCount} warnings
                    {item.missingFails.length
                      ? ` · should have failed ${item.missingFails.join(", ")}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {live?.validation && (
          <section className="mt-10">
            <h2 className="font-serif text-xl">Latest draft</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {live.clientName} · {live.projectTitle}.{" "}
              <Link href="/proposal" className="text-forest">
                Open draft
              </Link>
            </p>
            <ValidationReportCard report={live.validation} />
          </section>
        )}
      </main>
    </div>
  );
}
