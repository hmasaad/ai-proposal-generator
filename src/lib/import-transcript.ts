export function looksLikeTranscript(raw: string) {
  const text = raw.trim();
  if (/^WEBVTT/i.test(text)) return true;
  if (/^\d+\s*\n\d{2}:\d{2}:\d{2}[.,]\d{3}\s-->/m.test(text)) return true;
  if (/\d{1,2}:\d{2}:\d{2}\.\d{3}\s-->\s\d{1,2}:\d{2}:\d{2}/.test(text)) return true;
  if (/^(?:zoom|google meet|meet transcript)/i.test(text)) return true;
  return false;
}

function stamp(time: string) {
  const match = time.trim().match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
  return match ? match[1] : "";
}

function pushTurn(
  turns: { time: string; speaker: string; text: string }[],
  time: string,
  speaker: string,
  text: string,
) {
  const line = text.replace(/\s+/g, " ").trim();
  if (!line) return;
  const who = speaker.trim() || "Speaker";
  const last = turns[turns.length - 1];
  if (last && last.speaker === who) {
    last.text = `${last.text} ${line}`.trim();
    return;
  }
  turns.push({ time: stamp(time), speaker: who, text: line });
}

function parseWebVtt(raw: string) {
  const turns: { time: string; speaker: string; text: string }[] = [];
  const blocks = raw
    .replace(/^WEBVTT.*$/im, "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block && !/^NOTE\b|^STYLE\b|^KIND\b/i.test(block));

  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    const timeLine =
      lines.find((line) => /-->/.test(line)) ?? "";
    const time = stamp(timeLine);
    const textLines = lines.filter((line) => !/-->/.test(line) && !/^\d+$/.test(line));
    for (const line of textLines) {
      const named = line.match(/^([^:]{1,80}):\s+(.+)$/);
      if (named) pushTurn(turns, time, named[1], named[2]);
      else pushTurn(turns, time, "Speaker", line);
    }
  }
  return turns;
}

function parseMeet(raw: string) {
  const turns: { time: string; speaker: string; text: string }[] = [];
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  let speaker = "Speaker";
  let time = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(trimmed)) {
      time = trimmed;
      continue;
    }
    if (
      trimmed.length < 80 &&
      !/[.?!]$/.test(trimmed) &&
      /^[A-Z][\w .'-]+$/.test(trimmed)
    ) {
      speaker = trimmed;
      continue;
    }
    const named = trimmed.match(/^([^:]{1,80}):\s+(.+)$/);
    if (named) pushTurn(turns, time, named[1], named[2]);
    else pushTurn(turns, time, speaker, trimmed);
  }
  return turns;
}

export function parseTranscript(raw: string) {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return "";
  const turns = /^WEBVTT/i.test(text) || /-->/.test(text) ? parseWebVtt(text) : parseMeet(text);
  if (!turns.length) return `MEETING TRANSCRIPT\n\n${text}`;
  const body = turns
    .map((turn) => `${turn.time ? `[${turn.time}] ` : ""}${turn.speaker}: ${turn.text}`)
    .join("\n");
  return `MEETING TRANSCRIPT\n${body}`;
}
