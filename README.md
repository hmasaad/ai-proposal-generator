# Proposal Agent

An AI agent for software houses that turns messy client intake into a proposal you can actually send.

Sales, BAs, and PMs usually assemble a bid from emails, RFPs, meeting notes, transcripts, requirements docs, and old proposals. This agent reads those sources, extracts a structured brief, scores where you are strong or weak, retrieves similar past work with RAG, then drafts scope, timeline, estimates, assumptions, and risks against your studio rate card.

## What it produces

- Executive summary and problem understanding
- Approach tailored to the client, not a generic agile pitch
- In-scope / out-of-scope
- Phased timeline and deliverables
- Effort and cost from your rate card, plus contingency
- Assumptions, risks, open questions, and next steps
- Internal RFP / competitor scorecard (strengths, weaknesses, win themes)
- Retrieved studio memory (past proposals, SOWs, case studies, stack standards, logged mistakes)
- **Client pack:** branded PDF with logo/cover/terms, Word/Google Docs `.docx`, separate SOW and commercial appendix, board one-pager, MSA from your template
- **Delivery workspace (after they say yes):** kickoff plan and RAID from the same brief, Jira/Linear epic breakdown from scoped phases, change-order generator when the client adds scope

## Delivery after they say yes

Tag the draft **Won**, then open **Delivery**.

- **Kickoff + RAID** — week-1 sessions, access, decisions, and a RAID log from the brief, risks, assumptions, and week-1 needs. Print or export markdown/CSV.
- **Epics** — one epic per signed phase, with stories and acceptance. Download Jira CSV, Linear CSV, or copy markdown.
- **Change orders** — paste the new ask. If it was excluded (or never in the SOW), you get a priced delta on the rate card and a letter they can sign. If it is already in baseline, the CO says so. Approved orders can fold into working scope.

## Better outputs

- **Branded PDF** — cover page, studio logo, SOW body, commercial appendix, MSA/terms. Use Print → Save as PDF.
- **Word / Google Docs** — `.docx` that opens in Word or Google Docs (File → Open).
- **SOW vs commercial** — SOW has scope, timeline, assumptions (no prices). Commercial is investment bands and payment terms.
- **Board one-pager** — landscape ask: problem, recommendation, likely $, decision needed.
- **MSA appendix** — filled from the Studio profile template (`{{clientName}}`, `{{total}}`, `{{paymentTerms}}`, …). Review with counsel.

## Better inputs

- **Gmail / Outlook threads** — paste a thread or upload `.eml`. Quoted replies are split into chronological messages. Outlook `.msg` is not supported; save as `.eml`.
- **Zoom / Meet transcripts** — paste or upload `.vtt` / `.srt`. Consecutive lines from the same speaker collapse into turns.
- **Company knowledge** — index past SOWs, case studies, and stack standards on **Studio memory**. They are retrieved on the next bid.
- **RFP scoring** — after extract, the agent scores must/should/nice criteria as strong / adequate / weak / out so the draft leans into strengths and does not overclaim.

## RAG loop

1. Finished proposals, knowledge docs, and logged mistakes are **chunked**.
2. Each chunk is **embedded** with Gemini `gemini-embedding-001`.
3. Vectors live in `data/rag/index.json`.
4. A new brief is embedded as a **query**.
5. The closest chunks are **retrieved** and passed into draft + review.

Log a mistake from a draft or on **Studio memory**. The next similar bid has to apply it.

## Setup

```bash
cp .env.example .env.local
# add GEMINI_API_KEY from https://aistudio.google.com/apikey
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Gemini 3.6 Flash via the Interactions API. Optional fallback: `OPENAI_API_KEY`.

## How to use it

1. Edit **Studio profile** with your company name, stack, and rates. Index SOWs and case studies on **Studio memory**.
2. On **New proposal**, upload files, paste a Gmail/Outlook thread, or import a Zoom/Meet transcript.
3. Or load the sample Meridian Health brief, or open **View sample proposal**.
4. Generate. Pipeline: ingest → extract → score → RAG retrieve → draft → review.
5. On the draft, review the internal scorecard, then log what went wrong so the vector store learns.
6. Export a **branded PDF** (cover, SOW, commercial appendix, MSA), a **board one-pager**, split SOW/commercial packs, or **Word / Google Docs** (`.docx`). Logo and legal template live on **Studio profile**.
7. When they say yes, tag **Won** and open **Delivery** for kickoff, RAID, Jira/Linear epics, and change orders.
