import { money } from "@/lib/format";
import { filledMsa, investmentRollup, legalName, paymentTerms, totalWeeks } from "@/lib/legal";
import type { CompanyProfile, Proposal } from "@/lib/types";

function Letterhead({
  company,
  kicker,
}: {
  company: CompanyProfile;
  kicker: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-rule pb-4">
      <div>
        {company.logoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logoDataUrl} alt={company.name} className="mb-3 h-10 max-w-[10rem] object-contain" />
        ) : (
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-forest font-serif text-lg text-paper">
            {company.name.slice(0, 1)}
          </div>
        )}
        <p className="font-medium">{company.name}</p>
        <p className="text-xs uppercase tracking-[0.16em] text-moss">{kicker}</p>
      </div>
      <p className="max-w-xs text-right text-xs leading-5 text-ink-soft">
        {legalName(company)}
        {company.address ? ` · ${company.address}` : ""}
      </p>
    </div>
  );
}

export function ProposalCover({
  proposal,
  company,
  kind = "proposal",
  className = "print-pack-cover",
}: {
  proposal: Proposal;
  company: CompanyProfile;
  kind?: "proposal" | "sow";
  className?: string;
}) {
  return (
    <section
      className={`print-only print-cover flex min-h-[90vh] flex-col justify-between rounded-none bg-forest px-10 py-12 text-paper ${className}`}
    >
      <div>
        {company.logoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logoDataUrl} alt="" className="h-12 max-w-[12rem] object-contain brightness-0 invert" />
        ) : (
          <p className="text-sm uppercase tracking-[0.22em] text-paper/80">{company.name}</p>
        )}
        <p className="mt-8 text-xs uppercase tracking-[0.22em] text-paper/70">
          {kind === "sow" ? "Statement of work" : "Project proposal"}
        </p>
        <h1 className="mt-4 max-w-2xl font-serif text-5xl leading-tight tracking-tight">
          {proposal.projectTitle}
        </h1>
        <p className="mt-6 text-lg text-paper/85">Prepared for {proposal.clientName}</p>
      </div>
      <div className="flex items-end justify-between gap-6 text-sm text-paper/75">
        <div>
          <p>{company.tagline}</p>
          <p className="mt-2">{legalName(company)}</p>
        </div>
        <p className="text-xs uppercase tracking-[0.16em]">Confidential</p>
      </div>
    </section>
  );
}

export function BoardOnePager({
  proposal,
  company,
}: {
  proposal: Proposal;
  company: CompanyProfile;
}) {
  const included = proposal.scope.filter((item) => item.included).slice(0, 6);
  const weeks = totalWeeks(proposal);
  const problem = proposal.understanding.split("\n\n")[0] ?? proposal.understanding;

  return (
    <section className="print-pack-board print-only print-board rounded-none bg-[#fcfaf6] px-8 py-8">
      <Letterhead company={company} kicker="Board one-pager · confidential" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(16rem,0.7fr)]">
        <div>
          <h1 className="font-serif text-3xl leading-tight tracking-tight">{proposal.projectTitle}</h1>
          <p className="mt-2 text-ink-soft">For {proposal.clientName}</p>
          <p className="mt-4 text-[15px] leading-7">{problem}</p>
          <h2 className="mt-6 text-xs uppercase tracking-[0.16em] text-moss">What we recommend</h2>
          <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {included.map((item) => (
              <li key={item.title} className="rounded-lg border border-rule bg-white/70 px-3 py-2">
                {item.title}
              </li>
            ))}
          </ul>
        </div>
        <aside className="rounded-2xl border border-forest bg-paper px-4 py-4">
          <p className="text-xs uppercase tracking-[0.16em] text-moss">The ask</p>
          <p className="mt-2 font-serif text-3xl">{money(proposal.totalCost, company.currency)}</p>
          <p className="text-sm text-ink-soft">Likely band · {proposal.totalHours} hours</p>
          <p className="mt-3 text-sm">{weeks ? `${weeks} weeks` : proposal.timelineSummary}</p>
          {proposal.estimateBands && (
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Lean</dt>
                <dd>{money(proposal.estimateBands.leanCost, company.currency)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">Padded</dt>
                <dd>{money(proposal.estimateBands.paddedCost, company.currency)}</dd>
              </div>
            </dl>
          )}
        </aside>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-xs uppercase tracking-[0.16em] text-moss">Decision needed</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6">
            {proposal.nextSteps.slice(0, 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-[0.16em] text-moss">Out of v1</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
            {proposal.scope
              .filter((item) => !item.included)
              .slice(0, 4)
              .map((item) => (
                <li key={item.title}>{item.title}</li>
              ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function CommercialAppendix({
  proposal,
  company,
}: {
  proposal: Proposal;
  company: CompanyProfile;
}) {
  const { subtotal, contingency } = investmentRollup(proposal);

  return (
    <section className="print-pack-commercial print-only print-break rounded-none bg-[#fcfaf6] px-8 py-10">
      <Letterhead company={company} kicker="Commercial appendix" />
      <h1 className="mt-6 font-serif text-3xl tracking-tight">Investment</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
        This appendix is the commercial offer for {proposal.projectTitle}. It is not the statement of
        work. Scope, exclusions, and assumptions live in the SOW.
      </p>
      <table className="mt-6 w-full text-left text-sm">
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
              <td className="py-2 text-right">{money(row.rate, company.currency)}</td>
              <td className="py-2 text-right">{money(row.cost, company.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-4 max-w-md space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-soft">Subtotal</dt>
          <dd>{money(subtotal, company.currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-soft">Contingency ({proposal.contingencyPct}%)</dt>
          <dd>{money(contingency, company.currency)}</dd>
        </div>
        <div className="flex justify-between font-medium">
          <dt>Likely (recommended)</dt>
          <dd>{money(proposal.totalCost, company.currency)}</dd>
        </div>
      </dl>
      {proposal.estimateBands && (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(
            [
              ["Lean", proposal.estimateBands.leanCost, proposal.estimateBands.leanHours],
              ["Likely", proposal.estimateBands.likelyCost, proposal.estimateBands.likelyHours],
              ["Padded", proposal.estimateBands.paddedCost, proposal.estimateBands.paddedHours],
            ] as const
          ).map(([label, cost, hours]) => (
            <div key={label} className="rounded-2xl border border-rule px-3 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-moss">{label}</p>
              <p className="mt-1 font-medium">{money(cost, company.currency)}</p>
              <p className="text-sm text-ink-soft">{hours} hours</p>
            </div>
          ))}
        </div>
      )}
      {proposal.leanCuts && proposal.leanCuts.length > 0 && (
        <div className="mt-5">
          <h2 className="text-sm font-medium">To hit lean</h2>
          <ul className="mt-1 list-disc pl-5 text-sm">
            {proposal.leanCuts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-6">
        <h2 className="text-sm font-medium">Payment terms</h2>
        <p className="mt-2 text-sm leading-6">{paymentTerms(company)}</p>
      </div>
    </section>
  );
}

export function MsaAppendix({
  proposal,
  company,
}: {
  proposal: Proposal;
  company: CompanyProfile;
}) {
  return (
    <section className="print-pack-msa print-only print-break rounded-none bg-[#fcfaf6] px-8 py-10">
      <Letterhead company={company} kicker="Legal terms appendix" />
      <h1 className="mt-6 font-serif text-3xl tracking-tight">MSA / legal terms</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Filled from the studio template. Review with counsel before signature.
      </p>
      <pre className="mt-6 whitespace-pre-wrap font-sans text-[13px] leading-6">{filledMsa(proposal, company)}</pre>
    </section>
  );
}

export function SowCover({
  proposal,
  company,
}: {
  proposal: Proposal;
  company: CompanyProfile;
}) {
  return <ProposalCover proposal={proposal} company={company} kind="sow" className="print-pack-sow-cover" />;
}
