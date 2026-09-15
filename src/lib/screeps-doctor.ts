export const SCREEPS_DOCTOR_SNAPSHOT_VERSION = 1 as const;
export const SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS = 4096;

export const SPAWN_DOCTOR_CANONICAL_REFERENCES = {
  resolverFlowId: "spawn-not-working",
  diagnosticSymptomId: "spawn-not-spawning",
  apiEntryId: "spawn-spawn-creep",
} as const;

export const SPAWN_DOCTOR_READ_ONLY_PROBE_CONTRACT = {
  reads: [
    "Game.rooms[roomName]",
    "room.energyAvailable",
    "spawn.my",
    "spawn.spawning",
    "spawn.spawning.remainingTime",
  ],
  writes: [],
  forbidden: ["spawnCreep call", "Memory write", "Screeps token", "arbitrary JavaScript evaluation"],
} as const;

export interface SpawnDoctorSnapshotV1 {
  version: typeof SCREEPS_DOCTOR_SNAPSHOT_VERSION;
  symptom: "spawn-not-working";
  room: {
    visible: boolean;
    energyAvailable: number | null;
  };
  spawn: {
    visible: boolean;
    owned: boolean | null;
    spawning: boolean | null;
    remainingTime: number | null;
  };
  request: {
    bodyCost: number | null;
  };
}

export type SpawnDoctorClassification =
  | "room-not-visible"
  | "spawn-not-visible"
  | "spawn-not-owned"
  | "spawn-busy"
  | "energy-blocked"
  | "return-code-required";

export interface SpawnDoctorDiagnosis {
  snapshotVersion: typeof SCREEPS_DOCTOR_SNAPSHOT_VERSION;
  symptom: "spawn-not-working";
  classification: SpawnDoctorClassification;
  confidence: "direct" | "bounded";
  observations: readonly string[];
  canonical: {
    resolverFlowId: typeof SPAWN_DOCTOR_CANONICAL_REFERENCES.resolverFlowId;
    resolverStepId: "spawn-dryrun" | null;
    resolverOutcomeId: "spawn-out-busy" | "spawn-out-energy" | null;
    diagnosticSymptomId: typeof SPAWN_DOCTOR_CANONICAL_REFERENCES.diagnosticSymptomId;
    apiEntryId: typeof SPAWN_DOCTOR_CANONICAL_REFERENCES.apiEntryId;
  };
  fix: {
    recommendationId:
      | "restore-room-visibility"
      | "select-visible-spawn"
      | "select-owned-spawn"
      | "wait-for-current-spawn"
      | "reduce-body-or-refill-energy"
      | "capture-return-code-in-canonical-resolver";
    doctorExecutesAction: false;
  };
  verification: {
    mode: "session-only";
    nextCheckId:
      | "resnapshot-visible-room"
      | "resnapshot-visible-spawn"
      | "resnapshot-owned-spawn"
      | "resnapshot-until-idle"
      | "resnapshot-energy-threshold"
      | "continue-canonical-resolver";
    publishableRuntimeEvidence: false;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertExactKeys(value: unknown, expectedKeys: readonly string[], path: string): asserts value is Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object.`);
  }

  const expected = new Set(expectedKeys);
  for (const key of Object.keys(value)) {
    if (!expected.has(key)) {
      throw new Error(`${path}.${key} is not allowed.`);
    }
  }

  for (const key of expectedKeys) {
    if (!(key in value)) {
      throw new Error(`${path}.${key} is required.`);
    }
  }
}

function readBoolean(record: Record<string, unknown>, key: string, path: string): boolean {
  const value = record[key];
  if (typeof value !== "boolean") {
    throw new Error(`${path}.${key} must be a boolean.`);
  }
  return value;
}

function readNullableBoolean(record: Record<string, unknown>, key: string, path: string): boolean | null {
  const value = record[key];
  if (value === null) return null;
  if (typeof value !== "boolean") {
    throw new Error(`${path}.${key} must be a boolean or null.`);
  }
  return value;
}

function readNullableInteger(
  record: Record<string, unknown>,
  key: string,
  path: string,
  minimum: number,
): number | null {
  const value = record[key];
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum) {
    throw new Error(`${path}.${key} must be an integer >= ${minimum} or null.`);
  }
  return value;
}

function serializeForLimit(input: unknown): string {
  if (typeof input === "string") return input;
  try {
    const serialized = JSON.stringify(input);
    if (serialized === undefined) throw new Error("Snapshot cannot be serialized.");
    return serialized;
  } catch {
    throw new Error("Snapshot must be JSON-serializable.");
  }
}

export function parseSpawnDoctorSnapshot(input: unknown): SpawnDoctorSnapshotV1 {
  const serialized = serializeForLimit(input);
  if (serialized.length > SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS) {
    throw new Error(`Snapshot exceeds ${SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS} characters.`);
  }

  let value: unknown = input;
  if (typeof input === "string") {
    try {
      value = JSON.parse(input) as unknown;
    } catch {
      throw new Error("Snapshot must be valid JSON.");
    }
  }

  assertExactKeys(value, ["version", "symptom", "room", "spawn", "request"], "snapshot");

  if (value.version !== SCREEPS_DOCTOR_SNAPSHOT_VERSION) {
    throw new Error(`snapshot.version must be ${SCREEPS_DOCTOR_SNAPSHOT_VERSION}.`);
  }
  if (value.symptom !== "spawn-not-working") {
    throw new Error("snapshot.symptom must be spawn-not-working.");
  }

  assertExactKeys(value.room, ["visible", "energyAvailable"], "snapshot.room");
  assertExactKeys(value.spawn, ["visible", "owned", "spawning", "remainingTime"], "snapshot.spawn");
  assertExactKeys(value.request, ["bodyCost"], "snapshot.request");

  const roomVisible = readBoolean(value.room, "visible", "snapshot.room");
  const energyAvailable = readNullableInteger(value.room, "energyAvailable", "snapshot.room", 0);
  const spawnVisible = readBoolean(value.spawn, "visible", "snapshot.spawn");
  const spawnOwned = readNullableBoolean(value.spawn, "owned", "snapshot.spawn");
  const spawnSpawning = readNullableBoolean(value.spawn, "spawning", "snapshot.spawn");
  const remainingTime = readNullableInteger(value.spawn, "remainingTime", "snapshot.spawn", 1);
  const bodyCost = readNullableInteger(value.request, "bodyCost", "snapshot.request", 1);

  if (!roomVisible) {
    if (energyAvailable !== null) throw new Error("Hidden rooms must use null energyAvailable.");
    if (spawnVisible) throw new Error("A Spawn cannot be visible when its room is not visible.");
  } else if (energyAvailable === null) {
    throw new Error("Visible rooms must include energyAvailable.");
  }

  if (!spawnVisible) {
    if (spawnOwned !== null || spawnSpawning !== null || remainingTime !== null) {
      throw new Error("Non-visible Spawns must use null owned, spawning, and remainingTime values.");
    }
  } else {
    if (spawnOwned === null || spawnSpawning === null) {
      throw new Error("Visible Spawns must include owned and spawning booleans.");
    }
    if (spawnSpawning && remainingTime === null) {
      throw new Error("A spawning Spawn must include remainingTime.");
    }
    if (!spawnSpawning && remainingTime !== null) {
      throw new Error("An idle Spawn must use null remainingTime.");
    }
  }

  return {
    version: SCREEPS_DOCTOR_SNAPSHOT_VERSION,
    symptom: "spawn-not-working",
    room: { visible: roomVisible, energyAvailable },
    spawn: {
      visible: spawnVisible,
      owned: spawnOwned,
      spawning: spawnSpawning,
      remainingTime,
    },
    request: { bodyCost },
  };
}

function result(
  classification: SpawnDoctorClassification,
  confidence: SpawnDoctorDiagnosis["confidence"],
  observations: readonly string[],
  resolverStepId: SpawnDoctorDiagnosis["canonical"]["resolverStepId"],
  resolverOutcomeId: SpawnDoctorDiagnosis["canonical"]["resolverOutcomeId"],
  recommendationId: SpawnDoctorDiagnosis["fix"]["recommendationId"],
  nextCheckId: SpawnDoctorDiagnosis["verification"]["nextCheckId"],
): SpawnDoctorDiagnosis {
  return {
    snapshotVersion: SCREEPS_DOCTOR_SNAPSHOT_VERSION,
    symptom: "spawn-not-working",
    classification,
    confidence,
    observations,
    canonical: {
      ...SPAWN_DOCTOR_CANONICAL_REFERENCES,
      resolverStepId,
      resolverOutcomeId,
    },
    fix: {
      recommendationId,
      doctorExecutesAction: false,
    },
    verification: {
      mode: "session-only",
      nextCheckId,
      publishableRuntimeEvidence: false,
    },
  };
}

export function diagnoseSpawnDoctor(input: unknown): SpawnDoctorDiagnosis {
  const snapshot = parseSpawnDoctorSnapshot(input);
  const observations: string[] = [];

  observations.push(snapshot.room.visible ? "room-visible" : "room-not-visible");
  if (!snapshot.room.visible) {
    return result(
      "room-not-visible",
      "direct",
      observations,
      null,
      null,
      "restore-room-visibility",
      "resnapshot-visible-room",
    );
  }

  observations.push(`room-energy-available:${snapshot.room.energyAvailable}`);
  observations.push(snapshot.spawn.visible ? "spawn-visible" : "spawn-not-visible");
  if (!snapshot.spawn.visible) {
    return result(
      "spawn-not-visible",
      "direct",
      observations,
      null,
      null,
      "select-visible-spawn",
      "resnapshot-visible-spawn",
    );
  }

  observations.push(snapshot.spawn.owned ? "spawn-owned" : "spawn-not-owned");
  if (!snapshot.spawn.owned) {
    return result(
      "spawn-not-owned",
      "direct",
      observations,
      null,
      null,
      "select-owned-spawn",
      "resnapshot-owned-spawn",
    );
  }

  observations.push(snapshot.spawn.spawning ? "spawn-busy" : "spawn-idle");
  if (snapshot.spawn.spawning) {
    observations.push(`spawn-remaining-time:${snapshot.spawn.remainingTime}`);
    return result(
      "spawn-busy",
      "direct",
      observations,
      null,
      "spawn-out-busy",
      "wait-for-current-spawn",
      "resnapshot-until-idle",
    );
  }

  if (snapshot.request.bodyCost !== null) {
    observations.push(`request-body-cost:${snapshot.request.bodyCost}`);
    if (
      snapshot.room.energyAvailable !== null &&
      snapshot.request.bodyCost > snapshot.room.energyAvailable
    ) {
      return result(
        "energy-blocked",
        "direct",
        observations,
        null,
        "spawn-out-energy",
        "reduce-body-or-refill-energy",
        "resnapshot-energy-threshold",
      );
    }
  } else {
    observations.push("request-body-cost:not-captured");
  }

  return result(
    "return-code-required",
    "bounded",
    observations,
    "spawn-dryrun",
    null,
    "capture-return-code-in-canonical-resolver",
    "continue-canonical-resolver",
  );
}
