import {
  MAX_EVENT_LOG,
  MAX_SESSIONS,
  RECENT_EVENT_IDS
} from "../shared/constants.js";
import { sanitizeEventForStorage } from "../shared/privacy.js";
import { todayKey } from "../shared/utils.js";
import { createEmptyState, normalizeState } from "../storage/schema.js";

export function reduceEvent(currentState, rawEvent) {
  const state = normalizeState(currentState || createEmptyState());
  const event = sanitizeEventForStorage({
    ...rawEvent,
    timestamp: rawEvent.timestamp || Date.now()
  });

  if (!event.eventId || state.recentEventIds.includes(event.eventId)) {
    return state;
  }

  const next = structuredCloneSafe(state);
  next.recentEventIds = [...next.recentEventIds, event.eventId].slice(-RECENT_EVENT_IDS);
  next.events = [...next.events, event].slice(-MAX_EVENT_LOG);

  applyEvent(next, event);
  next.sessions = next.sessions.slice(-MAX_SESSIONS);
  return next;
}

function applyEvent(state, event) {
  const day = getDaily(state, event.timestamp);
  const session = event.sessionId ? getSession(state, event) : null;

  switch (event.type) {
    case "session_started":
      if (!session.startedCounted && event.mode !== "quick") {
        session.startedCounted = true;
        increment(state.stats, "totalLearningSessions");
        increment(day, "learningSessions");
        if (event.mode === "school") {
          increment(state.stats, "schoolSessions");
          increment(day, "schoolSessions");
        }
      }
      break;

    case "attempt_prompt_shown":
      if (session) {
        session.attemptEligible = true;
        session.attemptPromptsShown = (session.attemptPromptsShown || 0) + 1;
        increment(state.stats, "attemptEligible");
        increment(state.stats, "interventionsShown");
        increment(day, "attemptEligible");
        session.interventionsShown = (session.interventionsShown || 0) + 1;
      }
      break;

    case "attempt_completed":
      if (session) {
        session.attemptCompleted = true;
        session.attemptSkipped = false;
        session.attemptCompletions = (session.attemptCompletions || 0) + 1;
        increment(state.stats, "attemptCompleted");
        increment(day, "attemptCompleted");
      }
      break;

    case "attempt_skipped":
      if (session) {
        session.attemptSkipped = true;
        session.attemptSkips = (session.attemptSkips || 0) + 1;
        increment(state.stats, "attemptSkipped");
        increment(state.stats, "interventionsSkipped");
        session.interventionsSkipped = (session.interventionsSkipped || 0) + 1;
      }
      break;

    case "assistant_response_completed":
      if (session) {
        session.assistantCompleted = true;
        session.sourcePresent = Boolean(event.sourcePresent);
        session.assistantResponses = (session.assistantResponses || 0) + 1;
        increment(state.stats, "assistantResponses");
        increment(day, "assistantResponses");
        if (event.sourcePresent) {
          increment(state.stats, "assistantResponsesWithSources");
          increment(day, "assistantResponsesWithSources");
        }
        if (event.sourcePresent && !session.verificationEligible) {
          session.verificationEligible = true;
          increment(state.stats, "verificationEligible");
          increment(day, "verificationEligible");
        }
      }
      break;

    case "evaluation_prompt_shown":
      if (session) {
        session.evaluationEligible = true;
        session.evaluationPromptsShown = (session.evaluationPromptsShown || 0) + 1;
        increment(state.stats, "evaluationEligible");
        increment(state.stats, "interventionsShown");
        increment(day, "evaluationEligible");
        session.interventionsShown = (session.interventionsShown || 0) + 1;
      }
      break;

    case "evaluation_completed":
      if (session) {
        session.evaluationCompleted = true;
        session.evaluationType = event.evaluationType || "unsure";
        session.evaluationCompletions = (session.evaluationCompletions || 0) + 1;
        increment(state.stats, "evaluationCompleted");
        increment(day, "evaluationCompleted");
        if (event.evaluationType === "challenge") increment(state.stats, "challengeEvents");
        if (event.evaluationType === "disagree") increment(state.stats, "disagreementEvents");
      }
      break;

    case "evaluation_skipped":
      if (session) {
        session.evaluationSkipped = true;
        session.evaluationSkips = (session.evaluationSkips || 0) + 1;
        increment(state.stats, "interventionsSkipped");
        session.interventionsSkipped = (session.interventionsSkipped || 0) + 1;
      }
      break;

    case "verify_prompt_shown":
      if (session) {
        session.verifyPromptShown = true;
        session.verifyPromptsShown = (session.verifyPromptsShown || 0) + 1;
        if (!session.verificationEligible) {
          session.verificationEligible = true;
          increment(state.stats, "verificationEligible");
          increment(day, "verificationEligible");
        }
        increment(state.stats, "interventionsShown");
        session.interventionsShown = (session.interventionsShown || 0) + 1;
      }
      break;

    case "verify_prompt_completed":
      if (session) {
        session.verificationCompleted = true;
        session.verificationCompletions = (session.verificationCompletions || 0) + 1;
        session.sourceJudgement = event.sourceJudgement;
        session.crossCheckCompleted = Boolean(event.crossCheckCompleted);
        increment(state.stats, "verificationCompleted");
        increment(day, "verificationCompleted");
        if (event.crossCheckCompleted) {
          increment(state.stats, "crossCheckCompleted");
          increment(day, "crossCheckCompleted");
        }
        if (event.sourceJudgement === "supports") increment(state.stats, "sourceJudgementSupported");
        if (event.sourceJudgement === "contradicts") increment(state.stats, "sourceJudgementContradicted");
        if (event.sourceJudgement === "unclear" || event.sourceJudgement === "uncertain") increment(state.stats, "sourceJudgementUncertain");
      }
      break;

    case "verify_skipped":
      if (session) {
        session.verificationSkipped = true;
        session.verificationSkips = (session.verificationSkips || 0) + 1;
        increment(state.stats, "interventionsSkipped");
        session.interventionsSkipped = (session.interventionsSkipped || 0) + 1;
      }
      break;

    case "reflection_prompt_shown":
      if (session) {
        session.reflectionEligible = true;
        session.reflectionPromptsShown = (session.reflectionPromptsShown || 0) + 1;
        increment(state.stats, "reflectionEligible");
        increment(state.stats, "interventionsShown");
        increment(day, "reflectionEligible");
        session.interventionsShown = (session.interventionsShown || 0) + 1;
      }
      break;

    case "reflection_prompt_completed":
      if (session) {
        session.reflectionCompleted = true;
        session.reflectionSkipped = false;
        session.reflectionCompletions = (session.reflectionCompletions || 0) + 1;
        increment(state.stats, "reflectionCompleted");
        increment(day, "reflectionCompleted");
      }
      break;

    case "reflection_skipped":
      if (session) {
        session.reflectionSkipped = true;
        session.reflectionSkips = (session.reflectionSkips || 0) + 1;
        increment(state.stats, "reflectionSkipped");
        increment(state.stats, "interventionsSkipped");
        session.interventionsSkipped = (session.interventionsSkipped || 0) + 1;
      }
      break;

    case "assistant_copy_detected":
      if (session) {
        session.copyEvents = (session.copyEvents || 0) + 1;
        increment(state.stats, "assistantCopyEvents");
        increment(day, "assistantCopyEvents");
        if (event.copiedRangeClass === "large") {
          session.largeCopyDetected = true;
          increment(state.stats, "largeCopyEvents");
          increment(day, "largeCopyEvents");
        }
        if ((event.secondsAfterResponse || 999) <= 20) {
          session.quickCopyDetected = true;
          increment(state.stats, "quickCopyEvents");
          increment(day, "quickCopyEvents");
        }
        if (!session.immediateCopyDetected) {
          session.immediateCopyDetected = true;
          increment(state.stats, "immediateCopySessions");
          increment(day, "immediateCopySessions");
        }
      }
      break;

    case "source_clicked":
      if (session) {
        session.sourceClicked = true;
        session.sourceClicks = (session.sourceClicks || 0) + 1;
        increment(state.stats, "sourceClicks");
        increment(day, "sourceClicks");
      }
      break;

    case "school_context_set":
      if (session) {
        session.schoolTaskType = event.schoolTaskType;
        session.aiUseRule = event.aiUseRule;
      }
      break;

    case "school_integrity_check_completed":
      if (session) {
        session.schoolIntegrityCheckCompleted = true;
        session.aiUseRule = event.aiUseRule || session.aiUseRule;
        session.assignmentStage = event.assignmentStage;
        increment(state.stats, "schoolIntegrityChecks");
        increment(day, "schoolIntegrityChecks");
      }
      break;

    case "school_integrity_pause_started":
      if (session) {
        session.schoolIntegrityPauseStarted = true;
        session.schoolIntegrityPauseCount = (session.schoolIntegrityPauseCount || 0) + 1;
        session.lastIntegrityPauseReason = event.copiedRangeClass || "copy";
        increment(state.stats, "schoolIntegrityPauses");
        increment(day, "schoolIntegrityPauses");
      }
      break;

    case "school_integrity_pause_cleared":
      if (session) {
        session.schoolIntegrityPauseCleared = true;
        session.schoolIntegrityPauseClearReason = event.reason;
      }
      break;

    case "followup_message_detected":
      if (session && !session.followupDetected) {
        session.followupDetected = true;
        increment(state.stats, "followupSessions");
        increment(day, "followupSessions");
      }
      break;

    case "learning_goal_set":
      if (session) {
        session.goalSet = true;
        session.goalType = event.goalType;
      }
      break;

    case "manual_tool_used":
      if (session) {
        session.manualToolsUsed = (session.manualToolsUsed || 0) + 1;
        increment(state.stats, "manualToolsUsed");
      }
      break;

    case "challenge_completed":
      if (session) {
        session.challengeCompleted = true;
        increment(state.stats, "challengeEvents");
      }
      break;

    case "uncertainty_completed":
      if (session) {
        session.uncertaintyCompleted = true;
        session.uncertaintyType = event.uncertaintyType;
      }
      break;

    case "retrieval_completed":
      if (session) {
        session.retrievalCompleted = true;
        session.transfer = event.transfer;
        increment(state.stats, "retrievalCompleted");
        increment(day, "retrievalCompleted");
      }
      break;

    case "intervention_feedback":
      if (session) {
        session.feedback = session.feedback || {};
        session.feedback[event.intervention || "unknown"] = event.feedback;
        if (event.feedback === "helpful") increment(state.stats, "helpfulFeedback");
        if (event.feedback === "not_useful") increment(state.stats, "notUsefulFeedback");
      }
      break;

    case "session_ended":
      if (session && !session.endedAt) {
        session.endedAt = event.timestamp;
        session.lowEngagementEpisode = isLowEngagement(session);
        session.passiveAcceptanceEpisode = isPassiveAcceptance(session);
        if (!session.followupDetected) {
          increment(state.stats, "firstResponseStopSessions");
          increment(day, "firstResponseStopSessions");
        }
        if (session.passiveAcceptanceEpisode) {
          increment(state.stats, "passiveAcceptanceEpisodes");
          increment(day, "passiveAcceptanceEpisodes");
        }
        if (session.lowEngagementEpisode) {
          increment(state.stats, "lowEngagementEpisodes");
          increment(day, "lowEngagementEpisodes");
        }
      }
      break;

    default:
      break;
  }
}

function getSession(state, event) {
  let session = state.sessions.find((item) => item.sessionId === event.sessionId);
  if (!session) {
    session = {
      sessionId: event.sessionId,
      provider: event.provider || "chatgpt",
      startedAt: event.timestamp,
      mode: event.mode || "learning",
      attemptEligible: false,
      attemptCompleted: false,
      attemptSkipped: false,
      reflectionEligible: false,
      reflectionCompleted: false,
      reflectionSkipped: false,
      evaluationEligible: false,
      evaluationCompleted: false,
      evaluationSkipped: false,
      sourcePresent: false,
      sourceClicked: false,
      verificationEligible: false,
      verificationCompleted: false,
      schoolIntegrityCheckCompleted: false,
      immediateCopyDetected: false,
      followupDetected: false,
      interventionsShown: 0,
      interventionsSkipped: 0
    };
    state.sessions.push(session);
  }
  return session;
}

function getDaily(state, timestamp) {
  const key = todayKey(timestamp);
  if (!state.daily[key]) {
    state.daily[key] = {
      date: key,
      learningSessions: 0,
      attemptEligible: 0,
      attemptCompleted: 0,
      reflectionEligible: 0,
      reflectionCompleted: 0,
      evaluationEligible: 0,
      evaluationCompleted: 0,
      verificationEligible: 0,
      verificationCompleted: 0,
      followupSessions: 0,
      assistantResponses: 0,
      assistantResponsesWithSources: 0,
      sourceClicks: 0,
      assistantCopyEvents: 0,
      largeCopyEvents: 0,
      quickCopyEvents: 0,
      immediateCopySessions: 0,
      crossCheckCompleted: 0,
      firstResponseStopSessions: 0,
      lowEngagementEpisodes: 0,
      passiveAcceptanceEpisodes: 0,
      retrievalCompleted: 0,
      schoolSessions: 0,
      schoolIntegrityChecks: 0
    };
  }
  return state.daily[key];
}

function increment(target, key) {
  target[key] = (target[key] || 0) + 1;
}

function isLowEngagement(session) {
  const misses = [
    session.attemptSkipped,
    !session.followupDetected,
    session.immediateCopyDetected,
    session.sourcePresent && !session.verificationCompleted,
    session.reflectionSkipped
  ].filter(Boolean).length;
  return misses >= 3;
}

function isPassiveAcceptance(session) {
  return Boolean(
    session.assistantCompleted &&
    !session.followupDetected &&
    !session.evaluationCompleted &&
    !session.verificationCompleted &&
    !session.reflectionCompleted &&
    !session.retrievalCompleted &&
    !session.sourceClicked
  );
}

function structuredCloneSafe(value) {
  if (globalThis.structuredClone) return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}
