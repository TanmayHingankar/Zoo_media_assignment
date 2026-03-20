import dotenv from "dotenv";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { randomUUID } from "crypto";
import { buildPrompt } from "./prompt.js";
import { validateModelResponse } from "./validate.js";

dotenv.config();

const provider = (process.env.LLM_PROVIDER || "openai").toLowerCase();
const openaiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
const geminiModelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 10000);

const openaiKey = process.env.OPENAI_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY;
const openaiClient = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
const geminiClient = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;

const createError = (message, type = "api", status = 500) => {
  const err = new Error(message);
  err.type = type;
  err.status = status;
  return err;
};

function ensureClient() {
  if (provider === "gemini" && !geminiClient) {
    throw createError("GEMINI_API_KEY missing. Set it in server/.env", "api", 401);
  }
  if (provider !== "gemini" && !openaiClient) {
    throw createError("OPENAI_API_KEY missing. Set it in server/.env", "api", 401);
  }
}

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(createError(`LLM request timed out after ${ms}ms`, "timeout", 500)), ms);
    })
  ]).finally(() => clearTimeout(timer));
}

async function callOpenAI(prompt) {
  const completion = await withTimeout(
    openaiClient.chat.completions.create({
      model: openaiModel,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You convert unstructured text into strict JSON following the provided schema."
        },
        { role: "user", content: prompt }
      ]
    }),
    TIMEOUT_MS
  );

  const content = completion?.choices?.[0]?.message?.content;
  if (!content) {
    throw createError("Empty response from OpenAI model.");
  }
  return content;
}

async function callGemini(prompt) {
  const model = geminiClient.getGenerativeModel({ model: geminiModelName });
  const result = await withTimeout(
    model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json"
      }
    }),
    TIMEOUT_MS
  );

  const content = result?.response?.text();
  if (!content) {
    throw createError("Empty response from Gemini model.");
  }
  return content;
}

async function runLLM(prompt) {
  if (provider === "gemini") {
    return callGemini(prompt);
  }
  return callOpenAI(prompt);
}

export async function summarizeWithLLM(text) {
  ensureClient();
  const prompt = buildPrompt(text);
  const requestId = randomUUID();

  const attempt = async () => {
    const raw = await runLLM(prompt);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw createError("Model returned non-JSON response.");
    }

    const validated = validateModelResponse(parsed);
    if (!validated.ok) {
      throw createError(validated.error);
    }

    return {
      ...validated.value,
      provider,
      model: provider === "gemini" ? geminiModelName : openaiModel,
      timestamp: new Date().toISOString(),
      requestId
    };
  };

  let lastError;
  for (let i = 0; i < 2; i += 1) {
    try {
      return await attempt();
    } catch (err) {
      lastError = err;
      const nonRetryable = err.status === 401 || err.type === "validation";
      if (nonRetryable || i === 1) break;
    }
  }

  throw lastError || createError("Summarization failed. Please try again.");
}
