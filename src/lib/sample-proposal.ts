import type { Proposal } from "./types";

export const SAMPLE_PROPOSAL: Proposal = {
  id: "sample-proposal",
  createdAt: "2026-08-20T15:00:00.000Z",
  clientName: "Meridian Health Network",
  projectTitle: "Patient Access Portal — v1 delivery proposal",
  executiveSummary:
    "Meridian’s clinics still schedule by phone and Google Calendar. That produces double-books, 18 hours a week of callbacks, and a no-show problem that hits Monday physicals hardest. This proposal covers a patient portal and staff console that make online booking the default path, with digital intake, reminders that stay HIPAA-safe, and optional balance pay.\n\nWe recommend building a focused v1 rather than buying a suite like Phreesia. Meridian’s calendars are not centralized, Epic is explicitly out of the first release, and proxy access for pediatrics is a hard requirement those products often bury in a larger rollout. A custom portal lets us make booking quality the product, then add payments and FHIR later without paying for a platform Meridian will only half-use.\n\nWe can deliver in 16 weeks for a likely investment of about $214k including contingency, inside the $180–260k band. Payments can slip a quarter if scope pressure appears; booking, proxy access, and a single staff calendar cannot.",
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
  totalCost: 226310,
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
};
