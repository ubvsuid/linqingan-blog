import {
  HARVEST_DOCTOR_CANONICAL_REFERENCES,
  MOVEMENT_DOCTOR_CANONICAL_REFERENCES,
  SPAWN_DOCTOR_CANONICAL_REFERENCES,
} from "./screeps-doctor";

export const SCREEPS_DOCTOR_LAUNCHES = [
  {
    doctorSymptom: SPAWN_DOCTOR_CANONICAL_REFERENCES.resolverFlowId,
    diagnosticSymptomId: SPAWN_DOCTOR_CANONICAL_REFERENCES.diagnosticSymptomId,
  },
  {
    doctorSymptom: MOVEMENT_DOCTOR_CANONICAL_REFERENCES.resolverFlowId,
    diagnosticSymptomId: MOVEMENT_DOCTOR_CANONICAL_REFERENCES.diagnosticSymptomId,
  },
  {
    doctorSymptom: HARVEST_DOCTOR_CANONICAL_REFERENCES.resolverFlowId,
    diagnosticSymptomId: HARVEST_DOCTOR_CANONICAL_REFERENCES.diagnosticSymptomId,
  },
] as const;

export type ScreepsDoctorLaunchSymptom = (typeof SCREEPS_DOCTOR_LAUNCHES)[number]["doctorSymptom"];

export function getScreepsDoctorLaunchByDiagnosticSymptom(diagnosticSymptomId: string) {
  return SCREEPS_DOCTOR_LAUNCHES.find((entry) => entry.diagnosticSymptomId === diagnosticSymptomId) ?? null;
}

export function parseScreepsDoctorLaunchSymptom(value: string | null): ScreepsDoctorLaunchSymptom | null {
  if (!value) return null;
  return SCREEPS_DOCTOR_LAUNCHES.some((entry) => entry.doctorSymptom === value)
    ? (value as ScreepsDoctorLaunchSymptom)
    : null;
}

export function getScreepsDoctorDeepLink(
  value: string,
  locale: "zh" | "en",
): string | null {
  const symptom = parseScreepsDoctorLaunchSymptom(value);
  if (!symptom) return null;
  const base = locale === "en" ? "/en/resolver" : "/resolver";
  return `${base}?doctor=${encodeURIComponent(symptom)}#screeps-doctor`;
}
