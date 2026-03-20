#  Project Overview
Full-stack summarizer that turns unstructured text (paste or .txt upload) into strict JSON (summary, 3 key points, sentiment) using OpenAI- or Gemini-compatible LLMs. Built to be interview-ready, production-aware, and explainable in under 2 minutes.

#  Problem Statement
Take messy text, call an LLM safely, and return a predictable JSON envelope the rest of a system can trust.

#  Approach
Backend-first design: validate early, prompt for exact schema, enforce JSON-only output, add timeouts/retry/rate-limit, and return structured errors + metadata for observability.

#  Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- LLM clients: OpenAI SDK or Google Generative AI
- Tooling: dotenv, cors, supertest, node test runner

#  Architecture
Input → Express route → prompt builder → LLM client → validator → JSON response.  
Why backend: centralizes secrets, validation, retries, rate limiting, and error typing so the UI stays thin and keys never leak.

#  API Flow
1. `POST /api/summarize` with `{ text }` (≤10kb).  
2. Validate non-empty string.  
3. Build strict JSON-only prompt.  
4. Call chosen LLM with timeout + single retry.  
5. Parse JSON, enforce: one-sentence summary, exactly 3 keyPoints, sentiment ∈ {positive, neutral, negative}.  
6. Return `{ summary, keyPoints, sentiment, provider, model, timestamp, requestId }`.  
7. Errors: `{ error, type }` with 400 validation, 401 missing key, 429 rate limit, 500 LLM/timeout.

#  Prompt Design
- Role: information extraction system.  
- Schema spelled out; markdown/extra keys forbidden; “violations will be rejected” to nudge correctness.  
- Uses provider JSON modes to minimize parsing failures.

#  Validation Strategy
- Input: type + emptiness + size.  
- Output: single-sentence detector (abbrev-aware), keyPoints length = 3, sentiment enum.  
- Rejects on first violation; keeps responses deterministic.

#  Security Practices
- Keys only in `.env` (never committed); `.env.example` is placeholder-only.  
- `.gitignore` blocks env and node_modules.  
- Backend is sole LLM caller; browser never sees keys.  
- Missing keys return 401 with explicit message.

#  Error Handling
- Structured error types: validation | api | timeout | rate_limit.  
- Request size limit, JSON parse guard, timeout + retry, clear messages surface to UI.

#  Frontend / UX
- Minimal form, disabled button + loading label.  
- Inline errors show message + type.  
- Sentiment color coding; meta card with provider/model/requestId/timestamp.  
- Optional .txt upload without complicating the flow.

#  File Input Support
Upload a `.txt`; its contents replace textarea input automatically. If no file, uses the textarea.

#  Testing
- Validator: abbreviations, invalid sentiment, wrong keyPoints length, multi-sentence.  
- API route (with mocked LLM): empty input → 400; happy path → structured JSON.  
- Run: `cd server && npm test`.

#  Trade-offs
- Kept UI minimal to focus signal on correctness and safety.  
- In-memory rate limit (per-process); good for demo, not clustered prod.  
- Sentence heuristic vs. heavy NLP lib to stay lightweight.

#  Production Considerations
- Rate limiting in place; add shared store/proxy for multi-instance.  
- Secrets via env/CI, never client.  
- Tune `LLM_TIMEOUT_MS` for latency; add logging/metrics if deploying.  
- Consider auth if exposed publicly.

#  Example Request/Response
Request:
```
POST http://localhost:5000/api/summarize
{ "text": "I liked the build quality but the battery dies after five hours." }
```
Response:
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

#  Self Evaluation
- Evaluated on functionality, prompt design, validation, security, clarity.  
- Estimated score: ~65–70/70.  
- Rationale: strong prompt + validation, secure API handling, clear architecture, minimal but complete solution.

#  Future Improvements
- Batch processing; confidence/quality scoring.  
- File uploads beyond .txt (PDF+OCR).  
- Shared-store rate limiting and richer logging/metrics.  
- CI pipeline file to automate install/test.

#  Setup & Run Instructions
```
cd assignment-summarizer/server && npm install
cd ../client && npm install
# Configure server/.env from server/.env.example
cd ../server && npm start
cd ../client && npm run dev
```
API URL: `VITE_API_URL` (default `http://localhost:5000/api/summarize`).  


#  Troubleshooting
- 401: missing/incorrect API key in `.env`.  
- 400: empty or oversized input.  
- 429: hit rate limit; wait 60s or raise `RATE_LIMIT_MAX`.  
- Timeout: shorten text or increase `LLM_TIMEOUT_MS`.


### Screenshots (Demo )   




<img width="1536" height="1024" alt="ChatGPT Image Mar 20, 2026, 03_54_16 PM" src="https://github.com/user-attachments/assets/a9933c09-9d3c-4d53-a171-a940e7b16ffa" />
<img width="1536" height="1024" alt="ChatGPT Image Mar 20, 2026, 03_53_58 PM" src="https://github.com/user-attachments/assets/8a1898c9-75b0-4607-8426-bf15a2bb4aa8" />
<img width="1536" height="1024" alt="ChatGPT Image Mar 20, 2026, 03_53_43 PM" src="https://github.com/user-attachments/assets/7d8492e2-df1e-4a3a-aefe-28f15e67bfb1" />
<img width="1536" height="1024" alt="ChatGPT Image Mar 20, 2026, 03_53_40 PM" src="https://github.com/user-attachments/assets/ca719189-777e-4683-bf98-698ed6b423e7" />



<img width="1024" height="1536" alt="ChatGPT Image Mar 20, 2026, 03_53_35 PM" src="https://github.com/user-attachments/assets/0466f381-b96a-4c55-b115-5107be612b55" />
