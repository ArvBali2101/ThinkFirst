import { reduceEvent } from "./eventReducer.js";
import { getAdaptiveLevel } from "./interventionPolicy.js";
import { calculateDailySeries, calculateMetrics, generateInsights } from "./metrics.js";
import { getPrivacyCounters } from "../shared/privacy.js";
import { STORAGE_KEYS } from "../shared/constants.js";
import {
  clearThinkFirstData,
  getProviderStatus,
  getExamGuard,
  getSchoolGuard,
  getSettings,
  getState,
  setExamGuard,
  setSchoolGuard,
  setProviderStatus,
  setSettings,
  setState,
  updateExamGuard,
  updateSchoolGuard,
  updateSettings
} from "../storage/localStore.js";

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  const settings = await getSettings();
  if (!settings.onboardingCompleted && reason === "install") {
    await chrome.tabs.create({
      url: chrome.runtime.getURL("src/onboarding/onboarding.html")
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error("ThinkFirst message error", error);
      sendResponse({ ok: false, error: error.message });
    });
  return true;
});

async function handleMessage(message, sender) {
  switch (message?.type) {
    case "GET_SNAPSHOT":
      return snapshot();

    case "UPDATE_SETTINGS": {
      const settings = await updateSettings((current) => ({
        ...current,
        ...(message.patch || {})
      }));
      return { ok: true, settings };
    }

    case "SET_SETTINGS":
      await setSettings(message.settings || {});
      return { ok: true, settings: await getSettings() };

    case "RECORD_EVENT":
      assertMetadataOnly(message.event);
      return recordEvent(message.event);

    case "GET_EXAM_GUARD":
      return { ok: true, examGuard: await getExamGuard() };

    case "ACTIVATE_EXAM_GUARD":
      return activateExamGuard(message.detail || {}, sender);

    case "RECORD_EXAM_GUARD":
      return recordExamGuard(message.counter);

    case "CLEAR_EXAM_GUARD":
      await setExamGuard({ active: false, endedAt: Date.now(), counters: {} });
      return { ok: true, examGuard: await getExamGuard() };

    case "GET_SCHOOL_GUARD":
      return { ok: true, schoolGuard: await getSchoolGuard() };

    case "ACTIVATE_SCHOOL_GUARD":
      return activateSchoolGuard(message.detail || {}, sender);

    case "CLEAR_SCHOOL_GUARD":
      await setSchoolGuard({ active: false, endedAt: Date.now() });
      return { ok: true, schoolGuard: await getSchoolGuard() };

    case "PROVIDER_STATUS":
      await setProviderStatus({
        provider: message.provider || "chatgpt",
        detected: Boolean(message.detected),
        host: safeHostname(sender?.url)
      });
      return { ok: true };

    case "CLEAR_DATA":
      await clearThinkFirstData();
      return { ok: true, state: await getState() };

    case "EXPORT_AGGREGATES": {
      const state = await getState();
      return {
        ok: true,
        export: {
          exportedAt: new Date().toISOString(),
          stats: state.stats,
          daily: state.daily,
          sessions: state.sessions.map(stripSessionForExport)
        }
      };
    }

    case "OPEN_DASHBOARD":
      await chrome.tabs.create({
        url: chrome.runtime.getURL("src/dashboard/dashboard.html")
      });
      return { ok: true };

    case "OPEN_SETTINGS":
      await chrome.runtime.openOptionsPage();
      return { ok: true };

    default:
      return { ok: false, error: "Unknown message type" };
  }
}

async function snapshot() {
  const [settings, state, providerStatus, examGuard, schoolGuard] = await Promise.all([
    getSettings(),
    getState(),
    getProviderStatus(),
    getExamGuard(),
    getSchoolGuard()
  ]);
  return {
    ok: true,
    settings,
    state,
    providerStatus,
    examGuard,
    schoolGuard,
    metrics: calculateMetrics(state.stats),
    dailySeries: calculateDailySeries(state.daily),
    adaptiveLevel: getAdaptiveLevel(state.sessions, settings),
    insights: generateInsights(state.stats, state.sessions),
    privacy: getPrivacyCounters(state),
    keys: STORAGE_KEYS
  };
}

async function activateExamGuard(detail = {}, sender) {
  const settings = await getSettings();
  if (settings.examGuardEnabled === false) return { ok: true, skipped: true };
  const host = safeHostname(sender?.url) || detail.host;
  const now = Date.now();
  const examGuard = await updateExamGuard((current) => ({
    active: true,
    sourceHost: host,
    startedAt: current.active ? current.startedAt : now,
    expiresAt: now + 3 * 60 * 60_000,
    reason: detail.reason || current.reason || "keyword",
    counters: current.counters || {}
  }));
  return { ok: true, examGuard };
}

async function activateSchoolGuard(detail = {}, sender) {
  const settings = await getSettings();
  if (settings.mode !== "school") return { ok: true, skipped: true };
  const host = safeHostname(sender?.url) || detail.host;
  const now = Date.now();
  const schoolGuard = await updateSchoolGuard((current) => ({
    active: true,
    sourceHost: host,
    startedAt: current.active ? current.startedAt : now,
    expiresAt: now + 12 * 60 * 60_000,
    policy: detail.policy || current.policy || "not_allowed"
  }));
  return { ok: true, schoolGuard };
}

function safeHostname(url) {
  try {
    return url ? new URL(url).hostname : undefined;
  } catch {
    return undefined;
  }
}

async function recordExamGuard(counter) {
  if (!counter || typeof counter !== "string") return { ok: false, error: "Missing counter" };
  const examGuard = await updateExamGuard((current) => ({
    ...current,
    active: current.active !== false,
    startedAt: current.startedAt || Date.now(),
    expiresAt: current.expiresAt || Date.now() + 3 * 60 * 60_000,
    counters: {
      ...(current.counters || {}),
      [counter]: (current.counters?.[counter] || 0) + 1
    }
  }));
  return { ok: true, examGuard };
}

async function recordEvent(event) {
  const settings = await getSettings();
  if (settings.mode === "quick" || !settings.historyEnabled) {
    return { ok: true, skipped: true };
  }
  const state = await getState();
  const next = reduceEvent(state, event);
  await setState(next);
  return { ok: true, state: next, metrics: calculateMetrics(next.stats) };
}

function assertMetadataOnly(event = {}) {
  const forbiddenKeys = [
    "prompt",
    "promptText",
    "response",
    "responseText",
    "attemptText",
    "reflectionText",
    "clipboard",
    "clipboardText",
    "url",
    "html",
    "screenshot"
  ];
  const present = forbiddenKeys.filter((key) => key in event);
  if (present.length) {
    throw new Error(`ThinkFirst event contains forbidden content fields: ${present.join(", ")}`);
  }
}

function stripSessionForExport(session) {
  const { sessionId, ...rest } = session;
  return {
    ...rest,
    sessionId: "local-anonymous-session"
  };
}
