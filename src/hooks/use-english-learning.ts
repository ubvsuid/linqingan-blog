"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  ENGLISH_LEARNING_EVENT,
  ENGLISH_LEARNING_STORAGE_KEY,
  emptyEnglishLearningState,
  normalizeEnglishLearningState,
  readEnglishLearningState,
  serializeEnglishLearningState,
} from "@/lib/english-learning-state";

const serverSnapshot = serializeEnglishLearningState(
  emptyEnglishLearningState,
);

function subscribe(listener: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === ENGLISH_LEARNING_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(ENGLISH_LEARNING_EVENT, listener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(ENGLISH_LEARNING_EVENT, listener);
  };
}

function getSnapshot(): string {
  return serializeEnglishLearningState(readEnglishLearningState());
}

export function useEnglishLearning() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => serverSnapshot,
  );

  return useMemo(
    () => normalizeEnglishLearningState(JSON.parse(snapshot)),
    [snapshot],
  );
}
