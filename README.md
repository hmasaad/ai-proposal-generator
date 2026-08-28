# Proposal Agent

An AI agent for software houses that turns messy client intake into a proposal you can actually send.

Sales, BAs, and PMs usually assemble a bid from emails, RFPs, meeting notes, requirements docs, and old proposals. This agent reads those sources, extracts a structured brief, then drafts scope, timeline, estimates, assumptions, and risks against your studio rate card.

## What it produces

- Executive summary and problem understanding
- Approach tailored to the client, not a generic agile pitch
- In-scope / out-of-scope
- Phased timeline and deliverables
- Effort and cost from your rate card, plus contingency
- Assumptions, risks, open questions, and next steps

## Setup

```bash
cp .env.example .env.local
# add OPENAI_API_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional: set `OPENAI_MODEL` (default `gpt-4o`).

## How to use it

1. Edit **Studio profile** with your company name, stack, and rates.
2. On **New proposal**, upload files or paste text. Tag each source (RFP, email, notes, …).
3. Or load the sample Meridian Health brief, or open **View sample proposal** to see a finished draft without an API key.
4. Generate. The agent runs three passes: extract → draft → review.
5. Export Markdown or Print / PDF from the draft.

Sources and the latest proposal are stored in the browser. The OpenAI key stays on the server in `.env.local`.

## Agent pipeline

1. **Ingest** — PDF, Word, and text extraction
2. **Extract** — structured brief (goals, must-haves, constraints, unknowns)
3. **Draft** — proposal grounded in your profile and the brief
4. **Review** — a second pass that tightens numbers, exclusions, and risks
