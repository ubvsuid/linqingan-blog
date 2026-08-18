import {
  getScreepsDiagnosticSymptom,
  type ScreepsDiagnosticSymptom,
} from "@/lib/screeps-diagnostic-symptoms";

export const chineseDiagnosticDetailIds = [
  "creep-not-moving",
  "spawn-not-spawning",
  "cpu-too-high",
  "controller-downgrade",
  "resources-not-moving",
  "market-action-failed",
] as const;

export type ChineseDiagnosticDetailId = (typeof chineseDiagnosticDetailIds)[number];

const chineseDiagnosticDetailIdSet = new Set<string>(chineseDiagnosticDetailIds);

export function isChineseDiagnosticDetailId(id: string): id is ChineseDiagnosticDetailId {
  return chineseDiagnosticDetailIdSet.has(id);
}

export function getChineseDiagnosticDetailSymptom(id: string): ScreepsDiagnosticSymptom | null {
  if (!isChineseDiagnosticDetailId(id)) return null;
  return getScreepsDiagnosticSymptom(id);
}

export function getChineseDiagnosticDetailHref(id: string): string | null {
  return isChineseDiagnosticDetailId(id) ? `/diagnostics/${id}` : null;
}
