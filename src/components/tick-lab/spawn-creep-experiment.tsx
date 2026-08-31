"use client";

import Link from "next/link";
import { useState } from "react";

import {
  evaluateSpawnCreep,
  getSpawnBodyCost,
  getSpawnTime,
  spawnBodyPresets,
  type SpawnBodyPresetKey,
  type SpawnCreepEvaluation,
  type SpawnCreepScenario,
  type SpawnCreepStepKey,
} from "@/lib/tick-lab";

import spawnStyles from "./spawn-creep-experiment.module.css";
import styles from "./tick-lab.module.css";

type TickLabLanguage = "zh" | "en";

interface SpawnCreepExperimentProps {
  language: TickLabLanguage;
}

const stepLabels: Record<TickLabLanguage, Record<SpawnCreepStepKey, string>> = {
  zh: {
    "read-spawn": "读取受控 Spawn1 / Room 状态",
    "validate-call": "验证固定 name / options 参数",
    "check-name": "检查 Worker1 名字是否已存在或已被本 Tick 预留",
    "check-owner": "检查 Spawn 所有权（本实验固定通过）",
    "check-busy": "检查 Spawn1 是否正在生成另一个 Creep",
    "check-rcl-body": "检查 RCL 与 body 合法性（本实验固定通过）",
    "check-energy": "检查 Room energyAvailable 是否覆盖 body cost",
    "submit-intent": "提交 spawnCreep intent",
    "model-spawning": "应用受控 intent，计算模型化 spawning 状态",
  },
  en: {
    "read-spawn": "Read the constrained Spawn1 / Room state",
    "validate-call": "Validate the fixed name / options arguments",
    "check-name": "Check whether Worker1 already exists or is reserved this Tick",
    "check-owner": "Check Spawn ownership (fixed to pass in this lab)",
    "check-busy": "Check whether Spawn1 is already spawning another Creep",
    "check-rcl-body": "Check RCL and body validity (fixed to pass in this lab)",
    "check-energy": "Check whether Room energyAvailable covers body cost",
    "submit-intent": "Submit the spawnCreep intent",
    "model-spawning": "Apply the constrained intent and model spawning state",
  },
};

const copy = {
  zh: {
    experiment: "实验 02 / Spawn Creep",
    experimentLead: "用一个受控 StructureSpawn.spawnCreep() 调用观察名字、Busy 与 Energy 检查如何决定返回码。",
    boundaryTitle: "受控边界",
    boundaryBody: "Spawn1 固定为己方、RCL 可用，name 固定为 Worker1，options 固定为空对象，body 只允许三个有效预设，并使用默认 Room energyAvailable。V1 不模拟 energyStructures 分配、directions、dryRun、出口阻塞或多个 Spawn 的竞争。",
    worldState: "Tick 200 · World State",
    code: "Code",
    nextState: "Tick 201 · 模型化下一状态",
    spawn: "Spawn1",
    room: "Room",
    worker: "Worker1",
    state: "State",
    idle: "Idle",
    busy: "Busy",
    spawning: "Spawning Worker1",
    energyAvailable: "energyAvailable",
    nameState: "Name",
    nameFree: "Worker1 可用",
    nameTaken: "Worker1 已存在",
    body: "Body",
    bodyCost: "Body cost",
    spawnTime: "Spawn time",
    parts: "parts",
    pending: "运行 Tick 后显示 spawning 状态",
    noNewSpawn: "没有新的 spawn intent；受控世界状态保持不变。",
    presets: "直接试一个 Spawn 分支",
    presetsLead: "这些场景同时体现真实检查优先级：名字冲突先于 Busy，Busy 又先于 Energy。",
    presetSuccess: "成功",
    presetSuccessDetail: "200 cost / 300 energy",
    presetExact: "刚好够",
    presetExactDetail: "200 cost / 200 energy",
    presetEnergy: "能量不足",
    presetEnergyDetail: "300 cost / 250 energy",
    presetBusy: "Spawn Busy",
    presetBusyDetail: "busy + enough energy",
    presetName: "名字冲突",
    presetNameDetail: "Worker1 exists",
    presetOrder: "多重失败",
    presetOrderDetail: "name + busy + 0 energy",
    controls: "自定义 Spawn 参数",
    controlsLead: "改变 body、Room 能量、Busy 与名字占用状态，再运行一次。",
    bodyPreset: "Body preset",
    roomEnergy: "Room energyAvailable",
    spawnBusy: "Spawn busy",
    nameExists: "Worker1 exists",
    yes: "Yes",
    no: "No",
    reset: "重置",
    run: "Run Spawn Tick ▶",
    timeline: "Spawn Timeline",
    result: "Return Code",
    intent: "Spawn Intent",
    intentSubmitted: "已提交",
    intentNotSubmitted: "未提交",
    modeledEnergy: "模型化剩余 Room Energy",
    explanation: "发生了什么",
    ready: "选择场景或调整参数，然后运行这个 Tick。",
    ok: "API 返回 OK，只表示 spawnCreep operation 已成功调度，并不表示 Creep 已完成生成。本实验随后应用受控 intent，展示模型化的 spawning 状态。",
    nameFailure: "Worker1 已存在（或已被本 Tick 更早的 spawnCreep 调用预留），因此先返回 ERR_NAME_EXISTS；Engine 不会继续走到 Busy 或 Energy 检查。",
    busyFailure: "名字可用，但 Spawn1 已在生成另一个 Creep，因此返回 ERR_BUSY；Engine 在这个分支不会继续检查本次 body 的能量是否足够。",
    energyFailure: "名字可用、Spawn1 空闲且固定 RCL/body 检查通过，但 Room energyAvailable 小于 body cost，因此返回 ERR_NOT_ENOUGH_ENERGY。",
    liveBoundary: "注意：Tick 201 与剩余能量是受控教学模型计算结果，不是从真实 shard 捕获的 Runtime Evidence。",
    related: "继续查询 Spawn",
    guide: "spawnCreep 返回码教程",
    api: "StructureSpawn API",
    errors: "错误码",
    diagnostics: "Diagnostics",
    evidence: "Runtime Evidence",
    pass: "通过",
    fail: "失败",
    skipped: "未执行",
    workerPreset: "Worker · 200",
    builderPreset: "Builder · 300",
    haulerPreset: "Hauler · 250",
  },
  en: {
    experiment: "Experiment 02 / Spawn Creep",
    experimentLead: "Use one constrained StructureSpawn.spawnCreep() call to see how name, Busy, and Energy checks determine the return code.",
    boundaryTitle: "Controlled boundary",
    boundaryBody: "Spawn1 is fixed as owned and RCL-usable, the name is Worker1, options is an empty object, the body is limited to three valid presets, and default Room energyAvailable is used. V1 does not model energyStructures distribution, directions, dryRun, exit blocking, or competing Spawns.",
    worldState: "Tick 200 · World State",
    code: "Code",
    nextState: "Tick 201 · Modeled next state",
    spawn: "Spawn1",
    room: "Room",
    worker: "Worker1",
    state: "State",
    idle: "Idle",
    busy: "Busy",
    spawning: "Spawning Worker1",
    energyAvailable: "energyAvailable",
    nameState: "Name",
    nameFree: "Worker1 available",
    nameTaken: "Worker1 already exists",
    body: "Body",
    bodyCost: "Body cost",
    spawnTime: "Spawn time",
    parts: "parts",
    pending: "Run the Tick to reveal the modeled spawning state",
    noNewSpawn: "No new spawn intent is submitted; the constrained world state stays unchanged.",
    presets: "Try a Spawn branch directly",
    presetsLead: "These scenarios also expose the checked priority: name conflict comes before Busy, and Busy comes before Energy.",
    presetSuccess: "Success",
    presetSuccessDetail: "200 cost / 300 energy",
    presetExact: "Exact energy",
    presetExactDetail: "200 cost / 200 energy",
    presetEnergy: "Not enough energy",
    presetEnergyDetail: "300 cost / 250 energy",
    presetBusy: "Spawn busy",
    presetBusyDetail: "busy + enough energy",
    presetName: "Name exists",
    presetNameDetail: "Worker1 exists",
    presetOrder: "Multiple failures",
    presetOrderDetail: "name + busy + 0 energy",
    controls: "Custom Spawn controls",
    controlsLead: "Change the body, Room energy, Busy state, and name occupancy, then run another Tick.",
    bodyPreset: "Body preset",
    roomEnergy: "Room energyAvailable",
    spawnBusy: "Spawn busy",
    nameExists: "Worker1 exists",
    yes: "Yes",
    no: "No",
    reset: "Reset",
    run: "Run Spawn Tick ▶",
    timeline: "Spawn Timeline",
    result: "Return Code",
    intent: "Spawn Intent",
    intentSubmitted: "Submitted",
    intentNotSubmitted: "Not submitted",
    modeledEnergy: "Modeled Room Energy left",
    explanation: "What happened",
    ready: "Pick a scenario or adjust the controls, then run this Tick.",
    ok: "The API returns OK only because the spawnCreep operation was scheduled successfully; the Creep is not finished. The lab then applies that constrained intent to show modeled spawning state.",
    nameFailure: "Worker1 already exists (or was reserved by an earlier spawnCreep call this Tick), so ERR_NAME_EXISTS is returned first. The Engine does not continue to Busy or Energy checks for this call.",
    busyFailure: "The name is available, but Spawn1 is already spawning another Creep, so the call returns ERR_BUSY before checking whether this body's energy requirement can be met.",
    energyFailure: "The name is available, Spawn1 is idle, and the fixed RCL/body checks pass, but Room energyAvailable is below the body cost, so the call returns ERR_NOT_ENOUGH_ENERGY.",
    liveBoundary: "Note: Tick 201 and the remaining energy are calculated by the constrained teaching model; they are not Runtime Evidence captured from a real shard.",
    related: "Continue with Spawn",
    guide: "spawnCreep return-code guide",
    api: "StructureSpawn API",
    errors: "Return codes",
    diagnostics: "Diagnostics",
    evidence: "Runtime Evidence",
    pass: "Pass",
    fail: "Fail",
    skipped: "Skipped",
    workerPreset: "Worker · 200",
    builderPreset: "Builder · 300",
    haulerPreset: "Hauler · 250",
  },
} as const;

const bodyPresetOrder: SpawnBodyPresetKey[] = ["worker", "builder", "hauler"];

function bodyLabel(language: TickLabLanguage, preset: SpawnBodyPresetKey) {
  const text = copy[language];
  if (preset === "worker") return text.workerPreset;
  if (preset === "builder") return text.builderPreset;
  return text.haulerPreset;
}

function explanationFor(language: TickLabLanguage, result: SpawnCreepEvaluation) {
  const text = copy[language];
  if (!result.failure) return text.ok;
  if (result.failure === "name") return text.nameFailure;
  if (result.failure === "busy") return text.busyFailure;
  return text.energyFailure;
}

export function SpawnCreepExperiment({ language }: SpawnCreepExperimentProps) {
  const text = copy[language];
  const [bodyPreset, setBodyPreset] = useState<SpawnBodyPresetKey>("worker");
  const [energyAvailable, setEnergyAvailable] = useState(300);
  const [spawnBusy, setSpawnBusy] = useState(false);
  const [nameExists, setNameExists] = useState(false);
  const [result, setResult] = useState<SpawnCreepEvaluation | null>(null);
  const bodyParts = spawnBodyPresets[bodyPreset].parts;
  const bodyCost = getSpawnBodyCost(bodyPreset);
  const spawnTime = getSpawnTime(bodyPreset);
  const isEnglish = language === "en";

  const links = isEnglish
    ? {
        guide: "/en/blog/screeps-spawncreep-return-codes",
        api: "/en/screeps-api/structure-spawn",
        errors: "/en/screeps-errors",
        diagnostics: "/en/diagnostics",
        evidence: "/en/verified",
      }
    : {
        guide: "/blog/screeps-spawncreep-return-codes",
        api: "/screeps-api/structure-spawn",
        errors: "/screeps-errors",
        diagnostics: "/diagnostics",
        evidence: "/verified",
      };

  const presets: Array<{ key: string; scenario: SpawnCreepScenario; label: string; detail: string }> = [
    { key: "success", scenario: { bodyPreset: "worker", energyAvailable: 300, spawnBusy: false, nameExists: false }, label: text.presetSuccess, detail: text.presetSuccessDetail },
    { key: "exact", scenario: { bodyPreset: "worker", energyAvailable: 200, spawnBusy: false, nameExists: false }, label: text.presetExact, detail: text.presetExactDetail },
    { key: "energy", scenario: { bodyPreset: "builder", energyAvailable: 250, spawnBusy: false, nameExists: false }, label: text.presetEnergy, detail: text.presetEnergyDetail },
    { key: "busy", scenario: { bodyPreset: "worker", energyAvailable: 300, spawnBusy: true, nameExists: false }, label: text.presetBusy, detail: text.presetBusyDetail },
    { key: "name", scenario: { bodyPreset: "worker", energyAvailable: 300, spawnBusy: false, nameExists: true }, label: text.presetName, detail: text.presetNameDetail },
    { key: "order", scenario: { bodyPreset: "worker", energyAvailable: 0, spawnBusy: true, nameExists: true }, label: text.presetOrder, detail: text.presetOrderDetail },
  ];

  function invalidateResult() {
    setResult(null);
  }

  function runScenario(scenario: SpawnCreepScenario) {
    setBodyPreset(scenario.bodyPreset);
    setEnergyAvailable(scenario.energyAvailable);
    setSpawnBusy(scenario.spawnBusy);
    setNameExists(scenario.nameExists);
    setResult(evaluateSpawnCreep(scenario));
  }

  function resetExperiment() {
    setBodyPreset("worker");
    setEnergyAvailable(300);
    setSpawnBusy(false);
    setNameExists(false);
    setResult(null);
  }

  function runTick() {
    setResult(evaluateSpawnCreep({ bodyPreset, energyAvailable, spawnBusy, nameExists }));
  }

  return (
    <section className={`${styles.labSection} ${spawnStyles.spawnSection}`} aria-labelledby="spawn-lab-title">
      <div className={styles.labHeader}>
        <div>
          <p className={styles.experimentIndex}>{text.experiment}</p>
          <h2 id="spawn-lab-title">StructureSpawn.spawnCreep()</h2>
          <p>{text.experimentLead}</p>
        </div>
        <button type="button" className={styles.secondaryButton} onClick={resetExperiment}>{text.reset}</button>
      </div>

      <div className={spawnStyles.boundaryNote} role="note">
        <strong>{text.boundaryTitle}</strong>
        <p>{text.boundaryBody}</p>
      </div>

      <div className={styles.stageGrid}>
        <article className={styles.panel}>
          <div className={styles.panelLabel}>{text.worldState}</div>
          <div className={styles.objectCard}>
            <div className={styles.objectHeader}><strong>{text.spawn}</strong><code>StructureSpawn</code></div>
            <dl>
              <div><dt>{text.state}</dt><dd>{spawnBusy ? text.busy : text.idle}</dd></div>
              <div><dt>{text.energyAvailable}</dt><dd>{energyAvailable} / 300</dd></div>
              <div><dt>{text.nameState}</dt><dd>{nameExists ? text.nameTaken : text.nameFree}</dd></div>
            </dl>
          </div>
          <div className={styles.objectCard}>
            <div className={styles.objectHeader}><strong>{text.worker}</strong><code>Spawn request</code></div>
            <dl>
              <div><dt>{text.bodyCost}</dt><dd>{bodyCost} ENERGY</dd></div>
              <div><dt>{text.spawnTime}</dt><dd>{spawnTime} ticks</dd></div>
              <div><dt>{text.body}</dt><dd>{bodyParts.length} {text.parts}</dd></div>
            </dl>
            <code className={spawnStyles.bodyCode}>[{bodyParts.join(", ")}]</code>
          </div>
        </article>

        <article className={`${styles.panel} ${styles.codePanel}`}>
          <div className={styles.panelLabel}>{text.code}</div>
          <pre><code>{`const result = Game.spawns.Spawn1.spawnCreep(\n  [${bodyParts.join(", ")}],\n  "Worker1"\n);`}</code></pre>
          <div className={styles.returnPreview}>
            <span>result</span><strong>{result ? `${result.returnName} (${result.returnCode})` : "—"}</strong>
          </div>
        </article>

        <article className={styles.panel} aria-live="polite">
          <div className={styles.panelLabel}>{text.nextState}</div>
          {result ? (
            result.intentSubmitted ? (
              <>
                <div className={styles.objectCard}>
                  <div className={styles.objectHeader}><strong>{text.spawn}</strong><code>StructureSpawn</code></div>
                  <dl>
                    <div><dt>{text.state}</dt><dd>{text.spawning}</dd></div>
                    <div><dt>{text.energyAvailable}</dt><dd>{result.nextEnergyAvailable} / 300</dd></div>
                    <div><dt>{text.spawnTime}</dt><dd>{result.spawnTime} ticks</dd></div>
                  </dl>
                </div>
                <div className={styles.objectCard}>
                  <div className={styles.objectHeader}><strong>{text.worker}</strong><code>Creep</code></div>
                  <dl>
                    <div><dt>{text.state}</dt><dd>spawning</dd></div>
                    <div><dt>{text.body}</dt><dd>{result.bodyParts.length} {text.parts}</dd></div>
                  </dl>
                </div>
              </>
            ) : (
              <div className={spawnStyles.unchangedState}>
                <strong>{text.noNewSpawn}</strong>
                <dl className={styles.resultStats}>
                  <div><dt>{text.state}</dt><dd>{result.nextSpawnBusy ? text.busy : text.idle}</dd></div>
                  <div><dt>{text.energyAvailable}</dt><dd>{result.nextEnergyAvailable} / 300</dd></div>
                </dl>
              </div>
            )
          ) : <div className={styles.pendingState}>{text.pending}</div>}
        </article>
      </div>

      <section className={styles.presetPanel} aria-labelledby="spawn-presets-title">
        <div className={styles.presetHeader}>
          <div><strong id="spawn-presets-title">{text.presets}</strong><p>{text.presetsLead}</p></div>
        </div>
        <div className={styles.presetGrid}>
          {presets.map((preset) => (
            <button key={preset.key} type="button" className={styles.presetButton} onClick={() => runScenario(preset.scenario)}>
              <strong>{preset.label}</strong><span>{preset.detail}</span>
            </button>
          ))}
        </div>
      </section>

      <div className={styles.controlsHeader}><strong>{text.controls}</strong><span>{text.controlsLead}</span></div>
      <div className={`${styles.controlGrid} ${spawnStyles.spawnControlGrid}`}>
        <label className={styles.controlCard}>
          <span>{text.bodyPreset}</span>
          <select className={spawnStyles.controlSelect} value={bodyPreset} onChange={(event) => { setBodyPreset(event.target.value as SpawnBodyPresetKey); invalidateResult(); }}>
            {bodyPresetOrder.map((preset) => <option key={preset} value={preset}>{bodyLabel(language, preset)}</option>)}
          </select>
          <p>[{bodyParts.join(", ")}] · {bodyCost} ENERGY · {spawnTime} ticks</p>
        </label>

        <label className={styles.controlCard}>
          <span>{text.roomEnergy}</span><output>{energyAvailable} / 300</output>
          <input type="range" min="0" max="300" step="50" value={energyAvailable} onChange={(event) => { setEnergyAvailable(Number(event.target.value)); invalidateResult(); }} />
        </label>

        <fieldset className={styles.controlCard}>
          <legend>{text.spawnBusy}</legend>
          <div className={spawnStyles.toggleButtons}>
            <button type="button" className={!spawnBusy ? spawnStyles.toggleActive : undefined} aria-pressed={!spawnBusy} onClick={() => { setSpawnBusy(false); invalidateResult(); }}>{text.no}</button>
            <button type="button" className={spawnBusy ? spawnStyles.toggleActive : undefined} aria-pressed={spawnBusy} onClick={() => { setSpawnBusy(true); invalidateResult(); }}>{text.yes}</button>
          </div>
        </fieldset>

        <fieldset className={styles.controlCard}>
          <legend>{text.nameExists}</legend>
          <div className={spawnStyles.toggleButtons}>
            <button type="button" className={!nameExists ? spawnStyles.toggleActive : undefined} aria-pressed={!nameExists} onClick={() => { setNameExists(false); invalidateResult(); }}>{text.no}</button>
            <button type="button" className={nameExists ? spawnStyles.toggleActive : undefined} aria-pressed={nameExists} onClick={() => { setNameExists(true); invalidateResult(); }}>{text.yes}</button>
          </div>
        </fieldset>
      </div>

      <div className={styles.runRow}><button type="button" className={styles.runButton} onClick={runTick}>{text.run}</button></div>

      <div className={styles.timelineResultGrid}>
        <section className={styles.timelinePanel} aria-labelledby="spawn-timeline-title">
          <div className={styles.panelLabel} id="spawn-timeline-title">{text.timeline}</div>
          {result ? (
            <ol className={styles.timeline}>
              {result.steps.map((step) => (
                <li key={step.key} data-status={step.status}>
                  <span className={styles.timelineDot} aria-hidden="true" />
                  <span>{stepLabels[language][step.key]}</span>
                  <small>{step.status === "pass" ? text.pass : step.status === "fail" ? text.fail : text.skipped}</small>
                </li>
              ))}
            </ol>
          ) : <p className={styles.emptyMessage}>{text.ready}</p>}
        </section>

        <section className={styles.resultPanel} aria-live="polite" aria-labelledby="spawn-result-title">
          <div className={styles.panelLabel} id="spawn-result-title">{text.result}</div>
          {result ? (
            <>
              <div className={styles.returnCode} data-ok={result.returnCode === 0}><strong>{result.returnName}</strong><span>{result.returnCode}</span></div>
              <dl className={styles.resultStats}>
                <div><dt>{text.intent}</dt><dd>{result.intentSubmitted ? text.intentSubmitted : text.intentNotSubmitted}</dd></div>
                <div><dt>{text.bodyCost}</dt><dd>{result.bodyCost} ENERGY</dd></div>
                <div><dt>{text.spawnTime}</dt><dd>{result.spawnTime} ticks</dd></div>
                <div><dt>{text.modeledEnergy}</dt><dd>{result.nextEnergyAvailable} ENERGY</dd></div>
              </dl>
              <h3>{text.explanation}</h3><p>{explanationFor(language, result)}</p>
              <p className={styles.boundaryText}>{text.liveBoundary}</p>
            </>
          ) : <p className={styles.emptyMessage}>{text.ready}</p>}
        </section>
      </div>

      <nav className={styles.related} aria-label={text.related}>
        <strong>{text.related}</strong>
        <div>
          <Link href={links.guide}>{text.guide}</Link><Link href={links.api}>{text.api}</Link><Link href={links.errors}>{text.errors}</Link><Link href={links.diagnostics}>{text.diagnostics}</Link><Link href={links.evidence}>{text.evidence}</Link>
        </div>
      </nav>
    </section>
  );
}
