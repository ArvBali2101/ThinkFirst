import test from "node:test";
import assert from "node:assert/strict";
import { choosePostResponseIntervention, getInterventionPolicy } from "../src/background/interventionPolicy.js";

const learning = {
  mode: "learning",
  attemptEnabled: true,
  evaluateEnabled: true,
  verifyEnabled: true,
  reflectEnabled: true,
  intensity: "standard"
};

test("Quick Mode suppresses all interventions", () => {
  const policy = getInterventionPolicy({
    settings: { ...learning, mode: "quick" },
    session: {},
    hasSources: true,
    eventName: "assistant_complete"
  });
  assert.equal(policy.attempt, false);
  assert.equal(policy.evaluate, false);
  assert.equal(policy.verify, false);
  assert.equal(policy.reflect, false);
});

test("Learning Mode enables eligible interventions", () => {
  const policy = getInterventionPolicy({
    settings: learning,
    session: { attemptCompleted: true },
    hasSources: true,
    eventName: "assistant_complete"
  });
  assert.equal(policy.evaluate, true);
  assert.equal(policy.verify, true);
  assert.equal(policy.reflect, true);
});

test("Attempt and reflection happen max once per session", () => {
  const policy = getInterventionPolicy({
    settings: learning,
    session: {
      attemptEligible: true,
      reflectionEligible: true,
      attemptCompleted: false,
      reflectionCompleted: false
    }
  });
  assert.equal(policy.attempt, false);
  assert.equal(policy.reflect, false);
});

test("Verify only appears when eligible", () => {
  const withoutSources = getInterventionPolicy({ settings: learning, session: {}, hasSources: false });
  const withSources = getInterventionPolicy({ settings: learning, session: {}, hasSources: true });
  assert.equal(withoutSources.verify, false);
  assert.equal(withSources.verify, true);
});

test("Light frequency limits optional reflection", () => {
  const policy = getInterventionPolicy({
    settings: { ...learning, intensity: "light" },
    session: { attemptCompleted: true },
    eventName: "assistant_complete"
  });
  assert.equal(policy.reflect, false);
});

test("post-response policy prioritizes verification for research or sourced answers", () => {
  const research = choosePostResponseIntervention({
    mode: "research",
    promptCount: 1,
    settings: learning
  });
  assert.equal(research.offeredIntervention, "verify");
  assert.equal(research.decisionReason, "research_mode");
  assert.equal(research.bypassCooldown, true);

  const sourced = choosePostResponseIntervention({
    mode: "learn",
    sourcePresent: true,
    promptCount: 2,
    settings: learning
  });
  assert.equal(sourced.offeredIntervention, "verify");
  assert.equal(sourced.decisionReason, "sources_visible");
});

test("post-response policy evaluates first learn/create answer and retrieves later", () => {
  const learn = choosePostResponseIntervention({
    mode: "learn",
    promptCount: 1,
    settings: learning
  });
  assert.equal(learn.offeredIntervention, "evaluate");
  assert.equal(learn.decisionReason, "first_answer_compare");

  const later = choosePostResponseIntervention({
    mode: "learn",
    promptCount: 3,
    evaluateShown: true,
    verifyShown: true,
    settings: learning
  });
  assert.equal(later.offeredIntervention, "checkpoint");
  assert.equal(later.decisionReason, "retrieval_opportunity");
});

test("post-response policy offers school process check in School Mode", () => {
  const school = choosePostResponseIntervention({
    mode: "school",
    promptCount: 1,
    settings: learning
  });
  assert.equal(school.offeredIntervention, "school_check");
  assert.equal(school.decisionReason, "school_process_check");
});
