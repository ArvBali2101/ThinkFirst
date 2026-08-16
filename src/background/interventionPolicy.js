export function getInterventionPolicy({ settings, session, hasSources = false, eventName = "" }) {
  const mode = normalizeMode(settings?.mode);
  if (!settings || mode === "quick") {
    return suppressAll();
  }

  const level = settings.intensity || "standard";
  const researchMode = mode === "research";
  const commitment = Boolean(settings.commitmentMode);
  return {
    attempt: Boolean(settings.attemptEnabled && !session?.attemptEligible && !session?.attemptCompleted && (!session?.attemptSkipped || commitment)),
    evaluate: Boolean(settings.evaluateEnabled && session?.attemptCompleted && !session?.evaluationCompleted && eventName === "assistant_complete"),
    verify: Boolean(settings.verifyEnabled && (hasSources || researchMode) && !session?.verificationCompleted && !session?.verificationSkipped),
    reflect: Boolean(settings.reflectEnabled && !session?.reflectionEligible && !session?.reflectionCompleted && !session?.reflectionSkipped && reflectionAllowed(level, session)),
    commitment,
    mode,
    level
  };
}

function reflectionAllowed(level, session) {
  if (level === "light") {
    return Boolean(session?.evaluationCompleted || session?.verificationCompleted || session?.immediateCopyDetected);
  }
  return true;
}

function suppressAll() {
  return {
    attempt: false,
    evaluate: false,
    verify: false,
    reflect: false,
    level: "off"
  };
}

export function normalizeMode(mode) {
  if (mode === "learning") return "learn";
  if (["quick", "learn", "research", "create", "school"].includes(mode)) return mode;
  return "quick";
}

export function shouldEscalateFriction(recentSessions = []) {
  const last5 = recentSessions.slice(-5);
  if (last5.length < 3) return "gentle";
  const attempts = last5.filter((session) => session.attemptEligible).length || 1;
  const reflections = last5.filter((session) => session.reflectionEligible).length || 1;
  const attemptSkipRate = last5.filter((session) => session.attemptSkipped).length / attempts;
  const copyRate = last5.filter((session) => session.immediateCopyDetected).length / last5.length;
  const reflectionSkipRate = last5.filter((session) => session.reflectionSkipped).length / reflections;
  if (attemptSkipRate > 0.6 && copyRate > 0.5 && reflectionSkipRate > 0.6) {
    return "prompted";
  }
  return "gentle";
}

export function getAdaptiveLevel(recentSessions = [], settings = {}) {
  if (settings.intensity === "light") return "gentle";
  if (settings.commitmentMode) return "checkpoint";
  const last5 = recentSessions.slice(-5);
  if (last5.length < 2) return "gentle";
  const lowEngagement = last5.filter((session) => session.lowEngagementEpisode).length;
  const active = last5.filter((session) =>
    session.attemptCompleted &&
    (session.evaluationCompleted || session.verificationCompleted || session.reflectionCompleted)
  ).length;
  if (active >= Math.min(3, last5.length) && settings.intensity !== "strong") return "invisible";
  if (lowEngagement >= 2 || settings.intensity === "strong") return "guided";
  return shouldEscalateFriction(last5);
}

export function choosePostResponseIntervention({
  mode = "learn",
  sourcePresent = false,
  promptCount = 1,
  evaluateShown = false,
  verifyShown = false,
  schoolCheckShown = false,
  retrieveSuggested = false,
  settings = {}
} = {}) {
  const normalizedMode = normalizeMode(mode);
  const researchLike = normalizedMode === "research" || Boolean(sourcePresent);
  if (normalizedMode === "quick") {
    return decision("post_response", "", "quick_mode", promptCount);
  }
  if (researchLike && settings.verifyEnabled !== false && !verifyShown) {
    return decision("post_response", "verify", normalizedMode === "research" ? "research_mode" : "sources_visible", promptCount);
  }
  if (normalizedMode === "school" && !schoolCheckShown) {
    return decision("post_response", "school_check", "school_process_check", promptCount);
  }
  if ((normalizedMode === "learn" || normalizedMode === "create") && settings.evaluateEnabled !== false && !evaluateShown) {
    return decision("post_response", "evaluate", normalizedMode === "create" ? "authorship_check" : "first_answer_compare", promptCount);
  }
  if (settings.reflectEnabled !== false && !retrieveSuggested && promptCount >= 3) {
    return decision("later_session", "checkpoint", "retrieval_opportunity", promptCount);
  }
  return decision("post_response", "", "no_prompt_needed", promptCount);
}

function decision(decisionPoint, offeredIntervention, decisionReason, promptCount) {
  return {
    decisionPoint,
    offeredIntervention,
    decisionReason,
    receptivity: decisionPoint === "later_session" ? "after_multiple_exchanges" : "answer_stable",
    bypassCooldown: promptCount <= 1 && Boolean(offeredIntervention)
  };
}
