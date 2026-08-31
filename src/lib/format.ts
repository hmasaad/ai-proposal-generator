export function money(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function newId() {
  return crypto.randomUUID();
}

export function guessKind(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("rfp") || lower.includes("rfq")) return "rfp" as const;
  if (lower.includes("email") || lower.endsWith(".eml")) return "email" as const;
  if (lower.includes("note") || lower.includes("meeting")) return "notes" as const;
  if (lower.includes("requirement")) return "requirements" as const;
  if (lower.includes("proposal")) return "past_proposal" as const;
  return "requirements" as const;
}
