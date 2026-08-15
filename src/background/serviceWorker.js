import { reduceEvent } from "./eventReducer.js";
import { getAdaptiveLevel } from "./interventionPolicy.js";
import { calculateDailySeries, calculateMetrics, generateInsights } from "./metrics.js";
import { getPrivacyCounters } from "../shared/privacy.js";
import { STORAGE_KEYS } from "../shared/constants.js";
import {
  clearThinkFirstData,
  getProviderStatus,
  getSettings,
  getState,
  setProviderStatus,
  setSettings,
  setState,
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

    case "PROVIDER_STATUS":
      await setProviderStatus({
        provider: message.provider || "chatgpt",
        detected: Boolean(message.detected),
        host: sender?.url ? new URL(sender.url).hostname : undefined
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
  const [settings, state, providerStatus] = await Promise.all([
    getSettings(),
    getState(),
    getProviderStatus()
  ]);
  return {
    ok: true,
    settings,
    state,
    providerStatus,
    metrics: calculateMetrics(state.stats),
    dailySeries: calculateDailySeries(state.daily),
    adaptiveLevel: getAdaptiveLevel(state.sessions, settings),
    insights: generateInsights(state.stats, state.sessions),
    privacy: getPrivacyCounters(state),
    keys: STORAGE_KEYS
  };
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
