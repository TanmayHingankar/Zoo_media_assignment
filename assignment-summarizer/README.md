# Assignment Summarizer

Small full-stack app that turns unstructured text into a structured summary using an OpenAI-compatible LLM. Built to be interview-ready, minimal, and easy to explain in ~1 hour. Supports OpenAI or Gemini via environment switch.

## Tech Stack
- React + Vite (frontend)
- Node.js + Express (backend)
- OpenAI SDK or Google Generative AI SDK (LLM client)
- dotenv for secrets, cors for local dev

## Project Structure
```
assignment-summarizer/
  client/           # React UI
  server/           # Express API + LLM call + validation
  README.md
```

## Setup
1) Install deps
```
cd assignment-summarizer/server && npm install
cd ../client && npm install
```
2) Environment variables (choose provider)
- Copy `server/.env.example` to `server/.env`
- For OpenAI: set `LLM_PROVIDER=openai` and `OPENAI_API_KEY=your-key`
- For Gemini: set `LLM_PROVIDER=gemini` and `GEMINI_API_KEY=your-key`
- Optional: `PORT=5000`, `GEMINI_MODEL=gemini-1.5-flash`, `LLM_TIMEOUT_MS=10000`, `RATE_LIMIT_MAX=10`

## Running
- Backend: `cd server && npm start`
- Frontend: `cd client && npm run dev`
- The UI calls the API at `VITE_API_URL` if set, otherwise `http://localhost:5000/api/summarize`.

## Security Practices
- API keys live only in `.env` (never committed). A placeholder-only `.env.example` is provided.
- `.gitignore` excludes `node_modules` and all `.env` files to prevent leaks.
- Backend is the single place that touches LLM keys; the browser never sees them.
- Server rejects requests when keys are missing with a clear 401 error.
- Lightweight rate limiting guards against abuse.

## Architecture (why backend?)
Input ? Express route ? prompt builder ? LLM client ? strict validation ? JSON response.
The backend centralizes validation, retries, timeouts, rate limiting, and key handling, keeping the UI thin and the keys safe.

## Prompt Design (strict JSON)
- Role: information extraction system.
- Explicit schema: summary (one sentence), exactly 3 keyPoints, sentiment in {positive, neutral, negative}.
- Instructions: JSON only, no markdown/extra keys; violations will be rejected.
- Result: lower parse errors and simpler backend validation.

## API Flow
1. `POST /api/summarize` with `{ "text": "..." }` (max ~10kb).
2. Backend validates non-empty string.
3. Builds strict prompt, calls chosen LLM with timeout + single retry.
4. Parses and validates model JSON; enforces single-sentence summary, 3 key points, sentiment enum.
5. Returns `{ summary, keyPoints, sentiment, provider, model, timestamp, requestId }`.
6. Errors are structured as `{ error, type }` with 400 (validation), 401 (missing key), 429 (rate limit), or 500 (LLM/timeout).

## File Input (optional)
- UI accepts a `.txt` upload; content is sent exactly like pasted text.
- If a file is provided, it takes precedence over the textarea.

## Example Request
```
POST http://localhost:5000/api/summarize
Content-Type: application/json

{ "text": "I liked the build quality but the battery dies after five hours." }
```

### Example Response
```json
{
  "summary": "The reviewer appreciates the build quality but finds the battery life short.",
  "keyPoints": [
    "Solid build and premium feel",
    "Battery lasts about five hours",
    "Good overall if you carry a spare battery"
  ],
  "sentiment": "neutral",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "timestamp": "2026-03-20T10:00:00.000Z",
  "requestId": "abcd-1234"
}
```

## Error Model
```json
{ "error": "Input text cannot be empty.", "type": "validation" }
```
Types: `validation`, `api`, `timeout`, `rate_limit` (401 missing key returns type `api`).

## Frontend UX
- Textarea input OR optional .txt upload.
- Disabled button + loading label during requests.
- Inline error display with message and type.
- Sentiment color coding: green / amber / red.
- Result cards + meta (provider/model/requestId/timestamp).

## Design Decisions
- **Backend-first**: centralizes keys, validation, retries, and rate limiting; UI stays thin.
- **Strict validation**: schema + single-sentence check to keep outputs deterministic.
- **Minimal UI**: focuses signal on prompt + API robustness, not styling.

## Limitations
- Sentence detection is heuristic; rare abbreviations may still confuse it.
- Quality depends on underlying LLM output.
- No auth; intended for local/demo use.

## Production Considerations
- Rate limiting is in-place; add auth/proxy for public exposure.
- Keep API keys in secrets manager/CI variables.
- Monitor LLM latency and adjust `LLM_TIMEOUT_MS` as needed.

## Testing
- Lightweight node test runner + supertest.
- Validator cases: abbreviations, invalid sentiment, wrong keyPoints length, multi-sentence summary.
- API route: empty input rejected; successful path returns structured JSON.
Run: `cd server && npm test`

## Running Tests (CI readiness)
- Scripts: `npm start`, `npm run dev`, `npm test`.
- Suitable for CI: install deps, run tests, then start dev/build.

## Troubleshooting
- 401 missing key: check `.env` matches provider.
- 400 validation: ensure text is non-empty and under 10kb.
- 429 rate limit: wait a minute or raise `RATE_LIMIT_MAX` temporarily.
- Timeout: increase `LLM_TIMEOUT_MS` or try a shorter input.

## Future Improvements
- Batch processing
- Confidence/quality score
- Optional file upload for PDFs with OCR
- More granular logging/metrics
