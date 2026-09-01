function errorText(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function isFreeTierQuota(error: unknown) {
  const text = errorText(error);
  return /free_tier_requests|check your plan and billing|free-tier quota is used up/i.test(
    text,
  );
}

export function friendlyModelError(error: unknown) {
  const text = errorText(error);
  if (isFreeTierQuota(error)) {
    return "Gemini free-tier quota is used up (20 generate requests per day). One proposal uses several calls — extract, score, outline, price, write, review. Wait until the quota resets, enable billing at https://aistudio.google.com/, or open View sample proposal.";
  }
  if (/\b429\b|RESOURCE_EXHAUSTED|quota exceeded/i.test(text)) {
    const seconds = text.match(/retry in ([\d.]+)\s*s/i);
    const wait = seconds ? Math.ceil(Number(seconds[1])) : 60;
    return `Gemini is rate-limited. Wait about ${wait}s and try again.`;
  }
  return text;
}

export function retryDelayMs(error: unknown) {
  const text = errorText(error);
  if (!/\b429\b|RESOURCE_EXHAUSTED|quota exceeded/i.test(text)) return null;
  // Daily free-tier cap does not recover in the suggested 50s window.
  if (isFreeTierQuota(error)) return null;
  const seconds = text.match(/retry in ([\d.]+)\s*s/i);
  if (seconds) return Math.min(90_000, Math.ceil(Number(seconds[1]) * 1000) + 750);
  return 20_000;
}
