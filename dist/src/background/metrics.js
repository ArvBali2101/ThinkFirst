import { clampPercent, todayKey } from "../shared/utils.js";

export function calculateMetrics(stats = {}) {
  return {
    attemptRate: clampPercent(stats.attemptCompleted || 0, stats.attemptEligible || 0),
    independentStartFrequency: clampPercent(stats.attemptCompleted || 0, stats.totalLearningSessions || 0),
    compareRate: clampPercent(stats.evaluationCompleted || 0, stats.evaluationEligible || 0),
    challengeRate: clampPercent((stats.challengeEvents || 0) + (stats.disagreementEvents || 0), stats.evaluationCompleted || 0),
    reflectionRate: clampPercent(stats.reflectionCompleted || 0, stats.reflectionEligible || 0),
    verificationActivity: clampPercent(stats.verificationCompleted || 0, stats.verificationEligible || 0),
    independentCrossCheckRate: clampPercent(stats.crossCheckCompleted || 0, stats.verificationEligible || 0),
    sourceInspectionRate: clampPercent(stats.sourceClicks || 0, stats.assistantResponsesWithSources || 0),
    followupExploration: clampPercent(stats.followupSessions || 0, stats.totalLearningSessions || 0),
    assistantCopyEventRate: clampPercent(stats.assistantCopyEvents || 0, stats.assistantResponses || 0),
    quickCopyRate: clampPercent(stats.quickCopyEvents || 0, stats.assistantCopyEvents || 0),
    largeCopyRate: clampPercent(stats.largeCopyEvents || 0, stats.assistantCopyEvents || 0),
    immediateCopyRate: clampPercent(stats.immediateCopySessions || 0, stats.totalLearningSessions || 0),
    firstResponseStoppingRate: clampPercent(stats.firstResponseStopSessions || 0, stats.totalLearningSessions || 0),
    passiveAcceptanceRate: clampPercent(stats.passiveAcceptanceEpisodes || 0, stats.totalLearningSessions || 0),
    schoolProcessCheckRate: clampPercent(stats.schoolIntegrityChecks || 0, stats.schoolSessions || 0),
    lowEngagementEpisodeRate: clampPercent(stats.lowEngagementEpisodes || 0, stats.totalLearningSessions || 0),
    interventionSkipRate: clampPercent(stats.interventionsSkipped || 0, stats.interventionsShown || 0)
  };
}

export function calculateDailySeries(daily = {}, days = 14, now = Date.now()) {
  const rows = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - index);
    const key = todayKey(date.getTime());
    const row = daily[key] || {};
    rows.push({
      date: key,
      attemptRate: clampPercent(row.attemptCompleted || 0, row.attemptEligible || 0),
      compareRate: clampPercent(row.evaluationCompleted || 0, row.evaluationEligible || 0),
      reflectionRate: clampPercent(row.reflectionCompleted || 0, row.reflectionEligible || 0),
      verificationActivity: clampPercent(row.verificationCompleted || 0, row.verificationEligible || 0),
      sourceInspectionRate: clampPercent(row.sourceClicks || 0, row.assistantResponsesWithSources || 0),
      passiveAcceptanceRate: clampPercent(row.passiveAcceptanceEpisodes || 0, row.learningSessions || 0)
    });
  }
  return rows;
}

export function generateInsights(stats = {}, sessions = []) {
  const metrics = calculateMetrics(stats);
  const insights = [];
  if ((stats.totalLearningSessions || 0) === 0) {
    return [
      "Start a Learning, Research, or Create session to see private habit feedback here.",
      "ThinkFirst measures observable interaction patterns, not ability, intelligence, or final learning."
    ];
  }

  if (metrics.attemptRate >= 70 && metrics.verificationActivity < 40) {
    insights.push("You often generate first, which protects agency. For factual or research tasks, add one Claim -> Source -> Cross-check loop so independence is paired with evidence.");
  }
  if (metrics.verificationActivity >= 70 && metrics.reflectionRate < 40) {
    insights.push("You are checking evidence well. A short no-looking-back reflection turns that checked answer into something you can retrieve later.");
  }
  if (metrics.immediateCopyRate > 50) {
    insights.push("Immediate copying is frequent. That can be efficient, but when it appears without Evaluate, Verify, or Reflect it can signal cognitive offloading risk.");
  }
  if (metrics.sourceInspectionRate < 35 && (stats.assistantResponsesWithSources || 0) >= 2) {
    insights.push("AI answers included sources, but source-link inspection is low. For school or research, open at least one source and check whether it actually supports the claim.");
  }
  if (metrics.quickCopyRate > 60 && metrics.assistantCopyEventRate > 30) {
    insights.push("Many AI-answer copies happen quickly. That is not misuse by itself, but in assignments it is a cue to pause for policy, authorship, and source checks.");
  }
  if (metrics.passiveAcceptanceRate > 50) {
    insights.push("Several sessions ended without a visible checking move. For important work, add one Compare, Verify, or Reflect action before moving on.");
  }
  if ((stats.schoolSessions || 0) > 0 && metrics.schoolProcessCheckRate < 50) {
    insights.push("School Mode is active, but process checks are low. Use School Check to mark allowed AI use, assignment stage, and what remains your own work.");
  }
  if (metrics.firstResponseStoppingRate > 60 && metrics.followupExploration < 35) {
    insights.push("Many sessions stop at the first answer. For learning or high-stakes work, one follow-up can reveal assumptions, missing evidence, or a better explanation.");
  }
  if (metrics.interventionSkipRate > 60) {
    insights.push("You often skip prompts. This is mostly a fit signal for ThinkFirst: use Light frequency, then choose stronger Commitment Mode only when you want it.");
  }
  if (metrics.challengeRate > 25) {
    insights.push("You are challenging AI answers. That is strongest when the challenge leads to a follow-up, source check, counterexample, or revision.");
  }
  if (!insights.length) {
    insights.push("Your recent pattern includes the key learning moves: generating, evaluating, verifying when relevant, and retrieving. Keep watching the trend, not one day.");
  }

  const last = sessions.at(-1);
  if (last?.lowEngagementEpisode) {
    insights.push("The last session matched a local low-engagement pattern. This is not a score; it only helps ThinkFirst choose gentler or stronger prompts.");
  }
  return insights.slice(0, 4);
}
