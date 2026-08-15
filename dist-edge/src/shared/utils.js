export function uuid() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (token) => {
    const value = Math.random() * 16 | 0;
    const next = token === "x" ? value : (value & 0x3) | 0x8;
    return next.toString(16);
  });
}

export function todayKey(time = Date.now()) {
  return new Date(time).toISOString().slice(0, 10);
}

export function clampPercent(numerator, denominator) {
  if (!denominator) return 0;
  const value = Math.round((numerator / denominator) * 100);
  return Math.max(0, Math.min(100, value));
}

export function mergeSettings(defaults, stored = {}) {
  return {
    ...defaults,
    ...stored,
    pausedSites: {
      ...(defaults.pausedSites || {}),
      ...(stored.pausedSites || {})
    }
  };
}

export function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}
