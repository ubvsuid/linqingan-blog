import { createHash } from "node:crypto";

import { resolveContentIdentity } from "./content-identity-registry.mjs";

export const VERIFICATION_EVIDENCE_BUNDLE_SCHEMA_VERSION = "linqingan-evidence-bundle/v1";
export const VERIFICATION_EVIDENCE_IDENTITY_VERSION = 2;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const captureRefPattern = /^capture:CAP-\d{8}-[A-Z0-9][A-Z0-9-]{2,80}$/;
const supportedLanguages = new Set(["zh-CN", "en"]);
const supportedVerificationTypes = new Set(["console", "live"]);
const allowedKeys = new Set([
  "articleSlug",
  "language",
  "verificationType",
  "gameTime",
  "shard",
  "roomName",
  "apiName",
  "returnCode",
  "beforeState",
  "afterState",
  "tickStart",
  "tickEnd",
  "evidenceNote",
  "sourceRef",
  "verifiedAt",
]);
const bundleAllowedKeys = new Set([
  "schemaVersion",
  "captureKitVersion",
  "generatedAt",
  "records",
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function optionalString(value, field, maxLength) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error(`${field} must be a string when provided`);
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) throw new Error(`${field} exceeds ${maxLength} characters`);
  return normalized;
}

function requiredString(value, field, maxLength) {
  const normalized = optionalString(value, field, maxLength);
  if (!normalized) throw new Error(`${field} is required`);
  return normalized;
}

function optionalInteger(value, field) {
  if (value === undefined || value === null || value === "") return null;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative safe integer when provided`);
  }
  return value;
}

function optionalState(value, field) {
  if (value === undefined || value === null) return null;
  if (!isPlainObject(value)) throw new Error(`${field} must be an object or null`);
  const serialized = JSON.stringify(value);
  if (serialized.length > 20_000) throw new Error(`${field} exceeds the 20 KB evidence-state budget`);
  return value;
}

function normalizeVerifiedAt(value) {
  const raw = requiredString(value, "verifiedAt", 64);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) throw new Error("verifiedAt must be a valid ISO date/time");
  const futureSkewMs = parsed.getTime() - Date.now();
  if (futureSkewMs > 5 * 60 * 1000) {
    throw new Error("verifiedAt cannot be more than five minutes in the future");
  }
  return parsed.toISOString();
}

function normalizeBundleGeneratedAt(value) {
  const raw = optionalString(value, "generatedAt", 64);
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) throw new Error("generatedAt must be a valid ISO date/time when provided");
  return parsed.toISOString();
}

function unwrapVerificationEvidencePayload(payload) {
  if (
    isPlainObject(payload) &&
    (Object.prototype.hasOwnProperty.call(payload, "schemaVersion") ||
      Object.prototype.hasOwnProperty.call(payload, "records"))
  ) {
    for (const key of Object.keys(payload)) {
      if (!bundleAllowedKeys.has(key)) throw new Error(`unknown evidence bundle field: ${key}`);
    }

    const schemaVersion = requiredString(payload.schemaVersion, "schemaVersion", 80);
    if (schemaVersion !== VERIFICATION_EVIDENCE_BUNDLE_SCHEMA_VERSION) {
      throw new Error(
        `schemaVersion must be ${VERIFICATION_EVIDENCE_BUNDLE_SCHEMA_VERSION}`,
      );
    }

    optionalString(payload.captureKitVersion, "captureKitVersion", 32);
    normalizeBundleGeneratedAt(payload.generatedAt);

    if (!Array.isArray(payload.records)) {
      throw new Error("evidence bundle records must be an array");
    }
    return payload.records;
  }

  return Array.isArray(payload) ? payload : [payload];
}

export function buildVerificationEvidenceIdentity(record) {
  const identityVersion = record.identityVersion ?? (record.contentId ? 2 : 1);
  const owner = identityVersion >= 2 ? record.contentId : record.articleSlug;
  if (!owner) throw new Error("Evidence identity requires contentId for v2 or articleSlug for legacy v1");

  return [
    `v${identityVersion}`,
    owner,
    record.verificationType,
    record.apiName,
    record.sourceRef,
    record.gameTime ?? "-",
    record.tickStart ?? "-",
    record.tickEnd ?? "-",
  ].join("|");
}

export function createVerificationEvidenceKey(record) {
  const digest = createHash("sha256")
    .update(buildVerificationEvidenceIdentity(record), "utf8")
    .digest("hex")
    .slice(0, 20)
    .toUpperCase();
  return `EV-${digest}`;
}

export function validateCaptureSourceRef(sourceRef) {
  if (!captureRefPattern.test(sourceRef)) {
    throw new Error(
      "sourceRef must use the controlled capture format capture:CAP-YYYYMMDD-LABEL, for example capture:CAP-20260811-ERR-NIR-001",
    );
  }
  return sourceRef;
}

export function validateVerificationEvidenceRecord(input) {
  if (!isPlainObject(input)) throw new Error("evidence record must be a JSON object");

  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) throw new Error(`unknown evidence field: ${key}`);
  }

  const articleSlug = requiredString(input.articleSlug, "articleSlug", 160);
  if (!slugPattern.test(articleSlug)) throw new Error("articleSlug must use the repository slug format");
  const { contentId, contentGroupId } = resolveContentIdentity(articleSlug);

  const language = requiredString(input.language ?? "zh-CN", "language", 12);
  if (!supportedLanguages.has(language)) throw new Error("language must be zh-CN or en");

  const verificationType = requiredString(input.verificationType, "verificationType", 24);
  if (!supportedVerificationTypes.has(verificationType)) {
    throw new Error("verificationType must be console or live");
  }

  const gameTime = optionalInteger(input.gameTime, "gameTime");
  const tickStart = optionalInteger(input.tickStart, "tickStart");
  const tickEnd = optionalInteger(input.tickEnd, "tickEnd");

  if (verificationType === "console" && gameTime === null) {
    throw new Error("console evidence requires gameTime");
  }

  if (verificationType === "live") {
    if (tickStart === null || tickEnd === null) {
      throw new Error("live evidence requires tickStart and tickEnd");
    }
    if (tickEnd <= tickStart) {
      throw new Error("live evidence must cover more than one tick");
    }
  }

  const beforeState = optionalState(input.beforeState, "beforeState");
  const afterState = optionalState(input.afterState, "afterState");
  if (beforeState === null && afterState === null) {
    throw new Error("at least one of beforeState or afterState is required");
  }

  const sourceRef = validateCaptureSourceRef(requiredString(input.sourceRef, "sourceRef", 240));
  const normalized = {
    identityVersion: VERIFICATION_EVIDENCE_IDENTITY_VERSION,
    contentId,
    contentGroupId,
    articleSlug,
    language,
    verificationType,
    gameTime,
    shard: optionalString(input.shard, "shard", 80),
    roomName: optionalString(input.roomName, "roomName", 80),
    apiName: requiredString(input.apiName, "apiName", 120),
    returnCode: optionalString(input.returnCode, "returnCode", 80),
    beforeState,
    afterState,
    tickStart,
    tickEnd,
    evidenceNote: requiredString(input.evidenceNote, "evidenceNote", 1200),
    sourceRef,
    verifiedAt: normalizeVerifiedAt(input.verifiedAt),
  };

  return {
    evidenceKey: createVerificationEvidenceKey(normalized),
    ...normalized,
  };
}

export function validateVerificationEvidencePayload(payload) {
  const records = unwrapVerificationEvidencePayload(payload);
  if (records.length === 0) throw new Error("evidence payload must contain at least one record");
  if (records.length > 100) throw new Error("a single evidence import is limited to 100 records");
  return records.map((record, index) => {
    try {
      return validateVerificationEvidenceRecord(record);
    } catch (error) {
      throw new Error(`record ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
}
