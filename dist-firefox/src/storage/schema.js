import {
  DEFAULT_SETTINGS,
  EMPTY_STATS,
  STORAGE_KEYS
} from "../shared/constants.js";
import { mergeSettings } from "../shared/utils.js";

export function createEmptyState() {
  return {
    stats: { ...EMPTY_STATS },
    daily: {},
    sessions: [],
    events: [],
    recentEventIds: []
  };
}

export function normalizeState(state) {
  const empty = createEmptyState();
  return {
    stats: { ...empty.stats, ...(state?.stats || {}) },
    daily: { ...(state?.daily || {}) },
    sessions: Array.isArray(state?.sessions) ? state.sessions : [],
    events: Array.isArray(state?.events) ? state.events : [],
    recentEventIds: Array.isArray(state?.recentEventIds) ? state.recentEventIds : []
  };
}

export function normalizeSettings(settings) {
  return mergeSettings(DEFAULT_SETTINGS, settings);
}

export { DEFAULT_SETTINGS, STORAGE_KEYS };
