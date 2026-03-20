import test from "node:test";
import assert from "node:assert/strict";
import { validateModelResponse, isOneSentence } from "../src/validate.js";

test("isOneSentence tolerates abbreviations", () => {
  assert.equal(isOneSentence("Met Dr. Smith at 3 p.m. Great visit."), false);
  assert.equal(isOneSentence("Met Dr. Smith at 3 p.m."), true);
});

test("validateModelResponse passes valid payload", () => {
  const payload = {
    summary: "This is one sentence.",
    keyPoints: ["a", "b", "c"],
    sentiment: "neutral"
  };
  const res = validateModelResponse(payload);
  assert.equal(res.ok, true);
});

test("validateModelResponse rejects invalid sentiment", () => {
  const payload = {
    summary: "Only one sentence.",
    keyPoints: ["a", "b", "c"],
    sentiment: "mixed"
  };
  const res = validateModelResponse(payload);
  assert.equal(res.ok, false);
  assert.match(res.error, /sentiment/i);
});

test("validateModelResponse rejects wrong keyPoints length", () => {
  const payload = {
    summary: "Another single sentence.",
    keyPoints: ["a", "b"],
    sentiment: "positive"
  };
  const res = validateModelResponse(payload);
  assert.equal(res.ok, false);
  assert.match(res.error, /exactly 3/i);
});

test("validateModelResponse rejects multi-sentence summary", () => {
  const payload = {
    summary: "Sentence one. Sentence two.",
    keyPoints: ["a", "b", "c"],
    sentiment: "negative"
  };
  const res = validateModelResponse(payload);
  assert.equal(res.ok, false);
  assert.match(res.error, /single sentence/i);
});
