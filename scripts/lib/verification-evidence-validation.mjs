const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
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
  return parsed.toISOString();
}

export function validateVerificationEvidenceRecord(input) {
  if (!isPlainObject(input)) throw new Error("evidence record must be a JSON object");

  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) throw new Error(`unknown evidence field: ${key}`);
  }

  const articleSlug = requiredString(input.articleSlug, "articleSlug", 160);
  if (!slugPattern.test(articleSlug)) throw new Error("articleSlug must use the repository slug format");

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

  return {
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
    sourceRef: requiredString(input.sourceRef, "sourceRef", 240),
    verifiedAt: normalizeVerifiedAt(input.verifiedAt),
  };
}

export function validateVerificationEvidencePayload(payload) {
  const records = Array.isArray(payload) ? payload : [payload];
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
