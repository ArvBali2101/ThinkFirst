export const STORAGE_KEYS = {
  settings: "tf_settings",
  state: "tf_state",
  providerStatus: "tf_provider_status"
};

export const PROVIDERS = {
  chatgpt: "chatgpt"
};

export const DEFAULT_SETTINGS = {
  onboardingCompleted: false,
  mode: "quick",
  attemptEnabled: true,
  askEveryPrompt: false,
  evaluateEnabled: true,
  verifyEnabled: true,
  reflectEnabled: true,
  commitmentMode: false,
  schoolCopyBlocker: true,
  automaticInterventionBudget: 3,
  cooldownMinutes: 5,
  cooldownExchanges: 3,
  understandingMode: "local-context",
  verificationLevel: "intermediate",
  promptComplexity: "standard",
  dyslexiaFriendly: false,
  language: "en",
  intensity: "standard",
  historyEnabled: true,
  pausedSites: {}
};

export const EMPTY_STATS = {
  totalLearningSessions: 0,
  schoolSessions: 0,
  attemptEligible: 0,
  attemptCompleted: 0,
  attemptSkipped: 0,
  reflectionEligible: 0,
  reflectionCompleted: 0,
  reflectionSkipped: 0,
  evaluationEligible: 0,
  evaluationCompleted: 0,
  challengeEvents: 0,
  disagreementEvents: 0,
  verificationEligible: 0,
  verificationCompleted: 0,
  sourceJudgementSupported: 0,
  sourceJudgementContradicted: 0,
  sourceJudgementUncertain: 0,
  crossCheckCompleted: 0,
  sourceClicks: 0,
  assistantResponses: 0,
  assistantResponsesWithSources: 0,
  followupSessions: 0,
  assistantCopyEvents: 0,
  largeCopyEvents: 0,
  quickCopyEvents: 0,
  immediateCopySessions: 0,
  firstResponseStopSessions: 0,
  passiveAcceptanceEpisodes: 0,
  lowEngagementEpisodes: 0,
  retrievalCompleted: 0,
  schoolIntegrityChecks: 0,
  schoolIntegrityPauses: 0,
  manualToolsUsed: 0,
  helpfulFeedback: 0,
  notUsefulFeedback: 0,
  interventionsShown: 0,
  interventionsSkipped: 0
};

export const EMPTY_PRIVACY_COUNTERS = {
  promptsStored: 0,
  aiResponsesStored: 0,
  attemptTextStored: 0,
  reflectionTextStored: 0,
  screenshotsStored: 0,
  clipboardContentsStored: 0,
  externalAnalyticsRequests: 0
};

export const MAX_EVENT_LOG = 250;
export const MAX_SESSIONS = 50;
export const RECENT_EVENT_IDS = 500;
