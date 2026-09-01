"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AgentProgress } from "@/components/AgentProgress";
import { SourceIntake } from "@/components/SourceIntake";
import { describeStep, readSse } from "@/lib/client";
import { DEFAULT_COMPANY, PROJECT_TYPES } from "@/lib/defaults";
import { loadCompany, loadHistory, loadKnowledge, loadLessons, saveProposal } from "@/lib/storage";
import { SAMPLE_PROPOSAL } from "@/lib/sample-proposal";
import { SAMPLE_SOURCES } from "@/lib/sample-rfp";
import { money } from "@/lib/format";
import type {
  AgentStepEvent,
  AgentStepId,
  CompanyProfile,
  ProjectType,
  Proposal,
  SourceDocument,
} from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [sources, setSources] = useState<SourceDocument[]>([]);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<AgentStepId | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyProfile>(DEFAULT_COMPANY);
  const [projectType, setProjectType] = useState<ProjectType>("web");

  useEffect(() => {
    setCompany(loadCompany());
  }, []);

  async function generate() {
    setError(null);
    setRunning(true);
    setCurrent("ingest");
    setMessage("Starting the proposal agent…");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sources,
          company,
          lessons: loadLessons(),
          knowledge: loadKnowledge(),
          projectType,
          pastBids: loadHistory(),
        }),
      });

      if (!response.ok && response.headers.get("content-type")?.includes("application/json")) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Generation failed.");
      }

      await readSse(response, (event, data) => {
        if (event === "step") {
          const step = data as AgentStepEvent;
          setCurrent(step.id);
          setMessage(describeStep(step));
        }
        if (event === "proposal") {
          saveProposal(data as Proposal);
          router.push("/proposal");
        }
        if (event === "error") {
          const payload = data as { message?: string };
          setError(payload.message || "Generation failed.");
          setMessage("");
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
      setMessage("");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-moss">From RFP to scoped proposal</p>
          <h1 className="mt-3 max-w-xl font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
            Stop assembling proposals by hand.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-ink-soft">
            Drop in RFPs, Gmail/Outlook threads, Zoom or Meet transcripts, and past work. The
            agent extracts requirements, scores where you are strong or weak, then uses RAG over
            previous proposals, SOWs, and logged mistakes before it writes scope and estimates.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={running}
              onClick={() => {
                setSources(SAMPLE_SOURCES);
                setProjectType("integration");
              }}
              className="rounded-full border border-rule px-4 py-2 text-sm"
            >
              Load sample Meridian Health brief
            </button>
            <button
              type="button"
              disabled={running}
              onClick={() => {
                saveProposal(SAMPLE_PROPOSAL);
                router.push("/proposal");
              }}
              className="rounded-full border border-rule px-4 py-2 text-sm"
            >
              View sample proposal
            </button>
            {sources.length > 0 && (
              <button
                type="button"
                disabled={running}
                onClick={() => setSources([])}
                className="rounded-full px-4 py-2 text-sm text-ink-soft"
              >
                Clear sources
              </button>
            )}
          </div>

          <div className="mt-8">
            <SourceIntake sources={sources} onChange={setSources} disabled={running} />
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl border border-rule bg-white/40 p-5">
            <h2 className="font-serif text-2xl">Generate</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              Uses {company.name} rates and the{" "}
              {PROJECT_TYPES.find((item) => item.id === projectType)?.label} mix.
              Edit the base card in Studio profile before you send a real bid.
            </p>
            <fieldset className="mt-4">
              <legend className="text-sm text-ink-soft">Project type</legend>
              <div className="mt-2 grid gap-2">
                {PROJECT_TYPES.map((item) => (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-2 text-sm ${
                      projectType === item.id
                        ? "border-forest bg-paper"
                        : "border-rule bg-white/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="projectType"
                      value={item.id}
                      checked={projectType === item.id}
                      onChange={() => setProjectType(item.id)}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-medium">{item.label}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-ink-soft">
                        {item.mix}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Currency</dt>
                <dd>{company.currency}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Contingency</dt>
                <dd>{company.defaultContingencyPct}%</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Senior engineer</dt>
                <dd>
                  {money(
                    company.rates.find((row) => row.role.toLowerCase().includes("senior"))
                      ?.hourlyRate ?? company.rates[0]?.hourlyRate ?? 0,
                    company.currency,
                  )}
                  /hr
                </dd>
              </div>
            </dl>

            <button
              type="button"
              disabled={running || sources.length === 0}
              onClick={() => void generate()}
              className="mt-5 w-full rounded-full bg-forest py-3 text-sm text-paper disabled:opacity-40"
            >
              {running ? "Agent working…" : "Generate proposal"}
            </button>
            <p className="mt-3 text-xs leading-5 text-ink-soft">
              Needs <code className="rounded bg-paper-2 px-1">GEMINI_API_KEY</code> in{" "}
              <code className="rounded bg-paper-2 px-1">.env.local</code>. Gemini embeds studio
              memory, retrieves the closest chunks, scores the RFP, then drafts and reviews.
            </p>
          </div>

          <div className="mt-4">
            <AgentProgress current={current} message={message} running={running} />
          </div>

          {error && (
            <p className="mt-4 rounded-2xl border border-copper/30 bg-copper/10 px-4 py-3 text-sm text-copper">
              {error}
            </p>
          )}
        </aside>
      </main>
    </div>
  );
}
