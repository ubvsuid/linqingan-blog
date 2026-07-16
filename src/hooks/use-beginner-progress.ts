"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  BEGINNER_PROGRESS_EVENT,
  BEGINNER_PROGRESS_STORAGE_KEY,
  emptyBeginnerProgress,
  normalizeBeginnerProgress,
  readBeginnerProgress,
  serializeBeginnerProgress,
} from "@/lib/beginner-progress";

const serverSnapshot = serializeBeginnerProgress(emptyBeginnerProgress);

function subscribe(listener: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === BEGINNER_PROGRESS_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(BEGINNER_PROGRESS_EVENT, listener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(BEGINNER_PROGRESS_EVENT, listener);
  };
}

function getSnapshot(): string {
  return serializeBeginnerProgress(readBeginnerProgress());
}

function getServerSnapshot(): string {
  return serverSnapshot;
}

export function useBeginnerProgress() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return useMemo(
    () => normalizeBeginnerProgress(JSON.parse(snapshot)),
    [snapshot],
  );
}
