import type { Proposal } from "./types";

export const SAMPLE_PROPOSAL: Proposal = {
  id: "sample-proposal",
  createdAt: "2026-08-20T15:00:00.000Z",
  clientName: "Meridian Health Network",
  projectTitle: "Patient Access Portal — v1 delivery proposal",
  executiveSummary:
    "Meridian’s clinics still schedule by phone and Google Calendar. That produces double-books, 18 hours a week of callbacks, and a no-show problem that hits Monday physicals hardest. This proposal covers a patient portal and staff console that make online booking the default path, with digital intake, reminders that stay HIPAA-safe, and optional balance pay.\n\nWe recommend building a focused v1 rather than buying a suite like Phreesia. Meridian’s calendars are not centralized, Epic is explicitly out of the first release, and proxy access for pediatrics is a hard requirement those products often bury in a larger rollout. A custom portal lets us make booking quality the product, then add payments and FHIR later without paying for a platform Meridian will only half-use.\n\nWe can deliver in 16 weeks for a likely investment of about $226k including contingency, inside the $180–260k band. Payments can slip a quarter if scope pressure appears; booking, proxy access, and a single staff calendar cannot.",
  understanding:
    "Priya and the clinic managers are not asking for a patient ‘engagement platform.’ They are asking to stop running four clinics plus a hospital on disconnected calendars. Front desk cannot see the same truth, patients cannot self-serve, and billing balances live in a weekly CSV from Candid/QuickBooks.\n\nConstraints that shape the design: US hosting, WCAG 2.2 AA, staff MFA, Microsoft Entra ID for staff if possible, no visit reason in SMS, and family/proxy access for two pediatric clinics. Epic/FHIR is a later phase. Success is measurable: 40% of new appointments booked online within 90 days, and a drop in scheduling callbacks.",
  approach:
    "Week 1 is a working-session week, not a slide week: confirm visit types, buffer rules, proxy policy, and the CSV/iCal shape Dana can already export. We then design the booking flow in plain language so patients stop picking the wrong visit type.\n\nArchitecture is a TypeScript Next.js app with PostgreSQL, a calendar service that becomes the system of record, Stripe (feature-flagged), Twilio for reminder copy that contains no PHI, and audit logging on every chart-adjacent read. Staff authenticate through Entra ID; patients use email verification plus password reset. We will execute a BAA and privacy-policy track in parallel with design because legal already estimates three weeks.\n\nWe staff a senior-led pod, demo every week, and keep a written scope board that sales, ops, and engineering share.",
  scope: [
    {
      title: "Patient accounts and proxy access",
      description:
        "Registration, email verification, password reset, session timeout, and designated proxy (parent/guardian) access so family members do not see records unless authorized.",
      included: true,
    },
    {
      title: "Central provider calendar and online booking",
      description:
        "Import existing schedules from CSV/iCal, enforce visit-type buffers, prevent double-book, and let patients book, reschedule, and cancel against live availability.",
      included: true,
    },
    {
      title: "Digital intake and consent",
      description:
        "Configurable forms per visit type, completion before the visit, and PDF export for charting.",
      included: true,
    },
    {
      title: "Reminders",
      description:
        "72h email, 24h SMS, 2h email. SMS copy is appointment-only plus a login link; no visit reason or other PHI.",
      included: true,
    },
    {
      title: "Staff operations console",
      description:
        "Front desk and clinic manager views for exceptions, visit-type copy, and audit history. Staff MFA; Entra ID for staff SSO.",
      included: true,
    },
    {
      title: "Balances and card payments",
      description:
        "Show outstanding balances from a weekly CSV import and collect card payment via Stripe. Can be deferred if the board needs a cheaper cut.",
      included: true,
    },
    {
      title: "Basic operations analytics",
      description:
        "Online vs phone booking mix, no-show rate, and intake completion.",
      included: true,
    },
    {
      title: "Epic / FHIR integration",
      description:
        "Deferred to a later release as specified in the RFP.",
      included: false,
    },
    {
      title: "Native mobile apps",
      description: "Responsive web only for v1.",
      included: false,
    },
    {
      title: "In-portal telehealth video",
      description:
        "v1 may link out to an existing video tool; a waiting room is not in this estimate.",
      included: false,
    },
    {
      title: "Spanish-language UI",
      description: "English-only in v1 unless added as a change request.",
      included: false,
    },
  ],
  deliverables: [
    "Production patient portal and staff console on US-hosted infrastructure",
    "Calendar import tooling and visit-type configuration",
    "Intake form builder with PDF export",
    "Reminder templates and Twilio/Stripe configuration",
    "Role-based access, staff MFA, audit log, and session controls",
    "WCAG 2.2 AA accessibility pass on primary flows",
    "Source code, infrastructure as code, runbook, and admin training",
    "BAA-ready architecture description for Meridian legal",
  ],
  phases: [
    {
      name: "Discover and bind scope",
      durationWeeks: 2,
      objectives: [
        "Workshop visit types, buffers, proxy rules, and reminder copy",
        "Map CSV/iCal export and QuickBooks balance file",
        "Start BAA and privacy-policy review",
      ],
      deliverables: ["Signed scope addendum", "Architecture sketch", "Clickable booking prototype"],
    },
    {
      name: "Calendar, identity, and booking",
      durationWeeks: 5,
      objectives: [
        "Stand up environments and Entra ID staff login",
        "Implement patient auth, proxy model, and central calendar",
        "Ship booking / reschedule / cancel against live slots",
      ],
      deliverables: ["Internal booking beta", "Calendar import", "Audit log on record access"],
    },
    {
      name: "Intake, reminders, payments, analytics",
      durationWeeks: 5,
      objectives: [
        "Configurable intake + PDF export",
        "Reminder cadence with PHI-safe SMS",
        "Balance import and Stripe pay flow",
      ],
      deliverables: ["Intake library", "Reminder jobs", "Payments behind a feature flag"],
    },
    {
      name: "Harden, train, go live",
      durationWeeks: 4,
      objectives: [
        "Accessibility and security review",
        "Pilot at one clinic, then remaining sites",
        "Train front desk and clinic managers",
      ],
      deliverables: ["Production cutover", "Runbook", "90-day success dashboard"],
    },
  ],
  estimates: [
    { role: "Engagement lead / PM", hours: 220, rate: 165, cost: 36300 },
    { role: "Product designer", hours: 180, rate: 125, cost: 22500 },
    { role: "Senior engineer", hours: 520, rate: 155, cost: 80600 },
    { role: "Engineer", hours: 380, rate: 110, cost: 41800 },
    { role: "QA / automation", hours: 160, rate: 95, cost: 15200 },
  ],
  totalHours: 1460,
  totalCost: 225860,
  contingencyPct: 15,
  timelineSummary:
    "16 weeks from kickoff to go-live, matching Meridian’s target. Discovery runs in parallel with legal review. If legal or Entra ID access slips, we freeze payments first—not booking.",
  assumptions: [
    "Dana can provide a repeatable CSV/iCal export of provider schedules in week 1.",
    "Balance files arrive at least weekly in a stable CSV schema.",
    "Meridian executes a BAA and supplies privacy-policy counsel within three weeks of kickoff.",
    "Entra ID tenant access for staff SSO is granted in the first ten days.",
    "One clinic is available as a pilot; remaining sites follow the same visit-type model.",
    "Native apps, Epic/FHIR, in-app video, and Spanish UI stay out of v1.",
    "Content for visit-type descriptions and intake questions is provided by clinic managers.",
  ],
  risks: [
    {
      risk: "Google Calendars diverge from reality during import, so online slots are wrong.",
      impact: "high",
      likelihood: "high",
      mitigation:
        "Treat imported data as a starting point, make the portal the system of record at cutover, and run a two-week dual-run with front desk.",
    },
    {
      risk: "Legal review of BAA and patient communications overruns the three-week estimate.",
      impact: "medium",
      likelihood: "medium",
      mitigation:
        "Start legal in week 1 with reminder copy and proxy consent. Do not wait for a polished UI.",
    },
    {
      risk: "SMS vendors or compliance flag even non-PHI reminders.",
      impact: "medium",
      likelihood: "low",
      mitigation:
        "Keep SMS to time/location-free ‘you have an appointment’ plus a login link. Email carries the rest.",
    },
    {
      risk: "Scope expands into Epic because charting PDFs feel incomplete.",
      impact: "high",
      likelihood: "medium",
      mitigation:
        "Written exclusion in the SOW. Offer a priced FHIR phase rather than stretching v1.",
    },
  ],
  openQuestions: [
    "Which visit types and buffer rules apply at the hospital vs the four clinics?",
    "Who is the legal named proxy for pediatrics, and is teen confidentiality required?",
    "Should payments ship in v1 or remain desk-only for the first quarter?",
    "Is Entra ID the only staff identity, or do contractors need a fallback login?",
    "What retention period does compliance want on the audit log?",
  ],
  nextSteps: [
    "30-minute scope confirmation with Priya, James, and Dana (visit types, proxy, payments cut).",
    "Return a one-page SOW addendum and this estimate for board approval.",
    "Kick off week 1 workshops and legal BAA in parallel upon signature.",
    "Meridian to share sample calendar export, balance CSV, and Entra ID contact.",
  ],
  brief: {
    clientName: "Meridian Health Network",
    projectTitle: "Patient Access Portal",
    problem:
      "Phone- and Google Calendar-based scheduling across four clinics and a hospital, causing callbacks, double-books, and no-shows.",
    goals: [
      "Online book/reschedule/cancel",
      "Digital intake",
      "PHI-safe reminders",
      "Reduce front-desk callbacks",
    ],
    mustHave: [
      "Booking against live calendars",
      "Proxy access",
      "Staff MFA and audit log",
      "US hosting",
      "WCAG 2.2 AA",
    ],
    niceToHave: ["Payments", "Spanish", "Insurance card upload", "Telehealth link-out"],
    constraints: ["16 weeks", "$180–260k", "No PHI in SMS", "No native apps"],
    stakeholders: ["Priya Shah (COO)", "James (Clinic Manager)", "Dana (IT)"],
    successCriteria: [
      "40% of new appointments booked online in 90 days",
      "Measurable drop in scheduling callbacks",
    ],
  unknownOrMissing: [
      "Visit-type catalog",
      "Teen confidentiality rules",
      "Audit retention",
    ],
  },
  projectType: "integration",
  estimateBands: {
    leanHours: 1197,
    leanCost: 185205,
    likelyHours: 1460,
    likelyCost: 225860,
    paddedHours: 1781,
    paddedCost: 275549,
  },
  leanCuts: [
    "Defer Stripe/balance pay to a later quarter",
    "Ship analytics as a spreadsheet export instead of a dashboard",
    "Limit intake to the three highest-volume visit types",
  ],
  paddedAdds: [
    "Calendar dual-run longer than two weeks across five sites",
    "Entra ID / contractor login fallback",
    "Visit-type catalog larger than expected at the hospital",
  ],
  weekOneNeeds: [
    "Sample CSV/iCal export of provider schedules from Dana",
    "Visit-type catalog and buffer rules for hospital vs clinics",
    "Named proxy policy and teen-confidentiality decision",
    "Entra ID tenant contact and access in the first ten days",
    "Kick off BAA with legal in week 1, not after UI polish",
  ],
  rfpScore: {
    competitorsNamed: ["Phreesia"],
    criteria: [
      {
        criterion: "Online booking against live calendars",
        importance: "must",
        ourPosition: "strong",
        why: "This is the core product we have delivered for clinics. RFP names CSV/iCal, not a mystery EHR.",
        bidMove: "Lead with calendar as system of record and a two-week dual-run.",
      },
      {
        criterion: "HIPAA-safe reminders (no PHI in SMS)",
        importance: "must",
        ourPosition: "strong",
        why: "COO already constrained copy. We have a lost-bid lesson that forbids visit-reason SMS.",
        bidMove: "Quote the allowed reminder cadence and keep Twilio copy in scope language.",
      },
      {
        criterion: "US hosting + staff MFA / Entra ID",
        importance: "must",
        ourPosition: "strong",
        why: "Matches studio stack standard for PHI-adjacent web.",
        bidMove: "Name AWS US regions and Entra for staff in approach; do not invent FedRAMP.",
      },
      {
        criterion: "Proxy / pediatric family access",
        importance: "must",
        ourPosition: "adequate",
        why: "Required by email, not a commodity checkbox. We can build it; we should not treat it as a two-day add-on.",
        bidMove: "Include as its own scope line; ask teen-confidentiality in week 1.",
      },
      {
        criterion: "Calendar import from three Google Calendars",
        importance: "must",
        ourPosition: "weak",
        why: "Westside overrun. Dual-run is the real work. Thread and transcript both flag it.",
        bidMove: "Price migration as its own phase. Demand a sample iCal in week 1.",
      },
      {
        criterion: "Epic / FHIR",
        importance: "nice",
        ourPosition: "out",
        why: "RFP says not required for v1. We have no proof point.",
        bidMove: "Exclude. Offer a discovery phase only if they insist.",
      },
      {
        criterion: "Buy vs build vs Phreesia",
        importance: "should",
        ourPosition: "adequate",
        why: "COO asked for an honest take. Suite is heavy; we win on a focused portal, not on matching every engagement module.",
        bidMove: "Win theme: booking quality over suite breadth. Do not pretend we are a patient-engagement platform.",
      },
    ],
    strengths: [
      "HIPAA-adjacent web on the studio stack (Next.js, Postgres, US AWS)",
      "PHI-safe reminder copy and a written SMS constraint",
      "Focused custom portal vs a suite Meridian will half-use",
      "Staff Entra ID + MFA as a standard, not a special",
    ],
    weaknesses: [
      "Calendar dual-run across three Google Calendars — we have overrun this before",
      "No Epic/FHIR proof; do not bid it as included",
      "No native apps and no in-portal video — out, not a stretch",
      "Payments are optional to the COO; easy to over-sell Stripe",
    ],
    winThemes: [
      "One calendar of record, not four Google Calendars",
      "Build a booking product, do not buy a suite you will not use",
      "Compliance in week 1 (BAA, SMS copy, proxy policy), not after polish",
    ],
    watchouts: [
      "Do not quote calendar import as a two-day job",
      "Do not put visit reason in SMS",
      "If the board needs a cheaper cut, drop payments — not booking or proxy",
    ],
  },
  comparables: [
    {
      id: "past-clinic-cal",
      projectTitle: "Clinic scheduling rewrite",
      clientName: "Westside Medical",
      projectType: "integration",
      quotedHours: 720,
      quotedCost: 118000,
      actualHours: 980,
      outcome: "won",
      reason: "technical_fit",
      note: "Quoted calendar import as 2 days. Three Google Calendars; dual-run ate a week. Next time: sample file in week 1, migration as its own phase.",
    },
    {
      id: "past-reminders",
      projectTitle: "Patient reminders v1",
      clientName: "Harbor Pediatrics",
      projectType: "web",
      quotedHours: 410,
      quotedCost: 64000,
      outcome: "lost",
      reason: "compliance",
      note: "SMS with visit reason. Compliance killed the SOW after signature on a similar deal. Keep SMS non-PHI.",
    },
    {
      id: "past-ops",
      projectTitle: "Ops console for three sites",
      clientName: "Northline internal",
      projectType: "web",
      quotedHours: 1600,
      quotedCost: 248000,
      actualHours: 1540,
      outcome: "won",
      reason: "scope",
      note: "Bid the full wish list against a known budget and almost lost. Cut payments from v1; booking held.",
    },
  ],
  outcome: "draft",
  reviewStatus: "internal_review",
  language: "en",
  comments: [
    {
      id: "c-scope-payments",
      sectionId: "scope",
      author: "Priya (sales)",
      body: "Board will not fund Stripe in v1. Move payments out of included scope before we send.",
      createdAt: "2026-08-21T11:00:00.000Z",
      resolved: false,
    },
    {
      id: "c-price-band",
      sectionId: "investment",
      author: "James (PM)",
      body: "We're at the top of the $180–260k band. Confirm the lean cut (drop payments) before internal review signs off.",
      createdAt: "2026-08-21T11:20:00.000Z",
      resolved: false,
    },
    {
      id: "c-risk-cal",
      sectionId: "risks",
      author: "Dana (delivery)",
      body: "Calendar dual-run needs to stay a named risk. Do not bury it in assumptions.",
      createdAt: "2026-08-21T12:00:00.000Z",
      resolved: true,
    },
  ],
};
