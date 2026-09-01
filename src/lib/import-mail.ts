function decodeQuotedPrintable(input: string) {
  return input
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    );
}

function headerValue(headers: string, name: string) {
  const match = headers.match(new RegExp(`^${name}:\\s*(.+)$`, "im"));
  return match?.[1]?.replace(/\s+/g, " ").trim() ?? "";
}

function stripHtml(text: string) {
  if (!/<[a-z][\s\S]*>/i.test(text)) return text;
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractEmlBody(raw: string) {
  const split = raw.replace(/\r\n/g, "\n").split(/\n\n/);
  if (split.length < 2) return stripHtml(raw);
  const headers = split[0];
  const rest = split.slice(1).join("\n\n");
  const boundary = headers.match(/boundary="?([^";\s]+)"?/i)?.[1];
  if (boundary) {
    const parts = rest.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    const plain = parts.find((part) => /content-type:\s*text\/plain/i.test(part));
    const html = parts.find((part) => /content-type:\s*text\/html/i.test(part));
    const chosen = plain ?? html ?? rest;
    const body = chosen.replace(/^[\s\S]*?\n\n/, "");
    return stripHtml(decodeQuotedPrintable(body));
  }
  return stripHtml(decodeQuotedPrintable(rest));
}

function parseEml(raw: string) {
  const normalized = raw.replace(/\r\n/g, "\n");
  const headerEnd = normalized.search(/\n\n/);
  const headers = headerEnd >= 0 ? normalized.slice(0, headerEnd) : normalized;
  return {
    from: headerValue(headers, "From"),
    to: headerValue(headers, "To"),
    date: headerValue(headers, "Date"),
    subject: headerValue(headers, "Subject"),
    body: extractEmlBody(normalized),
  };
}

const PART_SPLIT =
  /(?:^|\n)(?:-----Original Message-----|From:\s.+[\s\S]*?Sent:\s|On .{8,120} wrote:)/g;

function looksLikeEml(raw: string) {
  return /^(?:from|return-path|received|mime-version|subject):/im.test(raw.trim().slice(0, 800));
}

export function looksLikeEmailThread(raw: string) {
  const text = raw.trim();
  if (looksLikeEml(text)) return true;
  if (/-----Original Message-----/i.test(text)) return true;
  if (/^From:\s.+\n(?:Sent|Date):/im.test(text)) return true;
  if (/On .{8,80} wrote:/i.test(text)) return true;
  return false;
}

function formatPart(from: string, date: string, subject: string, body: string) {
  const who = from || "Unknown sender";
  const when = date ? ` (${date})` : "";
  const subj = subject ? `\nSubject: ${subject}` : "";
  const cleaned = body
    .replace(/^>+\s?/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return `From: ${who}${when}${subj}\n${cleaned}`;
}

export function parseEmailThread(raw: string) {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return "";

  if (looksLikeEml(text) && !/-----Original Message-----/i.test(text)) {
    const eml = parseEml(text);
    return `EMAIL THREAD${eml.subject ? `: ${eml.subject}` : ""}\n\n${formatPart(eml.from, eml.date, eml.subject, eml.body)}`;
  }

  const markers: { index: number; length: number }[] = [];
  const splitter = new RegExp(PART_SPLIT.source, "gim");
  let match: RegExpExecArray | null;
  while ((match = splitter.exec(text))) {
    markers.push({ index: match.index, length: match[0].length });
  }

  if (!markers.length) {
    return `EMAIL THREAD\n\n${text}`;
  }

  const parts: string[] = [];
  const first = text.slice(0, markers[0].index).trim();
  if (first) parts.push(first);
  for (let i = 0; i < markers.length; i += 1) {
    const start = markers[i].index;
    const end = i + 1 < markers.length ? markers[i + 1].index : text.length;
    parts.push(text.slice(start, end).trim());
  }

  const formatted = parts
    .map((part) => {
      const from = part.match(/^From:\s*(.+)$/im)?.[1]?.trim() ?? "";
      const date =
        part.match(/^(?:Sent|Date):\s*(.+)$/im)?.[1]?.trim() ??
        part.match(/^On (.+?) wrote:/im)?.[1]?.trim() ??
        "";
      const subject = part.match(/^Subject:\s*(.+)$/im)?.[1]?.trim() ?? "";
      const body = part
        .replace(/^From:.*$/im, "")
        .replace(/^(?:Sent|Date):.*$/im, "")
        .replace(/^To:.*$/im, "")
        .replace(/^Cc:.*$/im, "")
        .replace(/^Subject:.*$/im, "")
        .replace(/^-----Original Message-----/i, "")
        .replace(/^On .+ wrote:/im, "")
        .trim();
      return formatPart(from, date, subject, body);
    })
    .filter((part) => part.replace(/\s+/g, " ").length > 20);

  const subject =
    text.match(/^Subject:\s*(.+)$/im)?.[1]?.trim() ??
    formatted[0]?.match(/Subject: (.+)/)?.[1] ??
    "";

  return `EMAIL THREAD${subject ? `: ${subject}` : ""}\n\n${formatted.join("\n\n---\n\n")}`;
}
