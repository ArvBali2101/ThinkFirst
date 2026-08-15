import test from "node:test";
import assert from "node:assert/strict";
import { reduceEvent } from "../src/background/eventReducer.js";
import { createEmptyState } from "../src/storage/schema.js";

function event(type, extra = {}) {
  return {
    eventId: `${type}-${extra.eventId || Math.random()}`,
    type,
    sessionId: "session-1",
    provider: "chatgpt",
    mode: "learning",
    timestamp: Date.parse("2026-08-12T00:00:00.000Z"),
    ...extra
  };
}

test("attempts increment correctly and duplicate events are ignored", () => {
  let state = createEmptyState();
  const shown = event("attempt_prompt_shown", { eventId: "shown" });
  const completed = event("attempt_completed", { eventId: "completed" });

  state = reduceEvent(state, event("session_started", { eventId: "started" }));
  state = reduceEvent(state, shown);
  state = reduceEvent(state, shown);
  state = reduceEvent(state, completed);
  state = reduceEvent(state, completed);

  assert.equal(state.stats.totalLearningSessions, 1);
  assert.equal(state.stats.attemptEligible, 1);
  assert.equal(state.stats.attemptCompleted, 1);
  assert.equal(state.stats.interventionsShown, 1);
});

test("reflection and skipped prompts increment correctly", () => {
  let state = createEmptyState();
  state = reduceEvent(state, event("session_started", { eventId: "started" }));
  state = reduceEvent(state, event("reflection_prompt_shown", { eventId: "reflect-shown" }));
  state = reduceEvent(state, event("reflection_skipped", { eventId: "reflect-skip" }));

  assert.equal(state.stats.reflectionEligible, 1);
  assert.equal(state.stats.reflectionSkipped, 1);
  assert.equal(state.stats.interventionsSkipped, 1);
});

test("session close stamps end time and low-engagement heuristic", () => {
  let state = createEmptyState();
  state = reduceEvent(state, event("session_started", { eventId: "started" }));
  state = reduceEvent(state, event("attempt_prompt_shown", { eventId: "shown" }));
  state = reduceEvent(state, event("attempt_skipped", { eventId: "attempt-skip" }));
  state = reduceEvent(state, event("assistant_response_completed", { eventId: "assistant", sourcePresent: true }));
  state = reduceEvent(state, event("reflection_prompt_shown", { eventId: "reflect-shown" }));
  state = reduceEvent(state, event("reflection_skipped", { eventId: "reflect-skip" }));
  state = reduceEvent(state, event("session_ended", { eventId: "ended" }));

  assert.ok(state.sessions[0].endedAt);
  assert.equal(state.sessions[0].lowEngagementEpisode, true);
});

test("source visits, copy events, and passive acceptance are measured without content", () => {
  let state = createEmptyState();
  state = reduceEvent(state, event("session_started", { eventId: "started" }));
  state = reduceEvent(state, event("assistant_response_completed", { eventId: "assistant", sourcePresent: true }));
  state = reduceEvent(state, event("source_clicked", { eventId: "source" }));
  state = reduceEvent(state, event("assistant_copy_detected", {
    eventId: "copy",
    copiedRangeClass: "large",
    secondsAfterResponse: 8,
    clipboardText: "should be dropped"
  }));
  state = reduceEvent(state, event("session_ended", { eventId: "ended" }));

  assert.equal(state.stats.assistantResponses, 1);
  assert.equal(state.stats.assistantResponsesWithSources, 1);
  assert.equal(state.stats.sourceClicks, 1);
  assert.equal(state.stats.assistantCopyEvents, 1);
  assert.equal(state.stats.largeCopyEvents, 1);
  assert.equal(state.stats.quickCopyEvents, 1);
  assert.equal(state.stats.passiveAcceptanceEpisodes, 0);
  assert.equal("clipboardText" in state.events.at(-2), false);
});

test("school mode records process checks as categories only", () => {
  let state = createEmptyState();
  state = reduceEvent(state, event("session_started", { eventId: "started", mode: "school" }));
  state = reduceEvent(state, event("school_context_set", {
    eventId: "context",
    mode: "school",
    schoolTaskType: "assignment",
    aiUseRule: "limited",
    promptText: "should be dropped"
  }));
  state = reduceEvent(state, event("school_integrity_check_completed", {
    eventId: "check",
    mode: "school",
    aiUseRule: "limited",
    assignmentStage: "revision",
    reflectionText: "should be dropped"
  }));

  assert.equal(state.stats.schoolSessions, 1);
  assert.equal(state.stats.schoolIntegrityChecks, 1);
  assert.equal(state.sessions[0].schoolTaskType, "assignment");
  assert.equal(state.sessions[0].assignmentStage, "revision");
  assert.equal("promptText" in state.events.at(-2), false);
  assert.equal("reflectionText" in state.events.at(-1), false);
});
