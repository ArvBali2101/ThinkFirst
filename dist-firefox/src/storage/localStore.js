import { STORAGE_KEYS } from "../shared/constants.js";
import { createEmptyState, normalizeSettings, normalizeState } from "./schema.js";

function chromeStorage() {
  if (!globalThis.chrome?.storage?.local) {
    throw new Error("chrome.storage.local is not available");
  }
  return globalThis.chrome.storage.local;
}

export async function getSettings() {
  const result = await chromeStorage().get(STORAGE_KEYS.settings);
  return normalizeSettings(result[STORAGE_KEYS.settings]);
}

export async function setSettings(nextSettings) {
  await chromeStorage().set({
    [STORAGE_KEYS.settings]: normalizeSettings(nextSettings)
  });
}

export async function updateSettings(updater) {
  const current = await getSettings();
  const next = updater(current);
  await setSettings(next);
  return normalizeSettings(next);
}

export async function getState() {
  const result = await chromeStorage().get(STORAGE_KEYS.state);
  return normalizeState(result[STORAGE_KEYS.state] || createEmptyState());
}

export async function setState(nextState) {
  await chromeStorage().set({
    [STORAGE_KEYS.state]: normalizeState(nextState)
  });
}

export async function clearThinkFirstData() {
  await chromeStorage().remove([STORAGE_KEYS.state, STORAGE_KEYS.providerStatus, STORAGE_KEYS.examGuard]);
}

export async function setProviderStatus(status) {
  await chromeStorage().set({
    [STORAGE_KEYS.providerStatus]: {
      ...status,
      updatedAt: Date.now()
    }
  });
}

export async function getProviderStatus() {
  const result = await chromeStorage().get(STORAGE_KEYS.providerStatus);
  return result[STORAGE_KEYS.providerStatus] || null;
}

export async function getExamGuard() {
  const result = await chromeStorage().get(STORAGE_KEYS.examGuard);
  const guard = result[STORAGE_KEYS.examGuard] || null;
  if (!guard?.active) return guard;
  if (guard.expiresAt && guard.expiresAt < Date.now()) {
    await chromeStorage().remove(STORAGE_KEYS.examGuard);
    return null;
  }
  return guard;
}

export async function setExamGuard(nextGuard) {
  await chromeStorage().set({
    [STORAGE_KEYS.examGuard]: nextGuard
  });
}

export async function updateExamGuard(updater) {
  const current = await getExamGuard();
  const next = updater(current || emptyExamGuard());
  await setExamGuard(next);
  return next;
}

function emptyExamGuard() {
  return {
    active: false,
    startedAt: Date.now(),
    expiresAt: Date.now(),
    counters: {}
  };
}
