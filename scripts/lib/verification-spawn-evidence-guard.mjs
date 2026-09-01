const TARGET_BRANCHES = new Map([
  ["ERR_INVALID_ARGS", -10],
  ["ERR_BUSY", -4],
  ["ERR_RCL_NOT_ENOUGH", -14],
]);

function fail(message) {
  throw new Error(`Spawn Evidence guard: ${message}`);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireProbe(record) {
  const probe = record.beforeState?.probe;
  if (!isPlainObject(probe)) fail("beforeState.probe is required");
  if (probe.dryRun !== true) fail("beforeState.probe.dryRun must be true");
  if (typeof probe.branch !== "string" || !TARGET_BRANCHES.has(probe.branch)) {
    fail("beforeState.probe.branch must be one of ERR_INVALID_ARGS, ERR_BUSY, or ERR_RCL_NOT_ENOUGH");
  }
  return probe;
}

function normalizeReturnCode(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  const text = String(raw).trim();
  if (/^-?\d+$/.test(text)) return Number(text);
  if (TARGET_BRANCHES.has(text)) return TARGET_BRANCHES.get(text);
  return null;
}

function spawningName(state) {
  const value = state?.spawn?.spawning;
  return value && typeof value.name === "string" ? value.name : null;
}

export function validateSpawnEvidenceRecord(record) {
  if (!record || typeof record !== "object") fail("record is required");
  if (record.articleSlug !== "screeps-spawn-create-creep") {
    fail("articleSlug must be screeps-spawn-create-creep");
  }
  if (record.language !== "zh-CN") fail("language must be zh-CN for the current Spawn owner");
  if (record.verificationType !== "console") fail("verificationType must be console");
  if (record.apiName !== "StructureSpawn.spawnCreep") {
    fail("apiName must be StructureSpawn.spawnCreep");
  }

  const probe = requireProbe(record);
  const expectedCode = TARGET_BRANCHES.get(probe.branch);
  const observedCode = normalizeReturnCode(record.returnCode);
  if (observedCode !== expectedCode) {
    fail(`returnCode ${String(record.returnCode)} does not match ${probe.branch} (${expectedCode})`);
  }

  if (!record.beforeState?.spawn || !record.afterState?.spawn) {
    fail("beforeState.spawn and afterState.spawn are required");
  }

  const beforeSpawning = spawningName(record.beforeState);
  const afterSpawning = spawningName(record.afterState);
  if (beforeSpawning !== afterSpawning) {
    fail("dryRun capture changed the observed Spawn spawning identity; discard this bundle");
  }

  if (probe.branch === "ERR_INVALID_ARGS") {
    if (probe.spawnActive !== true) fail("ERR_INVALID_ARGS requires spawnActive=true");
    if (probe.spawnBusy !== false) fail("ERR_INVALID_ARGS requires spawnBusy=false");
    if (!Array.isArray(probe.body) || probe.body.length !== 0) {
      fail("ERR_INVALID_ARGS requires the intentionally empty body probe");
    }
    if (beforeSpawning !== null) fail("ERR_INVALID_ARGS recipe requires an idle Spawn");
  }

  if (probe.branch === "ERR_BUSY") {
    if (probe.spawnActive !== true) fail("ERR_BUSY requires spawnActive=true");
    if (probe.spawnBusy !== true) fail("ERR_BUSY requires spawnBusy=true");
    if (!Array.isArray(probe.body) || probe.body.length === 0) {
      fail("ERR_BUSY requires a non-empty valid probe body");
    }
    if (beforeSpawning === null) fail("ERR_BUSY requires a naturally busy Spawn snapshot");
    if (probe.spawningName && probe.spawningName !== beforeSpawning) {
      fail("ERR_BUSY probe.spawningName must match the captured Spawn state");
    }
  }

  if (probe.branch === "ERR_RCL_NOT_ENOUGH") {
    if (probe.spawnActive !== false) fail("ERR_RCL_NOT_ENOUGH requires spawnActive=false");
    if (!Array.isArray(probe.body) || probe.body.length === 0) {
      fail("ERR_RCL_NOT_ENOUGH requires a non-empty valid probe body");
    }
    if (!/no room downgrade/i.test(record.evidenceNote)) {
      fail("ERR_RCL_NOT_ENOUGH evidenceNote must retain the non-destructive room-safety statement");
    }
  }

  return {
    branch: probe.branch,
    returnCode: expectedCode,
    evidenceKey: record.evidenceKey,
    sourceRef: record.sourceRef,
    gameTime: record.gameTime,
    shard: record.shard,
    roomName: record.roomName,
  };
}
