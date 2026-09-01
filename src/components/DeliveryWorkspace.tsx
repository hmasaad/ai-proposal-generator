"use client";

import { useEffect, useMemo, useState } from "react";
import {
  applyChangeOrder,
  changeOrderMarkdown,
  jiraCsv,
  kickoffMarkdown,
  linearCsv,
  linearMarkdown,
  raidCsv,
  seedDelivery,
  seedEpics,
  seedKickoff,
  seedRaid,
} from "@/lib/delivery";
import { downloadBlob, fileSlug } from "@/lib/export-pack";
import { formatDate, money } from "@/lib/format";
import type {
  ChangeOrder,
  ChangeOrderStatus,
  CompanyProfile,
  DeliveryEpic,
  KickoffPlan,
  Proposal,
  RaidItem,
  RaidKind,
  RaidStatus,
} from "@/lib/types";

const TABS = [
  { id: "kickoff", label: "Kickoff" },
  { id: "raid", label: "RAID" },
  { id: "epics", label: "Epics" },
  { id: "change", label: "Change orders" },
] as const;

type Tab = (typeof TABS)[number]["id"];

const RAID_KINDS: { id: RaidKind; label: string }[] = [
  { id: "risk", label: "Risk" },
  { id: "assumption", label: "Assumption" },
  { id: "issue", label: "Issue" },
  { id: "dependency", label: "Dependency" },
];

const CO_STATUS: { id: ChangeOrderStatus; label: string }[] = [
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

function printPack(pack: "kickoff" | "raid" | "change") {
  document.body.dataset.print = pack;
  const restore = () => {
    delete document.body.dataset.print;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.setTimeout(() => {
    if (document.body.dataset.print === pack) restore();
  }, 60_000);
  window.print();
}

export function DeliveryWorkspace({
  proposal,
  company,
  onChange,
}: {
  proposal: Proposal;
  company: CompanyProfile;
  onChange: (next: Proposal) => void;
}) {
  const [tab, setTab] = useState<Tab>("kickoff");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedCo, setSelectedCo] = useState<string | null>(null);

  const pack = proposal.delivery;
  const kickoff = pack?.kickoff;
  const raid = pack?.raid ?? [];
  const epics = pack?.epics ?? [];
  const orders = pack?.changeOrders ?? [];
  const slug = fileSlug(proposal.projectTitle);
  const activeOrder =
    orders.find((item) => item.id === selectedCo) ?? orders[0] ?? null;
  const won = proposal.outcome === "won";

  useEffect(() => {
    const empty =
      !proposal.delivery?.kickoff &&
      !(proposal.delivery?.raid && proposal.delivery.raid.length > 0) &&
      !(proposal.delivery?.epics && proposal.delivery.epics.length > 0);
    if (empty) {
      onChange({ ...proposal, delivery: seedDelivery(proposal) });
    }
    // Seed once per draft so the workspace isn't blank before a model pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposal.id]);

  function patchDelivery(partial: NonNullable<Proposal["delivery"]>) {
    onChange({
      ...proposal,
      delivery: { ...proposal.delivery, ...partial },
    });
  }

  async function run(mode: "kickoff" | "epics" | "changeOrder") {
    setBusy(mode);
    setError(null);
    try {
      const response = await fetch("/api/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          proposal,
          company,
          request,
        }),
      });
      const payload = (await response.json()) as {
        kickoff?: KickoffPlan;
        raid?: RaidItem[];
        epics?: DeliveryEpic[];
        changeOrder?: ChangeOrder;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Could not build delivery artifacts.");
      }
      if (mode === "kickoff" && payload.kickoff && payload.raid) {
        patchDelivery({
          generatedAt: new Date().toISOString(),
          kickoff: payload.kickoff,
          raid: payload.raid,
        });
        setTab("kickoff");
      }
      if (mode === "epics" && payload.epics) {
        patchDelivery({ epics: payload.epics });
        setTab("epics");
      }
      if (mode === "changeOrder" && payload.changeOrder) {
        const next = [payload.changeOrder, ...orders];
        patchDelivery({ changeOrders: next });
        setSelectedCo(payload.changeOrder.id);
        setRequest("");
        setTab("change");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build delivery artifacts.");
    } finally {
      setBusy(null);
    }
  }

  function seedAll() {
    onChange({ ...proposal, delivery: seedDelivery(proposal) });
    setError(null);
  }

  async function copy(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1600);
  }

  const storyCount = useMemo(
    () => epics.reduce((sum, epic) => sum + epic.stories.length, 0),
    [epics],
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="no-print hidden lg:block">
        <div className="sticky top-6">
          <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">
            {proposal.clientName}
          </p>
          <p className="mt-1 font-medium leading-6">{proposal.projectTitle}</p>
          <nav className="mt-6 flex flex-col gap-1 text-sm">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-full px-3 py-1.5 text-left ${
                  tab === item.id ? "bg-forest text-paper" : "text-ink-soft hover:bg-paper-2"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <p className="mt-6 text-xs leading-5 text-ink-soft">
            Built from the same brief as the signed SOW. Saved with the draft in this browser.
          </p>
        </div>
      </aside>

      <div>
        <div className="no-print mb-4 rounded-3xl border border-rule bg-white/50 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-moss">
            Delivery {won ? "· they said yes" : "· prepare before kickoff"}
          </p>
          <h1 className="mt-1 font-serif text-3xl tracking-tight">After they say yes</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
            Kickoff and RAID from the brief. Jira/Linear epics from the scoped phases. A priced
            change order when they add scope.
          </p>
          {!won && (
            <p className="mt-2 text-sm text-copper">
              Outcome is still {proposal.outcome ?? "draft"}. You can prepare delivery now; tag the
              draft Won when the SOW is signed.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 lg:hidden">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  tab === item.id ? "bg-forest text-paper" : "border border-rule"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {error && <p className="mt-3 text-sm text-copper">{error}</p>}
        </div>

        {tab === "kickoff" && (
          <KickoffPanel
            proposal={proposal}
            kickoff={kickoff}
            busy={busy}
            onGenerate={() => void run("kickoff")}
            onSeed={() =>
              patchDelivery({
                kickoff: seedKickoff(proposal),
                raid: raid.length ? raid : seedRaid(proposal),
              })
            }
            onPrint={() => printPack("kickoff")}
            onDownload={() => {
              if (!kickoff) return;
              downloadBlob(
                new Blob([kickoffMarkdown(kickoff, proposal)], { type: "text/markdown" }),
                `${slug}-kickoff.md`,
              );
            }}
          />
        )}

        {tab === "raid" && (
          <RaidPanel
            raid={raid}
            busy={busy}
            onGenerate={() => void run("kickoff")}
            onSeed={() => patchDelivery({ raid: seedRaid(proposal) })}
            onChange={(next) => patchDelivery({ raid: next })}
            onPrint={() => printPack("raid")}
            onCsv={() =>
              downloadBlob(new Blob([raidCsv(raid)], { type: "text/csv" }), `${slug}-raid.csv`)
            }
          />
        )}

        {tab === "epics" && (
          <EpicsPanel
            epics={epics}
            storyCount={storyCount}
            busy={busy}
            copied={copied}
            onGenerate={() => void run("epics")}
            onSeed={() => patchDelivery({ epics: seedEpics(proposal) })}
            onCopy={(label, text) => void copy(label, text)}
            onJira={() =>
              downloadBlob(new Blob([jiraCsv(epics)], { type: "text/csv" }), `${slug}-jira.csv`)
            }
            onLinear={() =>
              downloadBlob(
                new Blob([linearCsv(epics)], { type: "text/csv" }),
                `${slug}-linear.csv`,
              )
            }
          />
        )}

        {tab === "change" && (
          <ChangePanel
            proposal={proposal}
            company={company}
            orders={orders}
            active={activeOrder}
            request={request}
            busy={busy}
            onRequest={setRequest}
            onGenerate={() => void run("changeOrder")}
            onSelect={setSelectedCo}
            onStatus={(id, status) =>
              patchDelivery({
                changeOrders: orders.map((item) =>
                  item.id === id ? { ...item, status } : item,
                ),
              })
            }
            onApply={(order) => onChange(applyChangeOrder(proposal, order))}
            onPrint={() => printPack("change")}
            onDownload={() => {
              if (!activeOrder) return;
              downloadBlob(
                new Blob([changeOrderMarkdown(activeOrder, proposal, company.currency)], {
                  type: "text/markdown",
                }),
                `${slug}-co.md`,
              );
            }}
          />
        )}

        {!kickoff && !raid.length && !epics.length && (
          <p className="no-print mt-4 text-sm text-ink-soft">
            Nothing generated yet.{" "}
            <button type="button" className="underline" onClick={seedAll}>
              Seed from the signed fields
            </button>{" "}
            without calling the model, or generate from the brief above.
          </p>
        )}
      </div>
    </div>
  );
}

function KickoffPanel({
  proposal,
  kickoff,
  busy,
  onGenerate,
  onSeed,
  onPrint,
  onDownload,
}: {
  proposal: Proposal;
  kickoff?: KickoffPlan;
  busy: string | null;
  onGenerate: () => void;
  onSeed: () => void;
  onPrint: () => void;
  onDownload: () => void;
}) {
  return (
    <section className="print-pack-kickoff rounded-3xl border border-rule bg-white/50 p-5 print-sheet">
      <div className="no-print flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl">Kickoff plan</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Week 1 from the brief, week-1 needs, and named stakeholders — not a generic agile
            kickoff.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={onGenerate}
            className="rounded-full bg-forest px-4 py-2 text-sm text-paper disabled:opacity-40"
          >
            {busy === "kickoff" ? "Building…" : "Generate from brief"}
          </button>
          <button
            type="button"
            onClick={onSeed}
            className="rounded-full border border-rule px-3 py-2 text-sm"
          >
            Seed from fields
          </button>
          {kickoff && (
            <>
              <button
                type="button"
                onClick={onPrint}
                className="rounded-full border border-rule px-3 py-2 text-sm"
              >
                Print / PDF
              </button>
              <button
                type="button"
                onClick={onDownload}
                className="rounded-full border border-rule px-3 py-2 text-sm"
              >
                Markdown
              </button>
            </>
          )}
        </div>
      </div>

      {kickoff ? (
        <>
          <p className="mt-4 hidden text-xs uppercase tracking-[0.16em] text-moss print:block">
            Kickoff · {proposal.clientName}
          </p>
          <h3 className="mt-2 hidden font-serif text-2xl print:block">{proposal.projectTitle}</h3>
          <p className="mt-4 text-[15px] leading-7">{kickoff.goal}</p>
          <ol className="mt-6 space-y-4">
            {kickoff.sessions.map((session) => (
              <li key={`${session.day}-${session.title}`} className="rounded-2xl border border-rule bg-paper px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-moss">
                  {session.day} · {session.durationMins} min
                </p>
                <p className="mt-1 font-medium">{session.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{session.attendees.join(" · ")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
                  {session.agenda.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="mt-2 text-sm">
                  <span className="text-ink-soft">Walk out with: </span>
                  {session.outputs.join("; ")}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <ListBlock title="Access needed" items={kickoff.accessNeeded} />
            <ListBlock title="Decisions needed" items={kickoff.decisionsNeeded} />
            <ListBlock title="Communications" items={kickoff.communications} />
          </div>
        </>
      ) : (
        <Empty hint="Generate from the brief, or seed from week-1 needs and stakeholders already on the SOW." />
      )}
    </section>
  );
}

function RaidPanel({
  raid,
  busy,
  onGenerate,
  onSeed,
  onChange,
  onPrint,
  onCsv,
}: {
  raid: RaidItem[];
  busy: string | null;
  onGenerate: () => void;
  onSeed: () => void;
  onChange: (next: RaidItem[]) => void;
  onPrint: () => void;
  onCsv: () => void;
}) {
  const counts = RAID_KINDS.map((kind) => ({
    ...kind,
    n: raid.filter((row) => row.kind === kind.id).length,
  }));

  return (
    <section className="print-pack-raid rounded-3xl border border-rule bg-white/50 p-5 print-sheet">
      <div className="no-print flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl">RAID log</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Risks, assumptions, issues, and dependencies from the same brief. Edit owners and
            status as kickoff proceeds.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={onGenerate}
            className="rounded-full bg-forest px-4 py-2 text-sm text-paper disabled:opacity-40"
          >
            {busy === "kickoff" ? "Building…" : "Generate with kickoff"}
          </button>
          <button
            type="button"
            onClick={onSeed}
            className="rounded-full border border-rule px-3 py-2 text-sm"
          >
            Seed from SOW
          </button>
          {raid.length > 0 && (
            <>
              <button
                type="button"
                onClick={onPrint}
                className="rounded-full border border-rule px-3 py-2 text-sm"
              >
                Print / PDF
              </button>
              <button
                type="button"
                onClick={onCsv}
                className="rounded-full border border-rule px-3 py-2 text-sm"
              >
                CSV
              </button>
            </>
          )}
        </div>
      </div>
      {raid.length > 0 ? (
        <>
          <p className="mt-3 text-xs text-ink-soft">
            {counts.map((item) => `${item.n} ${item.label.toLowerCase()}`).join(" · ")}
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-rule text-xs uppercase tracking-[0.14em] text-moss">
                  <th className="py-2 pr-3 font-normal">Kind</th>
                  <th className="py-2 pr-3 font-normal">Item</th>
                  <th className="py-2 pr-3 font-normal">Owner</th>
                  <th className="py-2 pr-3 font-normal">Due</th>
                  <th className="py-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {raid.map((row) => (
                  <tr key={row.id} className="border-b border-rule/70 align-top">
                    <td className="py-3 pr-3 capitalize text-ink-soft">{row.kind}</td>
                    <td className="py-3 pr-3">
                      <p>{row.title}</p>
                      {row.notes && (
                        <p className="mt-1 text-xs leading-5 text-ink-soft">{row.notes}</p>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <input
                        value={row.owner}
                        onChange={(event) =>
                          onChange(
                            raid.map((item) =>
                              item.id === row.id ? { ...item, owner: event.target.value } : item,
                            ),
                          )
                        }
                        className="no-print w-36 rounded-lg border border-rule bg-white/70 px-2 py-1 text-sm"
                      />
                      <span className="hidden print:inline">{row.owner}</span>
                    </td>
                    <td className="py-3 pr-3">
                      <input
                        value={row.due}
                        onChange={(event) =>
                          onChange(
                            raid.map((item) =>
                              item.id === row.id ? { ...item, due: event.target.value } : item,
                            ),
                          )
                        }
                        className="no-print w-24 rounded-lg border border-rule bg-white/70 px-2 py-1 text-sm"
                      />
                      <span className="hidden print:inline">{row.due}</span>
                    </td>
                    <td className="py-3">
                      <select
                        value={row.status}
                        onChange={(event) =>
                          onChange(
                            raid.map((item) =>
                              item.id === row.id
                                ? { ...item, status: event.target.value as RaidStatus }
                                : item,
                            ),
                          )
                        }
                        className="no-print rounded-lg border border-rule bg-white/70 px-2 py-1 text-sm"
                      >
                        <option value="open">Open</option>
                        <option value="watch">Watch</option>
                        <option value="closed">Closed</option>
                      </select>
                      <span className="hidden print:inline capitalize">{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <Empty hint="Generate with kickoff, or seed from risks, assumptions, questions, and week-1 needs." />
      )}
    </section>
  );
}

function EpicsPanel({
  epics,
  storyCount,
  busy,
  copied,
  onGenerate,
  onSeed,
  onCopy,
  onJira,
  onLinear,
}: {
  epics: DeliveryEpic[];
  storyCount: number;
  busy: string | null;
  copied: string | null;
  onGenerate: () => void;
  onSeed: () => void;
  onCopy: (label: string, text: string) => void;
  onJira: () => void;
  onLinear: () => void;
}) {
  return (
    <section className="print-pack-epics rounded-3xl border border-rule bg-white/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl">Jira / Linear epics</h2>
          <p className="mt-1 text-sm text-ink-soft">
            One epic per signed phase. Stories are slices a developer can pick up — not the SOW
            pasted into tickets.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={onGenerate}
            className="rounded-full bg-forest px-4 py-2 text-sm text-paper disabled:opacity-40"
          >
            {busy === "epics" ? "Building…" : "Break down phases"}
          </button>
          <button
            type="button"
            onClick={onSeed}
            className="rounded-full border border-rule px-3 py-2 text-sm"
          >
            Seed from phases
          </button>
        </div>
      </div>
      {epics.length > 0 ? (
        <>
          <p className="mt-3 text-xs text-ink-soft">
            {epics.length} epic{epics.length === 1 ? "" : "s"} · {storyCount}{" "}
            {storyCount === 1 ? "story" : "stories"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onJira}
              className="rounded-full border border-rule px-3 py-1.5 text-sm"
            >
              Jira CSV
            </button>
            <button
              type="button"
              onClick={onLinear}
              className="rounded-full border border-rule px-3 py-1.5 text-sm"
            >
              Linear CSV
            </button>
            <button
              type="button"
              onClick={() => onCopy("linear", linearMarkdown(epics))}
              className="rounded-full border border-rule px-3 py-1.5 text-sm"
            >
              {copied === "linear" ? "Copied" : "Copy Linear markdown"}
            </button>
          </div>
          <ol className="mt-6 space-y-4">
            {epics.map((epic) => (
              <li key={epic.key} className="rounded-2xl border border-rule bg-paper px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-moss">
                  {epic.key} · {epic.phase}
                </p>
                <p className="mt-1 font-medium">{epic.title}</p>
                <p className="mt-1 text-sm leading-6 text-ink-soft">{epic.summary}</p>
                <ul className="mt-3 space-y-3">
                  {epic.stories.map((story) => (
                    <li key={story.key} className="border-t border-rule/80 pt-3">
                      <p className="text-sm">
                        <span className="text-ink-soft">{story.key}</span> {story.title}{" "}
                        <span className="text-ink-soft">· {story.estimatePoints} pt</span>
                      </p>
                      <p className="mt-1 text-sm leading-6 text-ink-soft">{story.description}</p>
                      <ul className="mt-1 list-disc pl-5 text-xs leading-5 text-ink-soft">
                        {story.acceptance.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <Empty hint="Break down the scoped phases, or seed a first cut from objectives and deliverables." />
      )}
    </section>
  );
}

function ChangePanel({
  proposal,
  company,
  orders,
  active,
  request,
  busy,
  onRequest,
  onGenerate,
  onSelect,
  onStatus,
  onApply,
  onPrint,
  onDownload,
}: {
  proposal: Proposal;
  company: CompanyProfile;
  orders: ChangeOrder[];
  active: ChangeOrder | null;
  request: string;
  busy: string | null;
  onRequest: (value: string) => void;
  onGenerate: () => void;
  onSelect: (id: string) => void;
  onStatus: (id: string, status: ChangeOrderStatus) => void;
  onApply: (order: ChangeOrder) => void;
  onPrint: () => void;
  onDownload: () => void;
}) {
  const excluded = proposal.scope.filter((item) => !item.included);

  return (
    <div className="space-y-4">
      <section className="no-print rounded-3xl border border-rule bg-white/50 p-5">
        <h2 className="font-serif text-xl">Change-order generator</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Paste what they asked for. We compare it to the signed in/out list, price the delta on
          your rate card, and write a letter they can sign.
        </p>
        {excluded.length > 0 && (
          <p className="mt-2 text-xs leading-5 text-ink-soft">
            Signed exclusions: {excluded.map((item) => item.title).join(" · ")}
          </p>
        )}
        <textarea
          rows={4}
          value={request}
          onChange={(event) => onRequest(event.target.value)}
          placeholder="e.g. Spanish UI in v1 for the two pediatric clinics, including reminder copy."
          className="mt-3 w-full rounded-xl border border-rule bg-white/70 px-3 py-2 text-sm leading-relaxed"
        />
        <button
          type="button"
          disabled={Boolean(busy) || !request.trim()}
          onClick={onGenerate}
          className="mt-3 rounded-full bg-forest px-4 py-2 text-sm text-paper disabled:opacity-40"
        >
          {busy === "changeOrder" ? "Pricing…" : "Generate change order"}
        </button>
      </section>

      {orders.length > 0 && (
        <div className="no-print flex flex-wrap gap-2">
          {orders.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                active?.id === item.id ? "bg-forest text-paper" : "border border-rule"
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>
      )}

      {active ? (
        <section className="print-pack-change rounded-3xl border border-rule bg-white/50 p-5 print-sheet">
          <div className="no-print flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-moss">
                {formatDate(active.createdAt)} · {active.status}
                {active.appliedAt ? " · folded into working scope" : ""}
              </p>
              <h3 className="mt-1 font-serif text-2xl">{active.title}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onPrint}
                className="rounded-full border border-rule px-3 py-2 text-sm"
              >
                Print / PDF
              </button>
              <button
                type="button"
                onClick={onDownload}
                className="rounded-full border border-rule px-3 py-2 text-sm"
              >
                Markdown
              </button>
            </div>
          </div>
          <p className="mt-3 hidden text-xs uppercase tracking-[0.16em] text-moss print:block">
            Change order · {proposal.clientName}
          </p>
          <p className="mt-1 text-sm text-ink-soft">Client asked: {active.request}</p>
          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7">{active.clientLetter}</p>
          <p className="mt-4 text-sm leading-6">
            <span className="text-ink-soft">Why this is or isn’t extra: </span>
            {active.rationale}
          </p>
          {active.inBaseline ? (
            <p className="mt-4 rounded-2xl border border-rule bg-paper px-4 py-3 text-sm">
              Already in the signed SOW. No additional fee or date change.
            </p>
          ) : (
            <>
              {active.addedScope.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {active.addedScope.map((item) => (
                    <li key={item.title} className="rounded-2xl border border-rule bg-paper px-4 py-3">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-ink-soft">{item.description}</p>
                    </li>
                  ))}
                </ul>
              )}
              <table className="mt-4 w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-rule text-xs uppercase tracking-[0.14em] text-moss">
                    <th className="py-2 font-normal">Role</th>
                    <th className="py-2 text-right font-normal">Hours</th>
                    <th className="py-2 text-right font-normal">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {active.estimates.map((row) => (
                    <tr key={row.role} className="border-b border-rule/70">
                      <td className="py-2">{row.role}</td>
                      <td className="py-2 text-right">{row.hours}</td>
                      <td className="py-2 text-right">{money(row.cost, company.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-sm">
                <strong>
                  {money(active.totalCost, company.currency)}
                </strong>{" "}
                incl. contingency · {active.totalHours} hours ·{" "}
                {active.extraWeeks
                  ? `+${active.extraWeeks} week${active.extraWeeks === 1 ? "" : "s"}`
                  : "no date slip"}
              </p>
            </>
          )}
          {active.assumptions.length > 0 && (
            <ul className="mt-4 list-disc pl-5 text-sm leading-6">
              {active.assumptions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          <div className="no-print mt-4 flex flex-wrap items-center gap-2">
            {CO_STATUS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onStatus(active.id, item.id)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  active.status === item.id ? "bg-forest text-paper" : "border border-rule"
                }`}
              >
                {item.label}
              </button>
            ))}
            {!active.inBaseline && !active.appliedAt && (
              <button
                type="button"
                onClick={() => onApply(active)}
                className="rounded-full border border-rule px-3 py-1.5 text-sm"
              >
                Fold into working scope
              </button>
            )}
          </div>
        </section>
      ) : (
        <Empty hint="No change orders yet. Try an exclusion from the SOW — Spanish UI, Epic/FHIR, or native apps on the Meridian sample." />
      )}
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-moss">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Empty({ hint }: { hint: string }) {
  return <p className="mt-6 text-sm leading-6 text-ink-soft">{hint}</p>;
}
