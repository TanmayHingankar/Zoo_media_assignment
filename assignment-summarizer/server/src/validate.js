const SENTIMENTS = ["positive", "neutral", "negative"];
const COMMON_ABBREVIATIONS = new Set([
  "e.g", "i.e", "mr", "mrs", "ms", "dr", "prof", "vs", "etc", "approx", "est", "sr", "jr"
]);

const isOneSentence = (text) => {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) return false;
  let sentences = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    if (ch === "." || ch === "!" || ch === "?") {
      const prefix = normalized.slice(Math.max(0, i - 6), i).toLowerCase();
      const word = prefix.split(/[^a-z]/).pop();
      if (word && COMMON_ABBREVIATIONS.has(word)) continue;
      // Skip ellipsis
      if (ch === "." && normalized[i + 1] === ".") continue;
      sentences += 1;
    }
  }
  return sentences === 1;
};

export function validateInput(text) {
  if (typeof text !== "string") {
    return { ok: false, error: "Input must be a string." };
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: "Input text cannot be empty." };
  }
  return { ok: true, value: trimmed };
}

export function validateModelResponse(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Model response missing." };
  }

  const { summary, keyPoints, sentiment } = body;

  if (!summary || typeof summary !== "string" || !isOneSentence(summary)) {
    return { ok: false, error: "summary must be a single sentence string." };
  }

  if (
    !Array.isArray(keyPoints) ||
    keyPoints.length !== 3 ||
    !keyPoints.every((p) => typeof p === "string" && p.trim())
  ) {
    return { ok: false, error: "keyPoints must be an array of exactly 3 non-empty strings." };
  }

  if (!SENTIMENTS.includes(sentiment)) {
    return { ok: false, error: "sentiment must be positive, neutral, or negative." };
  }

  return {
    ok: true,
    value: {
      summary: summary.trim(),
      keyPoints: keyPoints.map((p) => p.trim()),
      sentiment
    }
  };
}

export { isOneSentence };
