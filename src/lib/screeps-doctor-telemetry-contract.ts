export const SCREEPS_DOCTOR_TELEMETRY_MAX_BODY_CHARS = 2048;

export const screepsDoctorTelemetryEventNames = [
  "doctor_launcher_clicked",
  "doctor_vertical_selected",
  "doctor_diagnosis_completed",
  "doctor_resolver_handoff_clicked",
] as const;

export const screepsDoctorTelemetrySymptoms = [
  "spawn-not-working",
  "creep-not-moving",
  "creep-not-harvesting",
] as const;

export const screepsDoctorTelemetryLocales = ["zh", "en"] as const;

export type ScreepsDoctorTelemetrySymptom =
  (typeof screepsDoctorTelemetrySymptoms)[number];
export type ScreepsDoctorTelemetryLocale =
  (typeof screepsDoctorTelemetryLocales)[number];

type LauncherEvent = {
  eventName: "doctor_launcher_clicked";
  symptom: ScreepsDoctorTelemetrySymptom;
  locale: ScreepsDoctorTelemetryLocale;
  source: "homepage";
};

type VerticalSelectedEvent = {
  eventName: "doctor_vertical_selected";
  symptom: ScreepsDoctorTelemetrySymptom;
  locale: ScreepsDoctorTelemetryLocale;
  source: "doctor_ui";
};

type DiagnosisCompletedEvent = {
  eventName: "doctor_diagnosis_completed";
  symptom: ScreepsDoctorTelemetrySymptom;
  locale: ScreepsDoctorTelemetryLocale;
  source: "doctor_ui";
  diagnosisId: string;
};

type ResolverHandoffEvent = {
  eventName: "doctor_resolver_handoff_clicked";
  symptom: ScreepsDoctorTelemetrySymptom;
  locale: ScreepsDoctorTelemetryLocale;
  source: "doctor_result";
  flowId: ScreepsDoctorTelemetrySymptom;
};

export type ScreepsDoctorTelemetryEvent =
  | LauncherEvent
  | VerticalSelectedEvent
  | DiagnosisCompletedEvent
  | ResolverHandoffEvent;

const diagnosisIds: Record<ScreepsDoctorTelemetrySymptom, ReadonlySet<string>> = {
  "spawn-not-working": new Set([
    "room-not-visible",
    "spawn-not-visible",
    "spawn-not-owned",
    "spawn-busy",
    "energy-blocked",
    "return-code-required",
  ]),
  "creep-not-moving": new Set([
    "creep-not-visible",
    "creep-not-owned",
    "no-active-move-parts",
    "fatigue-blocked",
    "return-code-required",
  ]),
  "creep-not-harvesting": new Set([
    "creep-not-visible",
    "creep-not-owned",
    "no-active-work-parts",
    "target-not-visible",
    "target-out-of-range",
    "return-code-required",
  ]),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === expectedKeys.length &&
    expectedKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
  );
}

function isSymptom(value: unknown): value is ScreepsDoctorTelemetrySymptom {
  return (
    typeof value === "string" &&
    (screepsDoctorTelemetrySymptoms as readonly string[]).includes(value)
  );
}

function isLocale(value: unknown): value is ScreepsDoctorTelemetryLocale {
  return value === "zh" || value === "en";
}

export function parseScreepsDoctorTelemetryEvent(
  value: unknown,
): ScreepsDoctorTelemetryEvent | null {
  if (!isRecord(value) || !isSymptom(value.symptom) || !isLocale(value.locale)) {
    return null;
  }

  if (value.eventName === "doctor_launcher_clicked") {
    if (
      !hasExactKeys(value, ["eventName", "symptom", "locale", "source"]) ||
      value.source !== "homepage"
    ) return null;
    return value as LauncherEvent;
  }

  if (value.eventName === "doctor_vertical_selected") {
    if (
      !hasExactKeys(value, ["eventName", "symptom", "locale", "source"]) ||
      value.source !== "doctor_ui"
    ) return null;
    return value as VerticalSelectedEvent;
  }

  if (value.eventName === "doctor_diagnosis_completed") {
    if (
      !hasExactKeys(value, ["eventName", "symptom", "locale", "source", "diagnosisId"]) ||
      value.source !== "doctor_ui" ||
      typeof value.diagnosisId !== "string" ||
      !diagnosisIds[value.symptom].has(value.diagnosisId)
    ) return null;
    return value as DiagnosisCompletedEvent;
  }

  if (value.eventName === "doctor_resolver_handoff_clicked") {
    if (
      !hasExactKeys(value, ["eventName", "symptom", "locale", "source", "flowId"]) ||
      value.source !== "doctor_result" ||
      value.flowId !== value.symptom
    ) return null;
    return value as ResolverHandoffEvent;
  }

  return null;
}
