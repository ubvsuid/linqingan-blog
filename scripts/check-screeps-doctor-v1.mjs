import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[Screeps Doctor V2] ${message}`);
};

const [doctor, doctorUi, doctorStyles, resolver, diagnostics, zhResolverPage, enResolverPage, smokeAll] = await Promise.all([
  read("src/lib/screeps-doctor.ts"),
  read("src/components/screeps-doctor.tsx"),
  read("src/components/screeps-doctor.module.css"),
  read("src/lib/problem-resolver.ts"),
  read("src/lib/screeps-diagnostic-symptoms.ts"),
  read("src/app/(zh)/resolver/page.tsx"),
  read("src/app/(en)/en/resolver/page.tsx"),
  read("scripts/smoke-all.mjs"),
]);

assert(doctor.includes("SCREEPS_DOCTOR_SNAPSHOT_VERSION = 1"), "snapshot schema must remain versioned at V1");
assert(doctor.includes("SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS = 4096"), "snapshot input must remain bounded");
assert(doctor.includes("assertExactKeys"), "snapshot parsers must reject unknown fields");
assert(doctor.includes("doctorExecutesAction: false"), "Doctor must not automatically mutate the game");
assert(doctor.includes('mode: "session-only"'), "verification must stay session-scoped");
assert(doctor.includes("publishableRuntimeEvidence: false"), "Session Verification must not become public Runtime Evidence");

assert(doctor.includes('resolverFlowId: "spawn-not-working"'), "Doctor must bind to the canonical Spawn resolver flow");
assert(doctor.includes('diagnosticSymptomId: "spawn-not-spawning"'), "Doctor must bind to the canonical Spawn diagnostic symptom");
assert(doctor.includes('apiEntryId: "spawn-spawn-creep"'), "Doctor must bind to the canonical Spawn API entry");
assert(doctor.includes('resolverStepId: "spawn-dryrun" | null'), "inconclusive Spawn snapshots must hand off to the canonical dryRun step");
assert(doctor.includes('resolverOutcomeId: "spawn-out-busy" | "spawn-out-energy" | null'), "direct Spawn blockers must reuse canonical Resolver outcomes");

assert(doctor.includes('resolverFlowId: "creep-not-moving"'), "Doctor must bind to the canonical movement resolver flow");
assert(doctor.includes('diagnosticSymptomId: "creep-not-moving"'), "Doctor must bind to the canonical movement diagnostic symptom");
assert(doctor.includes('apiEntryId: "creep-move-to"'), "Doctor must bind to the canonical movement API entry");
assert(doctor.includes("parseCreepMovementDoctorSnapshot"), "movement snapshot must use a strict parser");
assert(doctor.includes('symptom: "creep-not-moving"'), "movement snapshot symptom is missing");
assert(doctor.includes("activeMoveParts"), "movement snapshot must capture active MOVE capability");
assert(doctor.includes('resolverStepId: "move-result" | null'), "inconclusive movement snapshots must hand off to the canonical move-result step");
assert(doctor.includes('resolverOutcomeId: "move-out-tired" | null'), "fatigue must reuse the canonical Resolver outcome");
assert(doctor.includes('"no-active-move-parts"'), "movement Doctor must distinguish missing active MOVE capability");
assert(doctor.includes('"fatigue-blocked"'), "movement Doctor must distinguish fatigue from path/call failures");

const forbiddenDoctorPatterns = [
  [/\beval\s*\(/, "eval()"],
  [/\bnew\s+Function\b/, "new Function"],
  [/\.spawnCreep\s*\(/, "spawnCreep() execution"],
  [/\.moveTo\s*\(/, "moveTo() execution"],
  [/\.move\s*\(/, "move() execution"],
  [/\bMemory\s*\[/, "Memory write/read coupling"],
  [/\bMemory\s*\./, "Memory write/read coupling"],
  [/SCREEPS_TOKEN|SCREEPS_API_TOKEN/i, "Screeps token dependency"],
];

for (const [pattern, label] of forbiddenDoctorPatterns) {
  assert(!pattern.test(doctor), `Doctor core must not contain ${label}`);
  assert(!pattern.test(doctorUi), `Doctor UI must not contain ${label}`);
}

assert(!/\bfetch\s*\(/.test(doctorUi), "Doctor UI must remain local-only and must not upload Snapshot data");
assert(!/XMLHttpRequest|sendBeacon|WebSocket/.test(doctorUi), "Doctor UI must not add a network or telemetry transport");
assert(doctorUi.includes('diagnoseSpawnDoctor(snapshot)'), "Doctor UI must consume the canonical Spawn core");
assert(doctorUi.includes('diagnoseCreepMovementDoctor(snapshot)'), "Doctor UI must consume the canonical movement core");
assert(doctorUi.includes('"spawn-not-working"') && doctorUi.includes('"creep-not-moving"'), "Doctor UI must expose both supported symptoms");
assert(doctorUi.includes('maxLength={SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS}'), "Doctor UI must enforce the core Snapshot size boundary");
assert(doctorUi.includes('Session Verification') && doctorUi.includes('public Runtime Evidence'), "Doctor UI must visibly separate session verification from public Runtime Evidence");
assert(doctorUi.includes('diagnosis.symptom === "spawn-not-working"'), "Tick Lab must remain Spawn-only until a movement experiment exists");
assert(doctorUi.includes('href={`${prefix}/resolver`}') && doctorUi.includes('href={`${prefix}/diagnostics`}'), "Doctor UI must hand off to existing Resolver and Diagnostics surfaces");
assert(doctorUi.includes('href={`${prefix}/screeps-api#${diagnosis.canonical.apiEntryId}`}'), "Doctor UI must hand off to the exact canonical API entry");
assert(doctorStyles.includes(".doctor") && doctorStyles.includes(".result"), "Doctor UI styles are missing");
assert(doctorStyles.includes(".symptoms") && doctorStyles.includes(".activeSymptom"), "Doctor symptom-selector styles are missing");
assert(zhResolverPage.includes('import { ScreepsDoctor } from "@/components/screeps-doctor";'), "Chinese Resolver must expose the Doctor entry");
assert(zhResolverPage.includes('<ScreepsDoctor locale="zh" />'), "Chinese Resolver must render the Doctor entry");
assert(enResolverPage.includes('import { ScreepsDoctor } from "@/components/screeps-doctor";'), "English Resolver must expose the Doctor entry");
assert(enResolverPage.includes('<ScreepsDoctor locale="en" />'), "English Resolver must render the Doctor entry");

assert(resolver.includes('flowId: "spawn-not-working"'), "canonical Spawn resolver flow is missing");
assert(resolver.includes('symptomId: "spawn-not-spawning"'), "canonical Spawn resolver symptom binding changed");
assert(resolver.includes('stepId: "spawn-dryrun"'), "canonical Spawn dryRun step is missing");
assert(resolver.includes('stepId: "spawn-out-busy"'), "canonical Spawn busy outcome is missing");
assert(resolver.includes('stepId: "spawn-out-energy"'), "canonical Spawn Energy outcome is missing");

assert(resolver.includes('flowId: "creep-not-moving"'), "canonical movement resolver flow is missing");
assert(resolver.includes('symptomId: "creep-not-moving"'), "canonical movement resolver symptom binding changed");
assert(resolver.includes('stepId: "move-fatigue"'), "canonical movement fatigue step is missing");
assert(resolver.includes('stepId: "move-result"'), "canonical movement return-code step is missing");
assert(resolver.includes('stepId: "move-out-tired"'), "canonical movement fatigue outcome is missing");

assert(diagnostics.includes('id: "spawn-not-spawning"'), "canonical Spawn diagnostic symptom is missing");
assert(diagnostics.includes('directApiEntryIds: ["spawn-spawn-creep"]'), "Spawn diagnostic must keep its canonical API entry");
assert(diagnostics.includes('id: "creep-not-moving"'), "canonical movement diagnostic symptom is missing");
assert(diagnostics.includes('directApiEntryIds: ["creep-move-to", "game-map-find-route", "pathfinder-search"]'), "movement diagnostic must keep its canonical API entries");
assert(smokeAll.includes('await import("./check-screeps-doctor-v1.mjs");'), "Doctor regression gate must remain in the production smoke chain");

console.log("[Screeps Doctor V2] Spawn + movement core, UI, and canonical-link checks passed.");
