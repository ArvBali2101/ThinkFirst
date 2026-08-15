import test from "node:test";
import assert from "node:assert/strict";
import { calculateDailySeries, calculateMetrics } from "../src/background/metrics.js";

test("metrics calculate all ratios and avoid divide-by-zero", () => {
  assert.deepEqual(calculateMetrics({}), {
    attemptRate: 0,
    independentStartFrequency: 0,
    compareRate: 0,
    challengeRate: 0,
    reflectionRate: 0,
    verificationActivity: 0,
    independentCrossCheckRate: 0,
    sourceInspectionRate: 0,
    followupExploration: 0,
    assistantCopyEventRate: 0,
    quickCopyRate: 0,
    largeCopyRate: 0,
    immediateCopyRate: 0,
    firstResponseStoppingRate: 0,
    passiveAcceptanceRate: 0,
    schoolProcessCheckRate: 0,
    lowEngagementEpisodeRate: 0,
    interventionSkipRate: 0
  });

  assert.deepEqual(calculateMetrics({
    attemptCompleted: 3,
    attemptEligible: 4,
    evaluationCompleted: 2,
    evaluationEligible: 4,
    challengeEvents: 1,
    reflectionCompleted: 1,
    reflectionEligible: 2,
    verificationCompleted: 2,
    verificationEligible: 4,
    crossCheckCompleted: 1,
    sourceClicks: 1,
    assistantResponses: 5,
    assistantResponsesWithSources: 2,
    followupSessions: 1,
    totalLearningSessions: 5,
    schoolSessions: 2,
    schoolIntegrityChecks: 1,
    assistantCopyEvents: 4,
    quickCopyEvents: 2,
    largeCopyEvents: 1,
    immediateCopySessions: 2,
    firstResponseStopSessions: 3,
    passiveAcceptanceEpisodes: 2,
    lowEngagementEpisodes: 1,
    interventionsSkipped: 3,
    interventionsShown: 6
  }), {
    attemptRate: 75,
    independentStartFrequency: 60,
    compareRate: 50,
    challengeRate: 50,
    reflectionRate: 50,
    verificationActivity: 50,
    independentCrossCheckRate: 25,
    sourceInspectionRate: 50,
    followupExploration: 20,
    assistantCopyEventRate: 80,
    quickCopyRate: 50,
    largeCopyRate: 25,
    immediateCopyRate: 40,
    firstResponseStoppingRate: 60,
    passiveAcceptanceRate: 40,
    schoolProcessCheckRate: 50,
    lowEngagementEpisodeRate: 20,
    interventionSkipRate: 50
  });
});

test("daily series returns requested number of rows", () => {
  const rows = calculateDailySeries({}, 7, Date.parse("2026-08-12T00:00:00.000Z"));
  assert.equal(rows.length, 7);
  assert.equal(rows.at(-1).date, "2026-08-12");
});

test("metrics clamp percentages at 100 under repeated exercise events", () => {
  const metrics = calculateMetrics({
    attemptCompleted: 12,
    attemptEligible: 3,
    verificationCompleted: 9,
    verificationEligible: 2,
    crossCheckCompleted: 7,
    totalLearningSessions: 2
  });
  assert.equal(metrics.attemptRate, 100);
  assert.equal(metrics.independentStartFrequency, 100);
  assert.equal(metrics.verificationActivity, 100);
  assert.equal(metrics.independentCrossCheckRate, 100);
});
