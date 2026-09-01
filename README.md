# Proposal Agent

An AI agent for software houses that turns messy client intake into a proposal you can actually send.

Sales, BAs, and PMs usually assemble a bid from emails, RFPs, meeting notes, transcripts, requirements docs, and old proposals. This agent reads those sources, extracts a structured brief, scores where you are strong or weak, retrieves similar past work with RAG, then the **Proposal Writer Agent** outlines scope, prices the likely band on your rate card, and writes the client document. A reviewer checks it against logged mistakes before you send.

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

## Validation / evals

Generate finishes with a **quality gate** (no extra model call):

- Rate card, hours × rate, and contingency rollup
- Included vs excluded scope; Epic / native apps / video stay out when the brief says so
- Must-haves from the brief appear in the draft
- Scored-out work is not included
- Week-1 checklist, risks with mitigations, lean/padded notes

Errors block **Client-ready**. Open **Evals** for the golden fixture suite (Meridian should pass; a broken Epic/rate fixture should fail). CI: `npm run eval`.

## Proposal Writer Agent

After extract, score, and RAG, generate is three writer passes plus a review:

1. **Outline** — included vs excluded scope and phases (no hours yet).
2. **Price** — likely-band hours on the locked rate card, plus lean cuts and padded unknowns.
3. **Write** — client-facing prose locked to that outline and price.
4. **Review** — delivery director pass against retrieved mistakes.

Scope and price are committed before anyone writes the executive summary, so the story cannot drift from the commercial skeleton.

## Win Probability Agent

After generate, the draft includes an internal **win probability** (no extra model call). It scores the bid from the RFP scorecard, studio tech stack, similar closed bids, deadline pace, and price vs historical average. Meridian sample: **68%** — strong technical fit, similar clinic work, stack match; aggressive 16-week deadline and price above the similar-bid average.

## Proposal Quality Agent

Before you mark **Client-ready**, a quality pass (also no extra model call) reports:

- **Requirements coverage** of the brief plus delivery-complete topics
- **Missing** items a delivery director still wants (data migration, SLA, DR on the Meridian sample)
- **Unsupported claims** (scored-out or excluded work marked included)
- **Pricing validation** against the locked rate card
- **Timeline validation** (pace vs stated weeks)

Meridian sample: **94%** coverage, 3 missing, 0 unsupported claims, pricing **PASS**, timeline **WARNING**.

## Feedback loop

After every proposal:

1. **Proposal** — send the draft
2. **Won / Lost** — tag the outcome
3. **Reason** — price, timeline, compliance, incumbent, …
4. **Store outcome** — studio history, a lesson, and the RAG index
5. **Analytics** — win rate, overrun, loss reasons on **Feedback**
6. **Improve future proposals** — the next generate retrieves similar outcomes before it prices and writes

That is what makes this an AI-native bid system rather than a document generator. Sample history: 2 won / 1 lost (compliance).

## Product / ops

Sign in. Studio memory (profile, lessons, knowledge, past bids, RAG) lives on the server in `data/`, so the next person on another browser gets the same studio.

Demo accounts (password `northline`):

- `priya@northline.example` — **sales** can draft, generate, send
- `james@northline.example` — **finance** can lock the rate card
- `admin@northline.example` — both, plus invites

**Roles.** Sales cannot change rates while finance has them locked. Generate always uses the server rate card. Finance opens **Ops** for the audit log and token cost.

**Audit.** Login, generate, revise, translate, send, outcome, delivery, knowledge/lesson index, rate lock, profile save, invites.

**Cost.** Each Gemini call records input / output / thought tokens. Cost uses Gemini 3.6 Flash intro pricing ($0.75 / $3.75 per 1M through Dec 2026). Override with `GEMINI_INPUT_PER_MILLION` and `GEMINI_OUTPUT_PER_MILLION`. Set `AUTH_SECRET` in production.

## Setup

```bash
cp .env.example .env.local
# add GEMINI_API_KEY from https://aistudio.google.com/apikey
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

Gemini 3.6 Flash via the Interactions API. Optional fallback: `OPENAI_API_KEY`.

Free-tier Gemini allows **20 generate requests per day**. One proposal uses several (extract, score, outline, price, write, review), so a few runs will hit the cap. Waiting the “retry in 50s” does not reset the daily quota — wait until it refreshes, or enable billing at [Google AI Studio](https://aistudio.google.com/). `npm run eval` and **View sample proposal** do not call Gemini.

## How to use it

1. Sign in. Finance locks rates on **Studio profile**. Sales drafts.
2. Edit **Studio profile** with your company name, stack, and rates. Index SOWs and case studies on **Studio memory**.
3. On **New proposal**, upload files, paste a Gmail/Outlook thread, or import a Zoom/Meet transcript.
3. Or load the sample Meridian Health brief, or open **View sample proposal**.
4. Generate. The **Proposal Writer Agent** outlines scope, prices the likely band, writes the client document, then a reviewer checks it against studio memory. Pipeline: ingest → extract → score → RAG → outline → price → write → review.
5. On the draft, review the **Proposal Quality Agent**, win probability, **validation report**, and the internal scorecard. Errors must be fixed before **Client-ready**. After they decide, tag **Won / Lost** with a reason — that is the **feedback loop**.
6. Open **Feedback** for win rate, loss reasons, and stored outcomes. The next generate retrieves them (RAG + pricing + win probability).
7. Export a **branded PDF** (cover, SOW, commercial appendix, MSA), a **board one-pager**, split SOW/commercial packs, or **Word / Google Docs** (`.docx`). Logo and legal template live on **Studio profile**.
8. When they say yes, tag **Won** and open **Delivery** for kickoff, RAID, Jira/Linear epics, and change orders.
