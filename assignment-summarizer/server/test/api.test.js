import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/index.js";

const mockSummary = {
  summary: "This is a summary.",
  keyPoints: ["p1", "p2", "p3"],
  sentiment: "neutral",
  provider: "mock",
  model: "mock-model",
  timestamp: new Date().toISOString(),
  requestId: "test-id"
};

const app = createApp({
  summarize: async (text) => {
    if (!text) throw new Error("No text");
    return mockSummary;
  },
  enableRateLimit: false
});

test("POST /api/summarize rejects empty input", async () => {
  const res = await request(app).post("/api/summarize").send({ text: "" });
  assert.equal(res.status, 400);
  assert.equal(res.body.type, "validation");
});

test("POST /api/summarize returns structured result", async () => {
  const res = await request(app).post("/api/summarize").send({ text: "Hello" });
  assert.equal(res.status, 200);
  assert.equal(res.body.summary, mockSummary.summary);
  assert.equal(res.body.keyPoints.length, 3);
  assert.equal(res.body.sentiment, "neutral");
  assert.ok(res.body.requestId);
});
