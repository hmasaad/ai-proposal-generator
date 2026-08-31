# Proposal Agent

An AI agent for software houses that turns messy client intake into a proposal you can actually send.

Sales, BAs, and PMs usually assemble a bid from emails, RFPs, meeting notes, requirements docs, and old proposals. This agent reads those sources, extracts a structured brief, retrieves similar past work with RAG, then drafts scope, timeline, estimates, assumptions, and risks against your studio rate card.

## What it produces

- Executive summary and problem understanding
- Approach tailored to the client, not a generic agile pitch
- In-scope / out-of-scope
- Phased timeline and deliverables
- Effort and cost from your rate card, plus contingency
- Assumptions, risks, open questions, and next steps
- Retrieved studio memory (past proposals and logged mistakes)

## RAG loop

1. Finished proposals and logged mistakes are **chunked**.
2. Each chunk is **embedded** with Gemini `text-embedding-004`.
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

1. Edit **Studio profile** with your company name, stack, and rates.
2. On **New proposal**, upload files or paste text.
3. Or load the sample Meridian Health brief, or open **View sample proposal**.
4. Generate. Pipeline: ingest → extract → RAG retrieve → draft → review.
5. On the draft, log what went wrong so the vector store learns.
6. Export Markdown or Print / PDF.
