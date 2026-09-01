import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { money } from "./format";
import { filledMsa, investmentRollup, legalName, paymentTerms, totalWeeks } from "./legal";
import type { ClientPackKind, CompanyProfile, Proposal } from "./types";

const FOREST = "1F4A3A";
const INK = "1C1915";
const MUTED = "5C564C";

function p(text: string, opts?: { bold?: boolean; size?: number; color?: string; after?: number }) {
  return new Paragraph({
    spacing: { after: opts?.after ?? 160 },
    children: [
      new TextRun({
        text,
        bold: opts?.bold,
        size: opts?.size ?? 22,
        color: opts?.color ?? INK,
        font: "Calibri",
      }),
    ],
  });
}

function h(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, font: "Calibri", color: FOREST, bold: true })],
  });
}

function bullets(items: string[]) {
  return items.map(
    (item) =>
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: item, font: "Calibri", size: 22, color: INK })],
      }),
  );
}

function decodeLogo(dataUrl?: string) {
  if (!dataUrl) return null;
  const match = dataUrl.match(/^data:image\/(png|jpe?g|gif);base64,(.+)$/i);
  if (!match) return null;
  const kind = match[1].toLowerCase();
  const type = kind === "png" ? "png" : kind === "gif" ? "gif" : "jpg";
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return { type: type as "png" | "jpg" | "gif", data: bytes };
}

function letterhead(company: CompanyProfile, kicker: string) {
  const logo = decodeLogo(company.logoDataUrl);
  const parts: Paragraph[] = [];
  if (logo) {
    parts.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new ImageRun({
            type: logo.type,
            data: logo.data,
            transformation: { width: 132, height: 44 },
          }),
        ],
      }),
    );
  }
  parts.push(
    p(company.name, { bold: true, size: 28, color: FOREST, after: 40 }),
    p(kicker, { size: 18, color: MUTED, after: 200 }),
  );
  return parts;
}

function cell(text: string, width: number, opts?: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] }) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: opts?.align,
        children: [
          new TextRun({
            text,
            bold: opts?.bold,
            font: "Calibri",
            size: 20,
            color: INK,
          }),
        ],
      }),
    ],
  });
}

function estimateTable(proposal: Proposal, currency: string) {
  const { subtotal, contingency } = investmentRollup(proposal);
  const rows = [
    new TableRow({
      children: [
        cell("Role", 3200, { bold: true }),
        cell("Hours", 1400, { bold: true, align: AlignmentType.RIGHT }),
        cell("Rate", 1800, { bold: true, align: AlignmentType.RIGHT }),
        cell("Cost", 1800, { bold: true, align: AlignmentType.RIGHT }),
      ],
    }),
    ...proposal.estimates.map(
      (row) =>
        new TableRow({
          children: [
            cell(row.role, 3200),
            cell(String(row.hours), 1400, { align: AlignmentType.RIGHT }),
            cell(money(row.rate, currency), 1800, { align: AlignmentType.RIGHT }),
            cell(money(row.cost, currency), 1800, { align: AlignmentType.RIGHT }),
          ],
        }),
    ),
  ];
  return [
    new Table({
      width: { size: 9020, type: WidthType.DXA },
      rows,
    }),
    p(`Subtotal ${money(subtotal, currency)}. Contingency (${proposal.contingencyPct}%) ${money(contingency, currency)}.`, {
      after: 80,
    }),
    p(`Likely (recommended): ${money(proposal.totalCost, currency)} · ${proposal.totalHours} hours`, {
      bold: true,
    }),
    ...(proposal.estimateBands
      ? [
          p(
            `Lean ${money(proposal.estimateBands.leanCost, currency)} (${proposal.estimateBands.leanHours}h) · Padded ${money(proposal.estimateBands.paddedCost, currency)} (${proposal.estimateBands.paddedHours}h)`,
            { size: 20, color: MUTED },
          ),
        ]
      : []),
  ];
}

function sowBody(proposal: Proposal) {
  const included = proposal.scope.filter((item) => item.included);
  const excluded = proposal.scope.filter((item) => !item.included);
  return [
    h("Statement of work"),
    p(proposal.executiveSummary),
    h("Understanding", HeadingLevel.HEADING_2),
    p(proposal.understanding),
    h("Approach", HeadingLevel.HEADING_2),
    p(proposal.approach),
    h("In scope", HeadingLevel.HEADING_2),
    ...included.flatMap((item) => [p(`${item.title}. ${item.description}`, { after: 80 })]),
    h("Out of scope", HeadingLevel.HEADING_2),
    ...excluded.flatMap((item) => [p(`${item.title}. ${item.description}`, { after: 80 })]),
    h("Deliverables", HeadingLevel.HEADING_2),
    ...bullets(proposal.deliverables),
    h("Timeline", HeadingLevel.HEADING_2),
    p(proposal.timelineSummary),
    ...proposal.phases.flatMap((phase) => [
      p(`${phase.name} (${phase.durationWeeks} weeks)`, { bold: true, after: 40 }),
      ...bullets(phase.objectives),
      p(`Deliverables: ${phase.deliverables.join("; ")}`, { size: 20, color: MUTED }),
    ]),
    h("Assumptions", HeadingLevel.HEADING_2),
    ...bullets(proposal.assumptions),
    h("Risks", HeadingLevel.HEADING_2),
    ...bullets(
      proposal.risks.map(
        (item) =>
          `${item.risk} (impact ${item.impact}, likelihood ${item.likelihood}). ${item.mitigation}`,
      ),
    ),
    h("Open questions", HeadingLevel.HEADING_2),
    ...bullets(proposal.openQuestions),
    ...(proposal.weekOneNeeds?.length
      ? [h("Week-1 client checklist", HeadingLevel.HEADING_2), ...bullets(proposal.weekOneNeeds)]
      : []),
    h("Next steps", HeadingLevel.HEADING_2),
    ...bullets(proposal.nextSteps),
  ];
}

function commercialBody(proposal: Proposal, company: CompanyProfile) {
  return [
    h("Commercial appendix"),
    p(
      `This appendix is the commercial offer for ${proposal.projectTitle}. It is not the statement of work. Scope, exclusions, and assumptions live in the SOW.`,
    ),
    ...estimateTable(proposal, company.currency),
    ...(proposal.leanCuts?.length
      ? [h("To hit lean", HeadingLevel.HEADING_2), ...bullets(proposal.leanCuts)]
      : []),
    ...(proposal.paddedAdds?.length
      ? [h("What padded covers", HeadingLevel.HEADING_2), ...bullets(proposal.paddedAdds)]
      : []),
    h("Payment terms", HeadingLevel.HEADING_2),
    p(paymentTerms(company)),
  ];
}

function boardBody(proposal: Proposal, company: CompanyProfile) {
  const included = proposal.scope.filter((item) => item.included).slice(0, 6);
  const weeks = totalWeeks(proposal);
  return [
    h("Board one-pager"),
    p(`${proposal.projectTitle} · ${proposal.clientName}`, { bold: true, size: 28 }),
    p(
      `Ask: ${money(proposal.totalCost, company.currency)} likely · ${weeks || "—"} weeks · ${legalName(company)}`,
      { color: FOREST, bold: true },
    ),
    h("The problem", HeadingLevel.HEADING_2),
    p(proposal.understanding.split("\n\n")[0] ?? proposal.understanding),
    h("What we recommend", HeadingLevel.HEADING_2),
    ...bullets(included.map((item) => item.title)),
    h("Investment bands", HeadingLevel.HEADING_2),
    ...(proposal.estimateBands
      ? [
          p(
            `Lean ${money(proposal.estimateBands.leanCost, company.currency)} · Likely ${money(proposal.estimateBands.likelyCost, company.currency)} · Padded ${money(proposal.estimateBands.paddedCost, company.currency)}`,
          ),
        ]
      : [p(`${money(proposal.totalCost, company.currency)} · ${proposal.totalHours} hours`)]),
    h("Decision needed", HeadingLevel.HEADING_2),
    ...bullets(proposal.nextSteps.slice(0, 4)),
  ];
}

function childrenFor(pack: ClientPackKind, proposal: Proposal, company: CompanyProfile) {
  const kicker =
    pack === "sow"
      ? "Statement of work"
      : pack === "commercial"
        ? "Commercial appendix"
        : pack === "board"
          ? "Board one-pager · confidential"
          : pack === "msa"
            ? "Legal terms appendix"
            : "Project proposal";
  const head = letterhead(company, kicker);
  if (pack === "sow") return [...head, p(`Prepared for ${proposal.clientName}`), ...sowBody(proposal)];
  if (pack === "commercial") {
    return [...head, p(`Prepared for ${proposal.clientName}`), ...commercialBody(proposal, company)];
  }
  if (pack === "board") return [...head, ...boardBody(proposal, company)];
  if (pack === "msa") {
    return [
      ...head,
      p(`Prepared for ${proposal.clientName}`),
      h("MSA / legal terms"),
      ...filledMsa(proposal, company)
        .split(/\n{2,}/)
        .map((block) => p(block.replace(/\n/g, " "))),
    ];
  }
  return [
    ...head,
    p(`Prepared for ${proposal.clientName}`),
    h(proposal.projectTitle),
    p(company.tagline, { color: MUTED }),
    ...sowBody(proposal),
    ...commercialBody(proposal, company),
    h("MSA / legal terms"),
    ...filledMsa(proposal, company)
      .split(/\n{2,}/)
      .map((block) => p(block.replace(/\n/g, " "))),
  ];
}

export async function proposalToDocx(
  pack: ClientPackKind,
  proposal: Proposal,
  company: CompanyProfile,
) {
  const doc = new Document({
    creator: company.name,
    title: `${proposal.projectTitle} — ${pack}`,
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: pack === "board" ? { orientation: PageOrientation.LANDSCAPE } : undefined,
            margin: { top: 720, bottom: 720, left: 864, right: 864 },
          },
        },
        children: childrenFor(pack, proposal, company),
      },
    ],
  });
  return Packer.toBuffer(doc);
}
