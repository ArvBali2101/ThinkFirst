import test from "node:test";
import assert from "node:assert/strict";
import { reduceEvent } from "../src/background/eventReducer.js";
import { calculateMetrics } from "../src/background/metrics.js";
import { sanitizeEventForStorage } from "../src/shared/privacy.js";
import { createEmptyState } from "../src/storage/schema.js";
import { MAX_EVENT_LOG, MAX_SESSIONS, RECENT_EVENT_IDS } from "../src/shared/constants.js";

function makeEvent(type, index, sessionIndex = 0, extra = {}) {
  return {
    eventId: `${type}-${sessionIndex}-${index}`,
    type,
    sessionId: `stress-session-${sessionIndex}`,
    provider: "chatgpt",
    mode: "learn",
    timestamp: Date.parse("2026-08-13T00:00:00.000Z") + index * 1000,
    ...extra
  };
}

test("stress: high-volume sessions stay capped and metrics remain finite", () => {
  let state = createEmptyState();
  for (let session = 0; session < 80; session += 1) {
    state = reduceEvent(state, makeEvent("session_started", 0, session));
    for (let round = 1; round <= 8; round += 1) {
      state = reduceEvent(state, makeEvent("attempt_prompt_shown", round * 10, session));
      if (round % 3 === 0) {
        state = reduceEvent(state, makeEvent("attempt_skipped", round * 10 + 1, session));
      } else {
        state = reduceEvent(state, makeEvent("attempt_completed", round * 10 + 1, session));
      }
      state = reduceEvent(state, makeEvent("assistant_response_completed", round * 10 + 2, session, { sourcePresent: round % 2 === 0 }));
      state = reduceEvent(state, makeEvent("evaluation_prompt_shown", round * 10 + 3, session));
      state = reduceEvent(state, makeEvent("evaluation_completed", round * 10 + 4, session, { evaluationType: round % 2 === 0 ? "challenge" : "confirmed" }));
      if (round % 2 === 0) {
        state = reduceEvent(state, makeEvent("verify_prompt_shown", round * 10 + 5, session));
        state = reduceEvent(state, makeEvent("verify_prompt_completed", round * 10 + 6, session, { sourceJudgement: "supports", crossCheckCompleted: true }));
      }
      if (round === 8) {
        state = reduceEvent(state, makeEvent("retrieval_completed", round * 10 + 7, session, { transfer: "probably" }));
        state = reduceEvent(state, makeEvent("session_ended", round * 10 + 8, session));
      }
    }
  }

  assert.equal(state.sessions.length, MAX_SESSIONS);
  assert.equal(state.events.length, MAX_EVENT_LOG);
  assert.equal(state.recentEventIds.length, RECENT_EVENT_IDS);
  assert.equal(state.stats.totalLearningSessions, 80);
  assert.equal(state.stats.attemptEligible, 640);
  assert.equal(state.stats.verificationCompleted, 320);

  const metrics = calculateMetrics(state.stats);
  for (const value of Object.values(metrics)) {
    assert.equal(Number.isFinite(value), true);
    assert.equal(value >= 0 && value <= 100, true);
  }
});

test("stress: duplicate event IDs do not double count under load", () => {
  let state = createEmptyState();
  const duplicate = makeEvent("attempt_prompt_shown", 1, 1, { eventId: "same-id" });
  for (let index = 0; index < 100; index += 1) {
    state = reduceEvent(state, duplicate);
  }
  assert.equal(state.stats.attemptEligible, 1);
  assert.equal(state.events.length, 1);
});

test("privacy: sanitizer drops forbidden content while keeping allowed metadata", () => {
  const event = sanitizeEventForStorage({
    eventId: "privacy-1",
    type: "attempt_completed",
    sessionId: "s1",
    provider: "chatgpt",
    timestamp: 1,
    promptText: "do not store",
    responseText: "do not store",
    attemptText: "do not store",
    reflectionText: "do not store",
    clipboardText: "do not store",
    url: "https://example.com/private",
    html: "<main>private</main>",
    screenshot: "bytes",
    readiness: "partial",
    goalType: "understand"
  });

  assert.equal(event.promptText, undefined);
  assert.equal(event.responseText, undefined);
  assert.equal(event.attemptText, undefined);
  assert.equal(event.reflectionText, undefined);
  assert.equal(event.clipboardText, undefined);
  assert.equal(event.url, undefined);
  assert.equal(event.html, undefined);
  assert.equal(event.screenshot, undefined);
  assert.equal(event.readiness, "partial");
  assert.equal(event.goalType, "understand");
});
