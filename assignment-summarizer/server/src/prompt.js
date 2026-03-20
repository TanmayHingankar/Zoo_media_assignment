export const buildPrompt = (text) => `You are an information extraction system. Return ONLY valid JSON and nothing else.
Schema:
{
  "summary": "one sentence",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "sentiment": "positive | neutral | negative"
}
Rules (violations will cause the response to be rejected):
- summary must be exactly one sentence
- keyPoints must contain exactly 3 concise bullet-style strings
- sentiment must be one of: positive, neutral, negative
- respond with strict JSON only (no markdown, no prose, no extra keys)
- do not add explanations or formatting

Text to analyze (extract and summarize):
${text}`;
