import { EMPTY_PRIVACY_COUNTERS } from "./constants.js";

export function getPrivacyCounters(state = {}) {
  return {
    ...EMPTY_PRIVACY_COUNTERS,
    localBehaviorEvents: state.events?.length || 0,
    locallyStoredSessions: state.sessions?.length || 0
  };
}

export function sanitizeEventForStorage(event) {
  const allowed = {
    eventId: event.eventId,
    type: event.type,
    sessionId: event.sessionId,
    provider: event.provider,
    timestamp: event.timestamp,
    intervention: event.intervention,
    feedback: event.feedback,
    goalType: event.goalType,
    readiness: event.readiness,
    unfamiliar: event.unfamiliar,
    uncertaintyType: event.uncertaintyType,
    transfer: event.transfer,
    evaluationType: event.evaluationType,
    sourcePresent: event.sourcePresent,
    sourceJudgement: event.sourceJudgement,
    crossCheckCompleted: event.crossCheckCompleted,
    copiedRangeClass: event.copiedRangeClass,
    secondsAfterResponse: event.secondsAfterResponse,
    pauseSeconds: event.pauseSeconds,
    reason: event.reason,
    decisionPoint: event.decisionPoint,
    offeredIntervention: event.offeredIntervention,
    decisionReason: event.decisionReason,
    receptivity: event.receptivity,
    burden: event.burden,
    schoolTaskType: event.schoolTaskType,
    aiUseRule: event.aiUseRule,
    assignmentStage: event.assignmentStage,
    mode: event.mode
  };

  return Object.fromEntries(
    Object.entries(allowed).filter(([, value]) => value !== undefined)
  );
}
