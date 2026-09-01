"use client";

import { projectTypeLabel } from "@/lib/accuracy";
import { money } from "@/lib/format";
import type { Proposal, ProposalSectionId } from "@/lib/types";
import { commentsForSection, languageMeta, PROPOSAL_SECTIONS } from "@/lib/workflow";
import { SectionThread } from "./SectionThread";

export interface DraftEditor {
  enabled: boolean;
  locked: boolean;
  marked: ProposalSectionId[];
  author: string;
  onToggleMark: (id: ProposalSectionId) => void;
  onChange: (proposal: Proposal) => void;
  onAddComment: (sectionId: ProposalSectionId, body: string) => void;
  onToggleComment: (id: string) => void;
}

const fieldClass =
  "w-full rounded-xl border border-rule bg-white/80 px-3 py-2 text-[15px] leading-relaxed";

function LineList({
  value,
  onChange,
  rows = 5,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      value={value.join("\n")}
      onChange={(event) => onChange(event.target.value.split("\n"))}
      className={fieldClass}
    />
  );
}

function DraftSection({
  id,
  title,
  proposal,
  editor,
  children,
  editing,
  className = "",
}: {
  id: ProposalSectionId;
  title: string;
  proposal: Proposal;
  editor?: DraftEditor;
  children: React.ReactNode;
  editing?: React.ReactNode;
  className?: string;
}) {
  const meta = PROPOSAL_SECTIONS.find((item) => item.id === id);
  const comments = commentsForSection(proposal, id);
  const showThread = Boolean(editor && (meta?.commentable || comments.length > 0));
  const marked = editor?.marked.includes(id) ?? false;
  const canEdit = Boolean(editor?.enabled && !editor.locked);

  return (
    <section
      id={meta?.anchor ?? id}
      className={`scroll-mt-24 border-t border-rule py-8 ${
        marked ? "border-l-2 border-l-forest pl-4" : ""
      } ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
        {editor && !editor.locked && (
          <label className="no-print flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={marked}
              onChange={() => editor.onToggleMark(id)}
            />
            Regenerate
          </label>
        )}
      </div>
      <div className="mt-4 space-y-3 text-[15px] leading-7 text-ink">
        {canEdit && editing ? editing : children}
      </div>
      {showThread && editor && (
        <SectionThread
          sectionId={id}
          comments={comments}
          author={editor.author}
          locked={editor.locked}
          onAdd={editor.onAddComment}
          onToggle={editor.onToggleComment}
        />
      )}
    </section>
  );
}

export function ProposalDocument({
  proposal,
  currency,
  editor,
}: {
  proposal: Proposal;
  currency: string;
  editor?: DraftEditor;
}) {
  const included = proposal.scope.filter((item) => item.included);
  const excluded = proposal.scope.filter((item) => !item.included);
  const subtotal = proposal.estimates.reduce((sum, row) => sum + row.cost, 0);
  const contingency = Math.round(subtotal * (proposal.contingencyPct / 100));
  const lang = languageMeta(proposal.language);
  const htmlLang =
    proposal.language === "ur" ? "ur" : proposal.language === "ar" ? "ar" : "en";
  const fontClass =
    proposal.language === "ur"
      ? "font-urdu"
      : proposal.language === "ar"
        ? "font-arabic"
        : "";

  function patch(partial: Partial<Proposal>) {
    editor?.onChange({ ...proposal, ...partial });
  }

  return (
    <article
      dir={lang.dir}
      lang={htmlLang}
      className={`print-pack-proposal print-sheet mx-auto max-w-3xl rounded-3xl border border-rule bg-[#fcfaf6] px-8 py-10 shadow-[0_20px_50px_rgba(28,25,21,0.06)] sm:px-12 ${fontClass}`}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-moss">
        Project proposal
        {proposal.projectType ? ` · ${projectTypeLabel(proposal.projectType)}` : ""}
        {proposal.reviewStatus === "client_ready" ? " · Client-ready" : ""}
      </p>
      {editor?.enabled && !editor.locked ? (
        <div className="no-print mt-3 grid gap-2">
          <input
            value={proposal.projectTitle}
            onChange={(event) => patch({ projectTitle: event.target.value })}
            className={`${fieldClass} font-serif text-3xl`}
          />
          <input
            value={proposal.clientName}
            onChange={(event) => patch({ clientName: event.target.value })}
            className={fieldClass}
          />
        </div>
      ) : (
        <>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight">
            {proposal.projectTitle}
          </h1>
          <p className="mt-3 text-ink-soft">Prepared for {proposal.clientName}</p>
        </>
      )}

      <DraftSection
        id="summary"
        title="Executive summary"
        proposal={proposal}
        editor={editor}
        editing={
          <textarea
            rows={8}
            value={proposal.executiveSummary}
            onChange={(event) => patch({ executiveSummary: event.target.value })}
            className={fieldClass}
          />
        }
      >
        {proposal.executiveSummary.split("\n\n").map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
      </DraftSection>

      <DraftSection
        id="understanding"
        title="Understanding of the problem"
        proposal={proposal}
        editor={editor}
        editing={
          <textarea
            rows={6}
            value={proposal.understanding}
            onChange={(event) => patch({ understanding: event.target.value })}
            className={fieldClass}
          />
        }
      >
        {proposal.understanding.split("\n\n").map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
      </DraftSection>

      <DraftSection
        id="approach"
        title="Proposed approach"
        proposal={proposal}
        editor={editor}
        editing={
          <textarea
            rows={6}
            value={proposal.approach}
            onChange={(event) => patch({ approach: event.target.value })}
            className={fieldClass}
          />
        }
      >
        {proposal.approach.split("\n\n").map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
      </DraftSection>

      <DraftSection
        id="scope"
        title="Scope of work"
        proposal={proposal}
        editor={editor}
        editing={
          <div className="space-y-3">
            {proposal.scope.map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-2xl border border-rule bg-paper p-3">
                <div className="flex flex-wrap gap-2">
                  <input
                    value={item.title}
                    onChange={(event) =>
                      patch({
                        scope: proposal.scope.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, title: event.target.value } : row,
                        ),
                      })
                    }
                    className={`${fieldClass} flex-1`}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.included}
                      onChange={(event) =>
                        patch({
                          scope: proposal.scope.map((row, rowIndex) =>
                            rowIndex === index
                              ? { ...row, included: event.target.checked }
                              : row,
                          ),
                        })
                      }
                    />
                    In scope
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      patch({
                        scope: proposal.scope.filter((_, rowIndex) => rowIndex !== index),
                      })
                    }
                    className="text-sm text-ink-soft"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={item.description}
                  onChange={(event) =>
                    patch({
                      scope: proposal.scope.map((row, rowIndex) =>
                        rowIndex === index
                          ? { ...row, description: event.target.value }
                          : row,
                      ),
                    })
                  }
                  className={`${fieldClass} mt-2`}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                patch({
                  scope: [
                    ...proposal.scope,
                    { title: "New item", description: "", included: true },
                  ],
                })
              }
              className="text-sm text-forest"
            >
              Add scope item
            </button>
          </div>
        }
      >
        <h3 className="font-medium">Included</h3>
        <ul className="list-disc space-y-2 pl-5">
          {included.map((item) => (
            <li key={item.title}>
              <span className="font-medium">{item.title}.</span> {item.description}
            </li>
          ))}
        </ul>
        <h3 className="pt-2 font-medium">Out of scope</h3>
        <ul className="list-disc space-y-2 pl-5">
          {excluded.map((item) => (
            <li key={item.title}>
              <span className="font-medium">{item.title}.</span> {item.description}
            </li>
          ))}
        </ul>
      </DraftSection>

      <DraftSection
        id="deliverables"
        title="Deliverables"
        proposal={proposal}
        editor={editor}
        editing={
          <LineList
            value={proposal.deliverables}
            onChange={(deliverables) => patch({ deliverables })}
          />
        }
      >
        <ul className="list-disc space-y-2 pl-5">
          {proposal.deliverables.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </DraftSection>

      <DraftSection
        id="timeline"
        title="Timeline"
        proposal={proposal}
        editor={editor}
        editing={
          <div className="space-y-3">
            <textarea
              rows={3}
              value={proposal.timelineSummary}
              onChange={(event) => patch({ timelineSummary: event.target.value })}
              className={fieldClass}
            />
            {proposal.phases.map((phase, index) => (
              <div key={`${phase.name}-${index}`} className="rounded-2xl border border-rule bg-paper p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_6rem]">
                  <input
                    value={phase.name}
                    onChange={(event) =>
                      patch({
                        phases: proposal.phases.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, name: event.target.value } : row,
                        ),
                      })
                    }
                    className={fieldClass}
                  />
                  <input
                    type="number"
                    min={1}
                    value={phase.durationWeeks}
                    onChange={(event) =>
                      patch({
                        phases: proposal.phases.map((row, rowIndex) =>
                          rowIndex === index
                            ? { ...row, durationWeeks: Number(event.target.value) }
                            : row,
                        ),
                      })
                    }
                    className={fieldClass}
                  />
                </div>
                <p className="mt-2 text-xs text-ink-soft">Objectives (one per line)</p>
                <LineList
                  rows={3}
                  value={phase.objectives}
                  onChange={(objectives) =>
                    patch({
                      phases: proposal.phases.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, objectives } : row,
                      ),
                    })
                  }
                />
                <p className="mt-2 text-xs text-ink-soft">Deliverables (one per line)</p>
                <LineList
                  rows={2}
                  value={phase.deliverables}
                  onChange={(deliverables) =>
                    patch({
                      phases: proposal.phases.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, deliverables } : row,
                      ),
                    })
                  }
                />
              </div>
            ))}
          </div>
        }
      >
        <p>{proposal.timelineSummary}</p>
        <ol className="mt-4 space-y-4">
          {proposal.phases.map((phase) => (
            <li key={phase.name} className="rounded-2xl border border-rule bg-paper px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-medium">{phase.name}</h3>
                <span className="text-sm text-ink-soft">{phase.durationWeeks} weeks</span>
              </div>
              <ul className="mt-2 list-disc pl-5 text-sm text-ink-soft">
                {phase.objectives.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-2 text-sm">
                <span className="text-ink-soft">Deliverables: </span>
                {phase.deliverables.join("; ")}
              </p>
            </li>
          ))}
        </ol>
      </DraftSection>

      <DraftSection
        id="investment"
        title="Investment"
        proposal={proposal}
        editor={editor}
        className="print-inline-commercial"
        editing={
          <div className="space-y-3">
            {proposal.estimates.map((row, index) => (
              <div key={`${row.role}-${index}`} className="grid grid-cols-[1fr_5rem_6rem_auto] gap-2">
                <input
                  value={row.role}
                  onChange={(event) =>
                    patch({
                      estimates: proposal.estimates.map((item, rowIndex) =>
                        rowIndex === index ? { ...item, role: event.target.value } : item,
                      ),
                    })
                  }
                  className={fieldClass}
                />
                <input
                  type="number"
                  min={0}
                  value={row.hours}
                  onChange={(event) =>
                    patch({
                      estimates: proposal.estimates.map((item, rowIndex) =>
                        rowIndex === index
                          ? { ...item, hours: Number(event.target.value) }
                          : item,
                      ),
                    })
                  }
                  className={fieldClass}
                />
                <input
                  type="number"
                  min={0}
                  value={row.rate}
                  onChange={(event) =>
                    patch({
                      estimates: proposal.estimates.map((item, rowIndex) =>
                        rowIndex === index
                          ? { ...item, rate: Number(event.target.value) }
                          : item,
                      ),
                    })
                  }
                  className={fieldClass}
                />
                <button
                  type="button"
                  onClick={() =>
                    patch({
                      estimates: proposal.estimates.filter((_, rowIndex) => rowIndex !== index),
                    })
                  }
                  className="text-sm text-ink-soft"
                >
                  Remove
                </button>
              </div>
            ))}
            <label className="block text-sm">
              Contingency %
              <input
                type="number"
                min={0}
                value={proposal.contingencyPct}
                onChange={(event) => patch({ contingencyPct: Number(event.target.value) })}
                className={`${fieldClass} mt-1 max-w-[8rem]`}
              />
            </label>
            <p className="text-xs text-ink-soft">Lean cuts (one per line)</p>
            <LineList
              rows={3}
              value={proposal.leanCuts ?? []}
              onChange={(leanCuts) => patch({ leanCuts })}
            />
            <p className="text-xs text-ink-soft">What padded covers (one per line)</p>
            <LineList
              rows={3}
              value={proposal.paddedAdds ?? []}
              onChange={(paddedAdds) => patch({ paddedAdds })}
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-rule text-ink-soft">
                <th className="py-2 font-medium">Role</th>
                <th className="py-2 text-right font-medium">Hours</th>
                <th className="py-2 text-right font-medium">Rate</th>
                <th className="py-2 text-right font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {proposal.estimates.map((row) => (
                <tr key={row.role} className="border-b border-rule/70">
                  <td className="py-2">{row.role}</td>
                  <td className="py-2 text-right">{row.hours}</td>
                  <td className="py-2 text-right">{money(row.rate, currency)}</td>
                  <td className="py-2 text-right">{money(row.cost, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd>{money(subtotal, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Contingency ({proposal.contingencyPct}%)</dt>
            <dd>{money(contingency, currency)}</dd>
          </div>
        </dl>
        {proposal.estimateBands ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(
              [
                {
                  id: "lean",
                  label: "Lean",
                  hours: proposal.estimateBands.leanHours,
                  cost: proposal.estimateBands.leanCost,
                  note: "Must-haves only, after the cuts below",
                },
                {
                  id: "likely",
                  label: "Likely",
                  hours: proposal.estimateBands.likelyHours,
                  cost: proposal.estimateBands.likelyCost,
                  note: "Recommended send number",
                },
                {
                  id: "padded",
                  label: "Padded",
                  hours: proposal.estimateBands.paddedHours,
                  cost: proposal.estimateBands.paddedCost,
                  note: "If the unknowns below stay open",
                },
              ] as const
            ).map((band) => (
              <div
                key={band.id}
                className={`rounded-2xl border px-3 py-3 ${
                  band.id === "likely" ? "border-forest bg-paper" : "border-rule bg-white/50"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-moss">{band.label}</p>
                <p className="mt-1 font-medium">{money(band.cost, currency)}</p>
                <p className="text-sm text-ink-soft">{band.hours} hours</p>
                <p className="mt-1 text-xs leading-5 text-ink-soft">{band.note}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 font-medium">
            Total {money(proposal.totalCost, currency)} · {proposal.totalHours} hours
          </p>
        )}
        {proposal.leanCuts && proposal.leanCuts.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium">To hit lean</h3>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {proposal.leanCuts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {proposal.paddedAdds && proposal.paddedAdds.length > 0 && (
          <div className="mt-3">
            <h3 className="text-sm font-medium">What padded covers</h3>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {proposal.paddedAdds.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </DraftSection>

      <DraftSection
        id="assumptions"
        title="Assumptions"
        proposal={proposal}
        editor={editor}
        editing={
          <LineList
            value={proposal.assumptions}
            onChange={(assumptions) => patch({ assumptions })}
          />
        }
      >
        <ul className="list-disc space-y-2 pl-5">
          {proposal.assumptions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </DraftSection>

      <DraftSection
        id="risks"
        title="Risks"
        proposal={proposal}
        editor={editor}
        editing={
          <div className="space-y-3">
            {proposal.risks.map((item, index) => (
              <div key={`${item.risk}-${index}`} className="rounded-2xl border border-rule bg-paper p-3">
                <textarea
                  rows={2}
                  value={item.risk}
                  onChange={(event) =>
                    patch({
                      risks: proposal.risks.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, risk: event.target.value } : row,
                      ),
                    })
                  }
                  className={fieldClass}
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <select
                    value={item.impact}
                    onChange={(event) =>
                      patch({
                        risks: proposal.risks.map((row, rowIndex) =>
                          rowIndex === index
                            ? { ...row, impact: event.target.value as typeof item.impact }
                            : row,
                        ),
                      })
                    }
                    className={fieldClass}
                  >
                    <option value="low">Impact low</option>
                    <option value="medium">Impact medium</option>
                    <option value="high">Impact high</option>
                  </select>
                  <select
                    value={item.likelihood}
                    onChange={(event) =>
                      patch({
                        risks: proposal.risks.map((row, rowIndex) =>
                          rowIndex === index
                            ? {
                                ...row,
                                likelihood: event.target.value as typeof item.likelihood,
                              }
                            : row,
                        ),
                      })
                    }
                    className={fieldClass}
                  >
                    <option value="low">Likelihood low</option>
                    <option value="medium">Likelihood medium</option>
                    <option value="high">Likelihood high</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  value={item.mitigation}
                  onChange={(event) =>
                    patch({
                      risks: proposal.risks.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, mitigation: event.target.value } : row,
                      ),
                    })
                  }
                  className={`${fieldClass} mt-2`}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                patch({
                  risks: [
                    ...proposal.risks,
                    {
                      risk: "New risk",
                      impact: "medium",
                      likelihood: "medium",
                      mitigation: "",
                    },
                  ],
                })
              }
              className="text-sm text-forest"
            >
              Add risk
            </button>
          </div>
        }
      >
        <ul className="space-y-3">
          {proposal.risks.map((item) => (
            <li key={item.risk} className="rounded-2xl border border-rule bg-paper px-4 py-3">
              <p className="font-medium">{item.risk}</p>
              <p className="mt-1 text-sm text-ink-soft">
                Impact {item.impact} · Likelihood {item.likelihood}
              </p>
              <p className="mt-2 text-sm">{item.mitigation}</p>
            </li>
          ))}
        </ul>
      </DraftSection>

      <DraftSection
        id="questions"
        title="Open questions"
        proposal={proposal}
        editor={editor}
        editing={
          <LineList
            value={proposal.openQuestions}
            onChange={(openQuestions) => patch({ openQuestions })}
          />
        }
      >
        <ul className="list-disc space-y-2 pl-5">
          {proposal.openQuestions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </DraftSection>

      <DraftSection
        id="weekOne"
        title="Week-1 client checklist"
        proposal={proposal}
        editor={editor}
        editing={
          <LineList
            value={proposal.weekOneNeeds ?? []}
            onChange={(weekOneNeeds) => patch({ weekOneNeeds })}
          />
        }
      >
        <p className="text-sm text-ink-soft">
          Send this list with the proposal. Unanswered items are why the padded band exists.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          {(proposal.weekOneNeeds ?? []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </DraftSection>

      <DraftSection
        id="next"
        title="Next steps"
        proposal={proposal}
        editor={editor}
        editing={
          <LineList
            value={proposal.nextSteps}
            onChange={(nextSteps) => patch({ nextSteps })}
          />
        }
      >
        <ol className="list-decimal space-y-2 pl-5">
          {proposal.nextSteps.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </DraftSection>
    </article>
  );
}
