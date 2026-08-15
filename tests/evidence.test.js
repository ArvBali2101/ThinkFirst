import test from "node:test";
import assert from "node:assert/strict";
import {
  EVIDENCE_LENSES,
  MEASUREMENT_MODEL,
  METRIC_KEYS,
  PROMPTING_MODEL,
  RESEARCH_SOURCES
} from "../src/shared/evidence.js";

test("every dashboard metric has a real-world evidence lens", () => {
  for (const key of METRIC_KEYS) {
    const lens = EVIDENCE_LENSES[key];
    assert.ok(lens, `${key} is missing`);
    assert.ok(lens.mechanism.length > 4);
    assert.ok(lens.realWorldSignal.length > 40);
    assert.ok(lens.doesNotMean.length > 20);
    assert.ok(lens.nextAction.length > 20);
    assert.ok(lens.evidenceTag.length > 10);
  }
});

test("evidence copy avoids diagnosis and fake score framing", () => {
  const banned = /\b(diagnos|intelligence score|critical-thinking score|brain score|prove intelligence)\b/i;
  const text = JSON.stringify(EVIDENCE_LENSES);
  assert.equal(banned.test(text), false);
});

test("research sources are available for dashboard citation", () => {
  assert.ok(RESEARCH_SOURCES.length >= 6);
  for (const source of RESEARCH_SOURCES) {
    assert.match(source.url, /^https:\/\//);
    assert.ok(source.name.length > 8);
    assert.ok(source.use.length > 20);
  }
});

test("measurement model explains numerator, denominator, trigger, privacy, and limits", () => {
  for (const key of METRIC_KEYS) {
    const model = MEASUREMENT_MODEL[key];
    assert.ok(model, `${key} measurement model is missing`);
    assert.ok(model.numerator.length > 3);
    assert.ok(model.denominator.length > 3);
    assert.ok(model.whenMeasured.length > 20);
    assert.ok(model.eventTrigger.length > 20);
    assert.ok(model.privacyBoundary.length > 20);
    assert.ok(model.limitation.length > 20);
  }
});

test("prompting model has decision points and burden rules", () => {
  assert.ok(PROMPTING_MODEL.length >= 4);
  for (const rule of PROMPTING_MODEL) {
    assert.ok(rule.decisionPoint.length > 5);
    assert.ok(rule.trigger.length > 20);
    assert.ok(rule.intervention.length > 5);
    assert.ok(rule.reason.length > 20);
    assert.ok(rule.burdenRule.length > 20);
  }
});
