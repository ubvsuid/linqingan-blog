"use client";

const ANONYMOUS_ID_KEY = "linqingan:anonymous-id";
const SESSION_ID_KEY = "linqingan:session-id";

function getOrCreate(storage: Storage, key: string): string {
  const current = storage.getItem(key);
  if (current) return current;

  const next = crypto.randomUUID();
  storage.setItem(key, next);
  return next;
}

export function getBrowserIdentity(): {
  anonymousId: string;
  sessionId: string;
} {
  try {
    return {
      anonymousId: getOrCreate(window.localStorage, ANONYMOUS_ID_KEY),
      sessionId: getOrCreate(window.sessionStorage, SESSION_ID_KEY),
    };
  } catch {
    return { anonymousId: "", sessionId: "" };
  }
}

export function buildIdentityHeaders(): Record<string, string> {
  const { anonymousId, sessionId } = getBrowserIdentity();
  const headers: Record<string, string> = {};
  if (anonymousId) headers["X-Anonymous-Id"] = anonymousId;
  if (sessionId) headers["X-Session-Id"] = sessionId;
  return headers;
}

export function getSameOriginReferrerPath(): string | null {
  try {
    if (!document.referrer) return null;
    const referrer = new URL(document.referrer);
    if (referrer.origin !== window.location.origin) return null;
    return `${referrer.pathname}${referrer.search}`.slice(0, 240);
  } catch {
    return null;
  }
}
