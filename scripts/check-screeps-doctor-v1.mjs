import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

const root = process.cwd();
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[Screeps Doctor V2] ${message}`);
};

const [doctor, doctorLauncher, doctorUi, doctorStyles, homeProblemHub, resolver, diagnostics, zhResolverPage, enResolverPage, smokeAll] = await Promise.all([
  read("src/lib/screeps-doctor.ts"),
  read("src/lib/screeps-doctor-launcher.ts"),
  read("src/components/screeps-doctor.tsx"),
  read("src/components/screeps-doctor.module.css"),
  read("src/components/home-problem-hub.tsx"),
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

assert(doctor.includes('resolverFlowId: "creep-not-harvesting"'), "Doctor must bind to the canonical harvest resolver flow");
assert(doctor.includes('diagnosticSymptomId: "creep-not-harvesting"'), "Doctor must bind to the canonical harvest diagnostic symptom");
assert(doctor.includes('apiEntryId: "creep-harvest"'), "Doctor must bind to the canonical harvest API entry");
assert(doctor.includes("parseCreepHarvestDoctorSnapshot"), "harvest snapshot must use a strict parser");
assert(doctor.includes('symptom: "creep-not-harvesting"'), "harvest snapshot symptom is missing");
assert(doctor.includes("activeWorkParts"), "harvest snapshot must capture active WORK capability");
assert(doctor.includes('resolverStepId: "harvest-result" | null'), "inconclusive harvest snapshots must hand off to the canonical harvest-result step");
assert(doctor.includes('"no-active-work-parts"'), "harvest Doctor must distinguish missing active WORK capability");
assert(doctor.includes('"target-not-visible"'), "harvest Doctor must distinguish stale or non-visible targets");
assert(doctor.includes('"target-out-of-range"'), "harvest Doctor must distinguish range blockers without guessing return-code truth");
assert(doctor.includes("resolverOutcomeId: null"), "harvest read-only blockers must not invent exact return-code outcomes");

assert(doctorLauncher.includes("SPAWN_DOCTOR_CANONICAL_REFERENCES"), "Doctor launcher must derive Spawn routing from the canonical Doctor references");
assert(doctorLauncher.includes("MOVEMENT_DOCTOR_CANONICAL_REFERENCES"), "Doctor launcher must derive movement routing from the canonical Doctor references");
assert(doctorLauncher.includes("HARVEST_DOCTOR_CANONICAL_REFERENCES"), "Doctor launcher must derive harvest routing from the canonical Doctor references");
assert(doctorLauncher.includes("getScreepsDoctorLaunchByDiagnosticSymptom"), "Doctor launcher must map canonical Diagnostic symptoms to supported Doctor symptoms");
assert(doctorLauncher.includes("parseScreepsDoctorLaunchSymptom"), "Doctor launcher must strictly validate URL preselection values");

const forbiddenDoctorPatterns = [
  [/\beval\s*\(/, "eval()"],
  [/\bnew\s+Function\b/, "new Function"],
  [/\.spawnCreep\s*\(/, "spawnCreep() execution"],
  [/\.moveTo\s*\(/, "moveTo() execution"],
  [/\.move\s*\(/, "move() execution"],
  [/\.harvest\s*\(/, "harvest() execution"],
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
assert(doctorUi.includes('diagnoseCreepHarvestDoctor(snapshot)'), "Doctor UI must consume the canonical harvest core");
assert(
  doctorUi.includes('"spawn-not-working"') && doctorUi.includes('"creep-not-moving"') && doctorUi.includes('"creep-not-harvesting"'),
  "Doctor UI must expose all three supported symptoms",
);
assert(doctorUi.includes('parseScreepsDoctorLaunchSymptom(new URLSearchParams(window.location.search).get("doctor"))'), "Doctor UI must support bounded canonical URL symptom preselection");
assert(doctorUi.includes('maxLength={SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS}'), "Doctor UI must enforce the core Snapshot size boundary");
assert(doctorUi.includes('Session Verification') && doctorUi.includes('public Runtime Evidence'), "Doctor UI must visibly separate session verification from public Runtime Evidence");
assert(doctorUi.includes('diagnosis.symptom === "spawn-not-working"'), "Tick Lab must remain Spawn-only until movement or harvest experiments exist");
const resolverHandoff = doctorUi.match(/<a\b[\s\S]*?doctor_resolver_handoff_clicked[\s\S]*?<\/a>/)?.[0] ?? "";
assert(doctorUi.includes('import { getProblemResolverDeepLink } from "@/lib/problem-resolver";'), "Doctor must reuse the canonical Resolver deep-link helper");
assert(resolverHandoff.includes('href={getProblemResolverDeepLink(diagnosis.canonical.resolverFlowId, locale)'), "Doctor result must bind its canonical flow and locale to the Resolver href");
assert(resolverHandoff.includes("flowId: diagnosis.canonical.resolverFlowId"), "Resolver handoff telemetry must use the same canonical flow as the link");
assert(resolverHandoff.includes("target.pathname === window.location.pathname && target.search === window.location.search") && resolverHandoff.includes("window.location.hash = target.hash") && resolverHandoff.includes("window.location.reload()"), "same-document Doctor handoffs must reload at the canonical anchor so previous Resolver state cannot override the flow");
assert(resolverHandoff.includes("event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey"), "Doctor handoff must preserve modified-click navigation");
assert(doctorUi.includes('href={`${prefix}/diagnostics`}'), "Doctor UI must hand off to the existing Diagnostics surface");

const resolverModule = ts.transpileModule(resolver, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { getProblemResolverDeepLink, getProblemResolverFlow } = await import(
  `data:text/javascript;base64,${Buffer.from(resolverModule).toString("base64")}`
);
for (const [flowId, startStepId] of [
  ["spawn-not-working", "spawn-busy"],
  ["creep-not-moving", "move-fatigue"],
  ["creep-not-harvesting", "harvest-result"],
]) {
  const flow = getProblemResolverFlow(flowId);
  assert(flow?.startStepId === startStepId, `${flowId} must retain its necessary starting question`);
  assert(flow.steps.find((step) => step.stepId === startStepId)?.kind === "question", `${flowId} must not deep-link directly to an outcome`);
  for (const locale of ["zh", "en"]) {
    const base = locale === "en" ? "/en/resolver" : "/resolver";
    const href = getProblemResolverDeepLink(flowId, locale);
    assert(href === `${base}?flow=${flowId}#problem-resolver-${locale}`, `${locale}/${flowId} must use the canonical flow and anchor`);
    const url = new URL(href, "https://example.invalid");
    assert([...url.searchParams.keys()].join(",") === "flow", "Doctor handoff URL must carry only the canonical flow, never Snapshot or sensitive data");
  }
}
for (const locale of ["zh", "en"]) {
  assert(getProblemResolverDeepLink("unknown-flow", locale) === null, "Resolver deep links must reject unknown flow IDs");
}
assert(doctorUi.includes('href={`${prefix}/screeps-api#${diagnosis.canonical.apiEntryId}`}'), "Doctor UI must hand off to the exact canonical API entry");
assert(doctorStyles.includes(".doctor") && doctorStyles.includes(".result"), "Doctor UI styles are missing");
assert(doctorStyles.includes(".symptoms") && doctorStyles.includes(".activeSymptom"), "Doctor symptom-selector styles are missing");
assert(homeProblemHub.includes("getScreepsDoctorLaunchByDiagnosticSymptom(symptom.id)"), "Home Problem Hub must derive Doctor eligibility from the shared launcher contract");
assert(homeProblemHub.includes('`/resolver?doctor=${doctorLaunch.doctorSymptom}#screeps-doctor`'), "supported homepage symptoms must deep-link into the canonical Doctor surface");
assert(homeProblemHub.includes('`/diagnostics#${symptom.id}`'), "unsupported homepage symptoms must remain on the Diagnostics surface");
assert(homeProblemHub.includes('"creep-not-harvesting"'), "Home Problem Hub must expose the supported harvest Doctor quick start");
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
assert(resolver.includes('flowId: "creep-not-harvesting"'), "canonical harvest resolver flow is missing");
assert(resolver.includes('symptomId: "creep-not-harvesting"'), "canonical harvest resolver symptom binding changed");
assert(resolver.includes('stepId: "harvest-result"'), "canonical harvest return-code step is missing");
assert(resolver.includes('stepId: "harvest-out-range"'), "canonical harvest range outcome is missing");
assert(resolver.includes('stepId: "harvest-out-body"'), "canonical harvest WORK outcome is missing");
assert(resolver.includes('stepId: "harvest-out-capture"'), "canonical harvest capture outcome is missing");

assert(diagnostics.includes('id: "spawn-not-spawning"'), "canonical Spawn diagnostic symptom is missing");
assert(diagnostics.includes('directApiEntryIds: ["spawn-spawn-creep"]'), "Spawn diagnostic must keep its canonical API entry");
assert(diagnostics.includes('id: "creep-not-moving"'), "canonical movement diagnostic symptom is missing");
assert(diagnostics.includes('directApiEntryIds: ["creep-move-to", "game-map-find-route", "pathfinder-search"]'), "movement diagnostic must keep its canonical API entries");
assert(diagnostics.includes('id: "creep-not-harvesting"'), "canonical harvest diagnostic symptom is missing");
assert(diagnostics.includes('directApiEntryIds: ["creep-harvest"]'), "harvest diagnostic must keep its canonical API entry");
assert(smokeAll.includes('await import("./check-screeps-doctor-v1.mjs");'), "Doctor regression gate must remain in the production smoke chain");

// Execute the current UI handlers in a bounded React-state harness. This is not a browser test.
const compile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const loadModule = (source, dependencies = {}) => {
  const exports = {};
  runInNewContext(compile(source), {
    exports,
    Error,
    require: (name) => {
      assert(Object.hasOwn(dependencies, name), `Unexpected module in Doctor harness: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
};
const core = loadModule(doctor);
const sourceFile = ts.createSourceFile("screeps-doctor.tsx", doctorUi, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const supportNames = new Set(["SAMPLE_SNAPSHOTS", "CAPTURE_COPY", "CAPTURE_GUIDANCE", "SNAPSHOT_ERROR_COPY", "nextSnapshotSource", "getSnapshotErrorHelp"]);
const supportSource = sourceFile.statements.filter((statement) => {
  if (ts.isFunctionDeclaration(statement)) return supportNames.has(statement.name?.text);
  return ts.isVariableStatement(statement) && statement.declarationList.declarations.some((declaration) => ts.isIdentifier(declaration.name) && supportNames.has(declaration.name.text));
}).map((statement) => statement.getText(sourceFile)).join("\n");
const support = loadModule(`${supportSource}\nexport { ${[...supportNames].join(", ")} };`);
const diagnose = {
  "spawn-not-working": core.diagnoseSpawnDoctor,
  "creep-not-moving": core.diagnoseCreepMovementDoctor,
  "creep-not-harvesting": core.diagnoseCreepHarvestDoctor,
};
const expectedClassifications = ["energy-blocked", "fatigue-blocked", "target-out-of-range"];
const leafPaths = (value, prefix = "") => Object.entries(value).flatMap(([key, item]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  return item !== null && typeof item === "object" ? leafPaths(item, path) : [path];
});
for (const [index, symptom] of Object.keys(diagnose).entries()) {
  const sample = support.SAMPLE_SNAPSHOTS[symptom];
  const result = diagnose[symptom](sample);
  assert(result.classification === expectedClassifications[index], `Example diagnosis changed for ${symptom}`);
  assert(sample.length <= core.SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS, "Displayed examples must fit the parser limit");
  const fields = support.CAPTURE_GUIDANCE[symptom].fields;
  assert([...fields.map((field) => field.path)].sort().join("|") === leafPaths(JSON.parse(sample)).sort().join("|"), `Guidance must describe exactly the canonical fields for ${symptom}`);
  for (const locale of ["zh", "en"]) {
    const guide = support.CAPTURE_GUIDANCE[symptom];
    assert(guide.steps[locale] && guide.mistakes[locale] && guide.verify[locale], `${locale}/${symptom} guidance is incomplete`);
    assert(fields.every((field) => field.description[locale]), `${locale}/${symptom} field descriptions are incomplete`);
  }
}

const spawnSample = JSON.parse(support.SAMPLE_SNAPSHOTS["spawn-not-working"]);
const movementSample = JSON.parse(support.SAMPLE_SNAPSHOTS["creep-not-moving"]);
const harvestSample = JSON.parse(support.SAMPLE_SNAPSHOTS["creep-not-harvesting"]);
for (const [snapshot, fn, expected] of [
  [{ ...spawnSample, room: { visible: false, energyAvailable: null }, spawn: { visible: false, owned: null, spawning: null, remainingTime: null }, request: { bodyCost: null } }, core.diagnoseSpawnDoctor, "room-not-visible"],
  [{ ...spawnSample, spawn: { visible: false, owned: null, spawning: null, remainingTime: null } }, core.diagnoseSpawnDoctor, "spawn-not-visible"],
  [{ ...spawnSample, spawn: { visible: true, owned: true, spawning: true, remainingTime: 5 } }, core.diagnoseSpawnDoctor, "spawn-busy"],
  [{ ...spawnSample, request: { bodyCost: null } }, core.diagnoseSpawnDoctor, "return-code-required"],
  [{ ...movementSample, creep: { visible: false, owned: null, fatigue: null, activeMoveParts: null } }, core.diagnoseCreepMovementDoctor, "creep-not-visible"],
  [{ ...harvestSample, target: { visible: false, inRange: null } }, core.diagnoseCreepHarvestDoctor, "target-not-visible"],
  [{ ...harvestSample, creep: { visible: false, owned: null, activeWorkParts: null }, target: { visible: true, inRange: null } }, core.diagnoseCreepHarvestDoctor, "creep-not-visible"],
]) assert(fn(JSON.stringify(snapshot)).classification === expected, `Unavailable/unknown/busy case failed: ${expected}`);

const invalidSnapshots = [
  ["{", core.parseSpawnDoctorSnapshot],
  [JSON.stringify({ ...spawnSample, version: "1" }), core.parseSpawnDoctorSnapshot],
  [JSON.stringify({ ...spawnSample, symptom: "creep-not-moving" }), core.parseSpawnDoctorSnapshot],
  [JSON.stringify({ ...spawnSample, room: { visible: true } }), core.parseSpawnDoctorSnapshot],
  [JSON.stringify({ ...spawnSample, privateMarker: "DO_NOT_ECHO" }), core.parseSpawnDoctorSnapshot],
  [JSON.stringify({ ...spawnSample, room: { visible: true, energyAvailable: "300" } }), core.parseSpawnDoctorSnapshot],
  [JSON.stringify({ ...spawnSample, spawn: { ...spawnSample.spawn, owned: "true" } }), core.parseSpawnDoctorSnapshot],
  [JSON.stringify({ ...spawnSample, room: { visible: false, energyAvailable: 300 } }), core.parseSpawnDoctorSnapshot],
  [JSON.stringify({ ...spawnSample, spawn: { ...spawnSample.spawn, remainingTime: 0 } }), core.parseSpawnDoctorSnapshot],
  [JSON.stringify({ ...spawnSample, spawn: { ...spawnSample.spawn, remainingTime: 2 } }), core.parseSpawnDoctorSnapshot],
  [JSON.stringify({ ...spawnSample, spawn: { ...spawnSample.spawn, spawning: true } }), core.parseSpawnDoctorSnapshot],
  [JSON.stringify({ ...movementSample, creep: { ...movementSample.creep, fatigue: null } }), core.parseCreepMovementDoctorSnapshot],
  [JSON.stringify({ ...movementSample, creep: { ...movementSample.creep, visible: false } }), core.parseCreepMovementDoctorSnapshot],
  [JSON.stringify({ ...harvestSample, target: { visible: false, inRange: false } }), core.parseCreepHarvestDoctorSnapshot],
  [JSON.stringify({ ...harvestSample, target: { visible: true, inRange: null } }), core.parseCreepHarvestDoctorSnapshot],
  [" ".repeat(4097), core.parseSpawnDoctorSnapshot],
];
for (const [input, parse] of invalidSnapshots) {
  let message;
  try { parse(input); } catch (error) { message = error.message; }
  assert(message, "Invalid Snapshot must remain rejected by the canonical parser");
  for (const locale of ["zh", "en"]) {
    const explanation = support.getSnapshotErrorHelp(message, locale);
    assert(explanation && !explanation.includes("could not be classified") && !explanation.includes("无法解释"), `${locale} error needs a verified classification: ${message}`);
    assert(!explanation.includes("DO_NOT_ECHO") && !explanation.includes("privateMarker"), "Error explanation must not echo arbitrary input keys or values");
  }
}
for (const message of ["Unknown DO_NOT_ECHO", "constructor", "__proto__"]) {
  for (const locale of ["zh", "en"]) {
    const help = support.getSnapshotErrorHelp(message, locale);
    assert(typeof help === "string" && !help.includes("DO_NOT_ECHO"), "Unknown errors must use a safe local fallback");
  }
}
const require = createRequire(import.meta.url);
const jsxRuntime = require("react/jsx-runtime");
const launcherModule = loadModule(doctorLauncher, { "./screeps-doctor": core });
const resolverCommonJs = loadModule(resolver);
let hookIndex = 0;
let state = [];
let telemetry = [];
const ui = loadModule(doctorUi, {
  "react/jsx-runtime": jsxRuntime,
  "react": {
    useEffect: () => undefined,
    useState: (initial) => {
      const index = hookIndex++;
      if (!(index in state)) state[index] = initial;
      return [state[index], (next) => { state[index] = typeof next === "function" ? next(state[index]) : next; }];
    },
  },
  "next/link": { __esModule: true, default: "a" },
  "@/lib/problem-resolver": resolverCommonJs,
  "@/lib/screeps-doctor": core,
  "@/lib/screeps-doctor-launcher": launcherModule,
  "@/lib/screeps-doctor-telemetry-client": { trackScreepsDoctorEvent: (event) => telemetry.push(event) },
  "./screeps-doctor.module.css": { __esModule: true, default: new Proxy({}, { get: (_, name) => name }) },
});
const nodes = (node) => {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object" || !node.props) return [];
  return [node, ...nodes(node.props.children)];
};
const content = (node) => {
  if (Array.isArray(node)) return node.map(content).join("");
  if (node && typeof node === "object") return content(node.props?.children);
  return node === null || node === undefined || typeof node === "boolean" ? "" : String(node);
};
const render = (locale) => { hookIndex = 0; return ui.ScreepsDoctor({ locale }); };
const find = (tree, predicate) => {
  const result = nodes(tree).find(predicate);
  assert(result, "Expected Doctor UI element is missing");
  return result;
};
const button = (tree, label) => find(tree, (node) => node.type === "button" && content(node) === label);
for (const locale of ["zh", "en"]) {
  state = []; telemetry = [];
  for (const symptom of Object.keys(diagnose)) {
    let tree = render(locale);
    const symptomButton = nodes(tree).find((node) => node.type === "button" && node.props.onClick && content(node) === ({ "spawn-not-working": { zh: "Spawn 不工作", en: "Spawn not working" }, "creep-not-moving": { zh: "Creep 不移动", en: "Creep not moving" }, "creep-not-harvesting": { zh: "Creep 不采集", en: "Creep not harvesting" } })[symptom][locale]);
    symptomButton.props.onClick(); tree = render(locale);
    const details = find(tree, (node) => node.type === "details");
    assert(details.props.open === undefined && !details.props.onToggle, "Capture help must default closed and have no state-mutating toggle handler");
    assert(content(details).includes(support.CAPTURE_GUIDANCE[symptom].steps[locale]), "Help must follow the current symptom and locale");
    assert(!nodes(tree).some((node) => node.props.id === "screeps-doctor-example"), "Switching symptoms must clear example provenance");
    const shownFields = nodes(details).filter((node) => node.type === "dt").map((node) => content(node.props.children[0]));
    assert(shownFields.join("|") === support.CAPTURE_GUIDANCE[symptom].fields.map((field) => field.path).join("|"), "Displayed fields must match only the selected symptom");
    button(tree, locale === "zh" ? "载入示例" : "Load example").props.onClick(); tree = render(locale);
    assert(content(tree).includes(support.CAPTURE_COPY[locale].example), "Loaded samples must be labelled demonstration data");
    const textarea = find(tree, (node) => node.type === "textarea");
    assert(textarea.props.value === support.SAMPLE_SNAPSHOTS[symptom], "Load example must preserve the existing sample");
    const eventCount = telemetry.length;
    for (let attempt = 0; attempt < 2; attempt++) {
      button(tree, locale === "zh" ? "开始诊断" : "Diagnose").props.onClick(); tree = render(locale);
      assert(content(tree).includes(support.CAPTURE_COPY[locale].example), "Repeated example diagnoses must retain the demonstration label");
      const href = find(tree, (node) => node.type === "a" && node.props.href === getProblemResolverDeepLink(symptom, locale)).props.href;
      assert(href.includes(`flow=${symptom}`), "Diagnosed example must preserve canonical Resolver handoff");
    }
    assert(telemetry.length === eventCount + 2, "Diagnosis telemetry cardinality must remain unchanged");
    find(tree, (node) => node.type === "textarea").props.onChange({ target: { value: `${textarea.props.value}\n` } }); tree = render(locale);
    assert(content(tree).includes(support.CAPTURE_COPY[locale].editedExample), "Editing a sample must retain its provenance reminder");
    assert(!nodes(tree).some((node) => node.props.className === "result"), "Editing input must remove stale diagnosis results");
    button(tree, locale === "zh" ? "清空" : "Clear").props.onClick(); tree = render(locale);
    assert(find(tree, (node) => node.type === "textarea").props.value === "", "Clear must empty the input");
    assert(!nodes(tree).some((node) => node.props.id === "screeps-doctor-example"), "Clear must remove example provenance");
    find(tree, (node) => node.type === "textarea").props.onChange({ target: { value: support.SAMPLE_SNAPSHOTS[symptom] } }); tree = render(locale);
    assert(!nodes(tree).some((node) => node.props.id === "screeps-doctor-example"), "Fully manual input must not be labelled a loaded example or verified fact");
    find(tree, (node) => node.type === "textarea").props.onChange({ target: { value: "{" } }); tree = render(locale);
    const beforeInvalid = telemetry.length;
    button(tree, locale === "zh" ? "开始诊断" : "Diagnose").props.onClick(); tree = render(locale);
    assert(content(find(tree, (node) => node.props.role === "alert")).includes(support.getSnapshotErrorHelp("Snapshot must be valid JSON.", locale)), "UI must use the actual parser error's localized explanation");
    assert(telemetry.length === beforeInvalid, "Invalid input must not emit diagnosis telemetry");
    assert(!JSON.stringify(telemetry).includes("snapshot") && !JSON.stringify(telemetry).includes("DO_NOT_ECHO"), "Snapshot and raw errors must stay out of telemetry");
  }
}
assert(doctorStyles.includes(".captureHelp summary:focus-visible") && doctorStyles.includes("white-space: pre-wrap") && doctorStyles.includes("overflow-wrap: anywhere"), "Guidance needs keyboard focus and wrapping styles");

console.log("[Doctor Snapshot Guidance] Six bilingual handler/field cases, example provenance, strict parser cases, localized errors, and telemetry boundaries passed; browser validation remains separate.");

console.log("[Screeps Doctor V2] Spawn + movement + harvest core, UI, quick-start launcher, and canonical-link checks passed.");
