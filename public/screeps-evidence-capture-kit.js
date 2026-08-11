/* Linqingan Screeps Evidence Capture Kit v1.0.0
 *
 * Safety boundary:
 * - This kit never calls Screeps game-action methods.
 * - Console captures are read-only unless your own surrounding Console command performs an action.
 * - Multi-tick sessions only write under Memory.__linqinganEvidenceCapture.
 */
(function installLinqinganEvidenceCapture(root) {
  "use strict";

  var KIT_VERSION = "1.0.0";
  var SCHEMA_VERSION = "linqingan-evidence-bundle/v1";
  var MEMORY_KEY = "__linqinganEvidenceCapture";
  var localSequence = 0;

  function fail(message) {
    throw new Error("EvidenceCapture: " + message);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function currentGameTime() {
    if (typeof Game === "undefined" || !Number.isSafeInteger(Game.time)) {
      fail("Game.time is unavailable");
    }
    return Game.time;
  }

  function currentShard() {
    return typeof Game !== "undefined" && Game.shard && Game.shard.name
      ? String(Game.shard.name)
      : null;
  }

  function plainObject(value, field) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      fail(field + " must be a plain object");
    }
    return value;
  }

  function optionalPlainObject(value, field) {
    if (value === undefined || value === null) return null;
    return plainObject(value, field);
  }

  function requiredString(value, field) {
    if (typeof value !== "string" || !value.trim()) {
      fail(field + " is required");
    }
    return value.trim();
  }

  function optionalString(value) {
    if (value === undefined || value === null || value === "") return null;
    return String(value).trim() || null;
  }

  function safeReturnCode(value) {
    if (value === undefined || value === null || value === "") return null;
    return String(value);
  }

  function safeLabel(value) {
    var normalized = requiredString(value || "CAPTURE", "label")
      .toUpperCase()
      .replace(/[^A-Z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
    return normalized || "CAPTURE";
  }

  function captureDateStamp() {
    return nowIso().slice(0, 10).replace(/-/g, "");
  }

  function createSourceRef(label) {
    localSequence += 1;
    return (
      "capture:CAP-" +
      captureDateStamp() +
      "-" +
      safeLabel(label) +
      "-T" +
      currentGameTime() +
      "-" +
      localSequence
    );
  }

  function cloneJson(value) {
    if (value === undefined) return null;
    return JSON.parse(JSON.stringify(value));
  }

  function snapshotStore(store) {
    if (!store) return null;
    var resources = {};
    Object.keys(store).sort().forEach(function copyResource(resourceType) {
      var amount = store[resourceType];
      if (typeof amount === "number") resources[resourceType] = amount;
    });

    var snapshot = { resources: resources };
    if (typeof store.getUsedCapacity === "function") {
      snapshot.usedCapacity = store.getUsedCapacity();
    }
    if (typeof store.getFreeCapacity === "function") {
      snapshot.freeCapacity = store.getFreeCapacity();
    }
    if (typeof store.getCapacity === "function") {
      snapshot.capacity = store.getCapacity();
    }
    return snapshot;
  }

  function snapshotBody(body) {
    if (!Array.isArray(body)) return null;
    var counts = {};
    var active = {};
    body.forEach(function countPart(part) {
      var type = part && part.type ? String(part.type) : "unknown";
      counts[type] = (counts[type] || 0) + 1;
      if (!part || part.hits > 0) active[type] = (active[type] || 0) + 1;
    });
    return { counts: counts, active: active };
  }

  function snapshotObject(object) {
    if (object === undefined || object === null) return null;
    if (typeof object !== "object") return object;

    var output = {};
    if (object.id) output.id = String(object.id);
    if (object.name) output.name = String(object.name);
    if (object.structureType) output.structureType = String(object.structureType);
    if (object.resourceType) output.resourceType = String(object.resourceType);
    if (typeof object.amount === "number") output.amount = object.amount;

    if (object.pos) {
      output.pos = {
        x: object.pos.x,
        y: object.pos.y,
        roomName: object.pos.roomName,
      };
    }

    if (object.store) output.store = snapshotStore(object.store);
    if (object.body) output.body = snapshotBody(object.body);

    [
      "fatigue",
      "ticksToLive",
      "cooldown",
      "hits",
      "hitsMax",
      "progress",
      "progressTotal",
      "ticksToDowngrade",
      "level",
      "upgradeBlocked",
      "safeMode",
      "safeModeAvailable",
      "energy",
      "energyCapacity",
      "energyAvailable",
      "energyCapacityAvailable",
      "bucket",
      "limit",
      "tickLimit",
    ].forEach(function copyNumeric(field) {
      if (typeof object[field] === "number") output[field] = object[field];
    });

    if (typeof object.getUsed === "function") {
      output.used = object.getUsed();
    }

    if (object.spawning) {
      output.spawning = {
        name: object.spawning.name,
        needTime: object.spawning.needTime,
        remainingTime: object.spawning.remainingTime,
      };
    }

    return output;
  }

  function snapshot(namedObjects) {
    plainObject(namedObjects, "snapshot input");
    var output = {};
    Object.keys(namedObjects).forEach(function captureNamedObject(name) {
      output[name] = snapshotObject(namedObjects[name]);
    });
    return output;
  }

  function buildRecord(options, verificationType, tickStart, tickEnd) {
    plainObject(options, "options");
    var beforeState = optionalPlainObject(options.beforeState, "beforeState");
    var afterState = optionalPlainObject(options.afterState, "afterState");
    if (beforeState === null && afterState === null) {
      fail("at least one of beforeState or afterState is required");
    }

    return {
      articleSlug: requiredString(options.articleSlug, "articleSlug"),
      language: optionalString(options.language) || "zh-CN",
      verificationType: verificationType,
      gameTime: verificationType === "console" ? currentGameTime() : null,
      shard: optionalString(options.shard) || currentShard(),
      roomName: optionalString(options.roomName),
      apiName: requiredString(options.apiName, "apiName"),
      returnCode: safeReturnCode(options.returnCode),
      beforeState: cloneJson(beforeState),
      afterState: cloneJson(afterState),
      tickStart: tickStart,
      tickEnd: tickEnd,
      evidenceNote: requiredString(options.evidenceNote, "evidenceNote"),
      sourceRef: optionalString(options.sourceRef) || createSourceRef(options.label || options.apiName),
      verifiedAt: nowIso(),
    };
  }

  function bundle(records) {
    return {
      schemaVersion: SCHEMA_VERSION,
      captureKitVersion: KIT_VERSION,
      generatedAt: nowIso(),
      records: records,
    };
  }

  function printBundle(value) {
    var text = JSON.stringify(value, null, 2);
    if (typeof console !== "undefined" && typeof console.log === "function") {
      console.log(text);
    }
    return text;
  }

  function captureConsole(options) {
    var record = buildRecord(options, "console", null, null);
    var result = bundle([record]);
    printBundle(result);
    return result;
  }

  function getMemoryStore() {
    if (typeof Memory === "undefined") fail("Memory is unavailable for multi-tick capture");
    if (!Memory[MEMORY_KEY] || typeof Memory[MEMORY_KEY] !== "object") {
      Memory[MEMORY_KEY] = { version: KIT_VERSION, sessions: {} };
    }
    if (!Memory[MEMORY_KEY].sessions || typeof Memory[MEMORY_KEY].sessions !== "object") {
      Memory[MEMORY_KEY].sessions = {};
    }
    return Memory[MEMORY_KEY];
  }

  function beginLive(options) {
    plainObject(options, "options");
    var tick = currentGameTime();
    var sourceRef = optionalString(options.sourceRef) || createSourceRef(options.label || options.apiName);
    var sessionId = sourceRef.slice("capture:".length);
    var store = getMemoryStore();

    if (store.sessions[sessionId]) fail("session already exists: " + sessionId);

    store.sessions[sessionId] = {
      articleSlug: requiredString(options.articleSlug, "articleSlug"),
      language: optionalString(options.language) || "zh-CN",
      shard: optionalString(options.shard) || currentShard(),
      roomName: optionalString(options.roomName),
      apiName: requiredString(options.apiName, "apiName"),
      evidenceNote: requiredString(options.evidenceNote, "evidenceNote"),
      sourceRef: sourceRef,
      tickStart: tick,
      beforeState: cloneJson(optionalPlainObject(options.beforeState, "beforeState") || {}),
      samples: [],
    };

    return sessionId;
  }

  function sampleLive(sessionId, state) {
    var id = requiredString(sessionId, "sessionId");
    var store = getMemoryStore();
    var session = store.sessions[id];
    if (!session) fail("unknown session: " + id);
    if (session.samples.length >= 30) {
      fail("sample budget exceeded (30); finish or clear this session before collecting more");
    }
    var snapshotState = plainObject(state, "state");

    session.samples.push({
      gameTime: currentGameTime(),
      state: cloneJson(snapshotState),
    });

    return session.samples.length;
  }

  function finishLive(sessionId, options) {
    var id = requiredString(sessionId, "sessionId");
    var store = getMemoryStore();
    var session = store.sessions[id];
    if (!session) fail("unknown session: " + id);
    var endTick = currentGameTime();
    if (endTick <= session.tickStart) {
      fail("live evidence must finish on a later tick than it started");
    }

    var finishOptions = options || {};
    plainObject(finishOptions, "finish options");
    var finalState = optionalPlainObject(finishOptions.afterState, "afterState") || {};
    var record = buildRecord(
      {
        articleSlug: session.articleSlug,
        language: session.language,
        shard: session.shard,
        roomName: session.roomName,
        apiName: session.apiName,
        returnCode: finishOptions.returnCode,
        beforeState: session.beforeState,
        afterState: {
          final: cloneJson(finalState),
          samples: cloneJson(session.samples),
        },
        evidenceNote: optionalString(finishOptions.evidenceNote) || session.evidenceNote,
        sourceRef: session.sourceRef,
      },
      "live",
      session.tickStart,
      endTick,
    );

    var result = bundle([record]);
    printBundle(result);
    return result;
  }

  function listLive() {
    var store = getMemoryStore();
    return Object.keys(store.sessions).sort().map(function summarize(id) {
      var session = store.sessions[id];
      return {
        sessionId: id,
        apiName: session.apiName,
        roomName: session.roomName,
        tickStart: session.tickStart,
        samples: session.samples.length,
      };
    });
  }

  function clearLive(sessionId) {
    var id = requiredString(sessionId, "sessionId");
    var store = getMemoryStore();
    if (!store.sessions[id]) return false;
    delete store.sessions[id];
    return true;
  }

  root.EvidenceCapture = Object.freeze({
    version: KIT_VERSION,
    schemaVersion: SCHEMA_VERSION,
    memoryKey: MEMORY_KEY,
    snapshot: snapshot,
    snapshotObject: snapshotObject,
    captureConsole: captureConsole,
    beginLive: beginLive,
    sampleLive: sampleLive,
    finishLive: finishLive,
    listLive: listLive,
    clearLive: clearLive,
    printBundle: printBundle,
  });

  if (typeof console !== "undefined" && typeof console.log === "function") {
    console.log(
      "EvidenceCapture v" + KIT_VERSION +
      " installed. Read-only capture is ready; multi-tick sessions only use Memory." + MEMORY_KEY + ".",
    );
  }
})(typeof globalThis !== "undefined" ? globalThis : global);
