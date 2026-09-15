import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[Screeps Doctor V1] ${message}`);
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
assert(doctor.includes('resolverFlowId: "spawn-not-working"'), "Doctor must bind to the canonical Spawn resolver flow");
assert(doctor.includes('diagnosticSymptomId: "spawn-not-spawning"'), "Doctor must bind to the canonical diagnostic symptom");
assert(doctor.includes('apiEntryId: "spawn-spawn-creep"'), "Doctor must bind to the canonical API entry");
assert(doctor.includes('resolverStepId: "spawn-dryrun" | null'), "inconclusive read-only snapshots must hand off to the canonical dryRun step");
assert(doctor.includes('resolverOutcomeId: "spawn-out-busy" | "spawn-out-energy" | null'), "direct blockers must reuse canonical Resolver outcomes");
assert(doctor.includes('mode: "session-only"'), "verification must stay session-scoped");
assert(doctor.includes("publishableRuntimeEvidence: false"), "Session Verification must not become public Runtime Evidence");
assert(doctor.includes("assertExactKeys"), "snapshot parser must reject unknown fields");
assert(doctor.includes("doctorExecutesAction: false"), "Doctor must not automatically mutate the game");

const forbiddenDoctorPatterns = [
  [/\beval\s*\(/, "eval()"],
  [/\bnew\s+Function\b/, "new Function"],
  [/\.spawnCreep\s*\(/, "spawnCreep() execution"],
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
assert(doctorUi.includes('diagnoseSpawnDoctor(snapshot)'), "Doctor UI must consume the canonical strict parser/diagnosis core");
assert(doctorUi.includes('maxLength={SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS}'), "Doctor UI must enforce the core Snapshot size boundary");
assert(doctorUi.includes('Session Verification') && doctorUi.includes('public Runtime Evidence'), "Doctor UI must visibly separate session verification from public Runtime Evidence");
assert(doctorUi.includes('href={`${prefix}/resolver`}') && doctorUi.includes('href={`${prefix}/diagnostics`}'), "Doctor UI must hand off to existing Resolver and Diagnostics surfaces");
assert(doctorUi.includes('href={`${prefix}/screeps-api`}') && doctorUi.includes('href={`${prefix}/tick-lab`}'), "Doctor UI must preserve API and Tick Lab handoffs");
assert(doctorStyles.includes(".doctor") && doctorStyles.includes(".result"), "Doctor UI styles are missing");
assert(zhResolverPage.includes('import { ScreepsDoctor } from "@/components/screeps-doctor";'), "Chinese Resolver must expose the Doctor entry");
assert(zhResolverPage.includes('<ScreepsDoctor locale="zh" />'), "Chinese Resolver must render the Doctor entry");
assert(enResolverPage.includes('import { ScreepsDoctor } from "@/components/screeps-doctor";'), "English Resolver must expose the Doctor entry");
assert(enResolverPage.includes('<ScreepsDoctor locale="en" />'), "English Resolver must render the Doctor entry");

assert(resolver.includes('flowId: "spawn-not-working"'), "canonical Spawn resolver flow is missing");
assert(resolver.includes('symptomId: "spawn-not-spawning"'), "canonical Spawn resolver symptom binding changed");
assert(resolver.includes('stepId: "spawn-dryrun"'), "canonical Spawn dryRun step is missing");
assert(resolver.includes('stepId: "spawn-out-busy"'), "canonical busy outcome is missing");
assert(resolver.includes('stepId: "spawn-out-energy"'), "canonical Energy outcome is missing");

assert(diagnostics.includes('id: "spawn-not-spawning"'), "canonical Spawn diagnostic symptom is missing");
assert(diagnostics.includes('directApiEntryIds: ["spawn-spawn-creep"]'), "Spawn diagnostic must keep its canonical API entry");
assert(smokeAll.includes('await import("./check-screeps-doctor-v1.mjs");'), "Doctor V1 regression gate must remain in the production smoke chain");

console.log("[Screeps Doctor V1] core, UI, and canonical-link checks passed.");
