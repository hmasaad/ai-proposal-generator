import type { SourceDocument } from "./types";

export const SAMPLE_SOURCES: SourceDocument[] = [
  {
    id: "sample-rfp",
    name: "Meridian Health — Patient Portal RFP",
    kind: "rfp",
    text: `REQUEST FOR PROPOSAL
Project: Meridian Health Patient Access Portal
Issued by: Meridian Health Network, Regional Operations
Response due: 3 weeks from receipt

1. Background
Meridian Health operates 4 clinics and a 90-bed community hospital. Patients currently book appointments by phone, complete paper intake forms, and call billing for balances. Front-desk staff spend an estimated 18 hours/week on scheduling callbacks. Leadership wants a patient-facing portal that reduces phone load and improves no-show rates.

2. Objectives
- Let patients book, reschedule, and cancel appointments online against live provider calendars
- Complete digital intake / consent before the visit
- View upcoming visits, after-visit summaries, and outstanding balances
- Send appointment reminders (email + SMS)
- Give clinic staff a simple operations console for exceptions

3. Functional requirements (must-have)
- Patient registration with email verification and password reset
- Role-based access: patient, front desk, clinic manager, billing
- Appointment booking with provider, location, and visit type
- Buffer rules (e.g. 15-minute intake slots, no double-book)
- Intake forms configurable per visit type (PDF export for charting)
- Payment of outstanding balances via Stripe (card on file optional)
- Audit log of access to patient records
- HIPAA-oriented controls: encryption in transit/at rest, session timeout, MFA for staff

4. Nice-to-have
- Telehealth waiting room (video is out of scope for v1; link-out is acceptable)
- Multi-language (English + Spanish)
- Patient-upload of insurance card photos
- Basic analytics: no-show rate, online vs phone bookings, form completion

5. Integrations
- Must import existing provider schedules from a CSV/iCal export in v1
- Epic/FHIR integration is desired later but NOT required for the initial release
- Twilio or similar for SMS
- Stripe for payments

6. Constraints
- Go-live target: 16 weeks from kickoff
- Budget guidance: $180k–$260k for v1, including discovery
- Hosting must be US-based
- Accessibility: WCAG 2.2 AA
- Mobile-responsive; native apps are out of scope

7. Current environment
- Scheduling today: paper + Google Calendar per clinic (not centralized)
- Billing: Candid / QuickBooks; balances exported weekly as CSV
- Identity: no existing patient identity provider

8. Evaluation
Proposals should include understanding of the problem, proposed architecture, scope in/out, phased timeline, team, fixed or time-and-materials estimate, assumptions, and risks. Please call out what you need from Meridian in week 1.`,
  },
  {
    id: "sample-email",
    name: "Email from COO — follow-up",
    kind: "email",
    text: `From: Priya Shah, COO, Meridian Health
Subject: Re: portal RFP — a few clarifications

Thanks for jumping on the intro call.

Two things I forgot to put in the RFP:

1) We cannot have patients seeing other family members' records unless they are a designated proxy (parent/guardian). Proxy access is important for pediatrics at two of our clinics.

2) Our compliance officer is nervous about SMS with PHI. Reminders can say "You have an appointment tomorrow at Meridian" plus a login link — no visit reason in the text.

Also: if we have to choose, appointment booking quality matters more than payments in v1. We can keep taking card payments at the desk for a quarter if needed.

Can you include a recommendation on build vs buying a patient-engagement suite? We looked at Phreesia and it felt heavy and expensive, but I want your honest take.

— Priya`,
  },
  {
    id: "sample-notes",
    name: "Discovery call notes — 20 Aug",
    kind: "notes",
    text: `Attendees: Priya (COO), James (Clinic Manager, Westside), Dana (IT), us.

- Peak no-show is Monday AM physicals. They want reminder cadence: 72h email, 24h SMS, 2h email.
- Front desk's nightmare is double-booking across two Google Calendars. Central calendar is the real prize.
- James: "If a patient books the wrong visit type, we still have to call them. Need visit-type descriptions in plain language."
- Dana: no SSO required for patients. Staff should use Microsoft 365 login if possible (Entra ID).
- They have a part-time developer who can export CSVs but cannot own the product.
- Success = 40% of new appointments booked online within 90 days of launch, and a measurable drop in scheduling callbacks.
- Legal review of BAA + privacy policy will take ~3 weeks; start that in parallel with design.
- Decision maker: Priya. Board wants a number they can approve in one meeting.`,
  },
];
