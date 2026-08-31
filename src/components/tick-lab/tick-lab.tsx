"use client";

import Link from "next/link";
import { useState } from "react";

import {
  evaluateTransfer,
  type TransferEvaluation,
  type TransferScenario,
  type TransferStepKey,
} from "@/lib/tick-lab";

import styles from "./tick-lab.module.css";

type TickLabLanguage = "zh" | "en";

interface TickLabProps {
  language: TickLabLanguage;
}

const stepLabels: Record<TickLabLanguage, Record<TransferStepKey, string>> = {
  zh: {
    "resolve-creep": "读取受控 Creep1 状态",
    "resolve-target": "读取受控 Spawn1 状态",
    "check-range": "检查距离",
    "check-resource": "检查 Creep 能量",
    "check-capacity": "检查目标剩余容量",
    "submit-intent": "提交 transfer intent",
    "resolve-tick": "应用受控 intent，计算模型化下一状态",
  },
  en: {
    "resolve-creep": "Read the constrained Creep1 state",
    "resolve-target": "Read the constrained Spawn1 state",
    "check-range": "Check range",
    "check-resource": "Check Creep energy",
    "check-capacity": "Check target free capacity",
    "submit-intent": "Submit transfer intent",
    "resolve-tick": "Apply the constrained intent and model the next state",
  },
};

const copy = {
  zh: {
    eyebrow: "TICK LAB · V1",
    title: "把一行 Screeps 代码拆成一个 Tick",
    intro:
      "调整世界状态，运行一个确定性 transfer() 实验，观察 API 返回值、Intent 与模型化 Tick 后状态之间的区别。",
    modelBadge: "Deterministic educational model",
    modelTitle: "这是教学实验，不是完整 Screeps Engine 模拟器",
    modelBody:
      "V1 只建模一个受控场景：你的 Creep 已生成、目标是有效 Spawn、资源为 ENERGY、amount 省略。结果用于解释已核对的 API / Engine 行为，不代表 Live shard 证据。",
    experiment: "实验 01 / Transfer Energy",
    experimentLead: "把 Creep1 携带的 ENERGY 转移给相邻 Spawn1。",
    worldState: "Tick 100 · World State",
    code: "Code",
    nextState: "Tick 101 · 模型化下一状态",
    creep: "Creep1",
    spawn: "Spawn1",
    energy: "Energy",
    position: "Position",
    freeCapacity: "Free capacity",
    pending: "运行 Tick 后显示状态变化",
    presets: "直接试一个分支",
    presetsLead: "不用猜参数。选择典型场景后会立即运行，并把返回码、Intent 与下一状态一起展示。",
    presetSuccess: "成功",
    presetSuccessDetail: "50 → 50",
    presetPartial: "部分填充",
    presetPartialDetail: "只剩 25 容量",
    presetRange: "距离过远",
    presetRangeDetail: "Range 2",
    presetEmpty: "Creep 空了",
    presetEmptyDetail: "0 ENERGY",
    presetFull: "Spawn 已满",
    presetFullDetail: "0 free",
    controls: "自定义参数",
    controlsLead: "也可以自己改变世界状态，再运行一次。",
    range: "Range",
    rangeHelp: "transfer() 的目标必须位于相邻格。",
    creepEnergy: "Creep Energy",
    targetFree: "Spawn Free Capacity",
    reset: "重置",
    run: "Run Tick ▶",
    timeline: "Tick Timeline",
    result: "Return Code",
    intent: "Intent",
    intentSubmitted: "已提交",
    intentNotSubmitted: "未提交",
    transferred: "本实验转移量",
    explanation: "发生了什么",
    related: "继续查询",
    guide: "完整教程",
    api: "Creep API",
    errors: "错误码",
    diagnostics: "Diagnostics",
    evidence: "Runtime Evidence",
    ready: "调整参数，然后运行这个 Tick。",
    ok: "API 返回 OK：transfer intent 已成功调度。这个实验随后应用该受控 intent，展示模型化的 Tick 后状态。",
    rangeFailure: "目标距离大于 1，因此在距离检查处返回 ERR_NOT_IN_RANGE；没有提交 transfer intent，状态保持不变。",
    resourceFailure: "Creep 没有 ENERGY，因此返回 ERR_NOT_ENOUGH_RESOURCES；没有提交 transfer intent，状态保持不变。",
    capacityFailure: "Spawn 已无剩余容量，因此返回 ERR_FULL；没有提交 transfer intent，状态保持不变。",
    liveBoundary: "注意：这里的 Tick 101 是实验模型计算结果，不是从真实 shard 捕获的 Runtime Evidence。",
    pass: "通过",
    fail: "失败",
    skipped: "未执行",
  },
  en: {
    eyebrow: "TICK LAB · V1",
    title: "Break one Screeps call into one Tick",
    intro:
      "Change the world state, run a deterministic transfer() experiment, and inspect the difference between the API return value, the intent, and the modeled post-Tick state.",
    modelBadge: "Deterministic educational model",
    modelTitle: "An educational experiment, not a full Screeps Engine simulator",
    modelBody:
      "V1 models one constrained scenario only: your Creep is spawned, the target is a valid Spawn, the resource is ENERGY, and amount is omitted. Results explain checked API / Engine behavior; they are not Live shard evidence.",
    experiment: "Experiment 01 / Transfer Energy",
    experimentLead: "Transfer ENERGY carried by Creep1 into adjacent Spawn1.",
    worldState: "Tick 100 · World State",
    code: "Code",
    nextState: "Tick 101 · Modeled next state",
    creep: "Creep1",
    spawn: "Spawn1",
    energy: "Energy",
    position: "Position",
    freeCapacity: "Free capacity",
    pending: "Run the Tick to reveal the state transition",
    presets: "Try a branch directly",
    presetsLead: "No parameter guessing required. Pick a typical scenario to run it immediately and inspect the return code, intent, and next state together.",
    presetSuccess: "Success",
    presetSuccessDetail: "50 → 50",
    presetPartial: "Partial fill",
    presetPartialDetail: "25 free",
    presetRange: "Too far",
    presetRangeDetail: "Range 2",
    presetEmpty: "Empty Creep",
    presetEmptyDetail: "0 ENERGY",
    presetFull: "Full Spawn",
    presetFullDetail: "0 free",
    controls: "Custom controls",
    controlsLead: "Or change the world state yourself, then run another Tick.",
    range: "Range",
    rangeHelp: "transfer() requires the target to be adjacent.",
    creepEnergy: "Creep Energy",
    targetFree: "Spawn Free Capacity",
    reset: "Reset",
    run: "Run Tick ▶",
    timeline: "Tick Timeline",
    result: "Return Code",
    intent: "Intent",
    intentSubmitted: "Submitted",
    intentNotSubmitted: "Not submitted",
    transferred: "Modeled transfer amount",
    explanation: "What happened",
    related: "Continue exploring",
    guide: "Full guide",
    api: "Creep API",
    errors: "Return codes",
    diagnostics: "Diagnostics",
    evidence: "Runtime Evidence",
    ready: "Adjust the controls, then run this Tick.",
    ok: "The API returns OK: the transfer intent was scheduled successfully. The lab then applies that constrained intent to show the modeled post-Tick state.",
    rangeFailure: "The target is farther than range 1, so the range check returns ERR_NOT_IN_RANGE. No transfer intent is submitted and the state stays unchanged.",
    resourceFailure: "The Creep has no ENERGY, so the call returns ERR_NOT_ENOUGH_RESOURCES. No transfer intent is submitted and the state stays unchanged.",
    capacityFailure: "The Spawn has no free capacity, so the call returns ERR_FULL. No transfer intent is submitted and the state stays unchanged.",
    liveBoundary: "Note: Tick 101 here is calculated by the experiment model; it is not Runtime Evidence captured from a real shard.",
    pass: "Pass",
    fail: "Fail",
    skipped: "Skipped",
  },
} as const;

interface ScenarioPreset {
  key: string;
  scenario: TransferScenario;
  label: string;
  detail: string;
}

function explanationFor(language: TickLabLanguage, result: TransferEvaluation) {
  const text = copy[language];
  if (!result.failure) return text.ok;
  if (result.failure === "range") return text.rangeFailure;
  if (result.failure === "resources") return text.resourceFailure;
  return text.capacityFailure;
}

export function TickLab({ language }: TickLabProps) {
  const text = copy[language];
  const [range, setRange] = useState(1);
  const [creepEnergy, setCreepEnergy] = useState(50);
  const [targetFreeCapacity, setTargetFreeCapacity] = useState(50);
  const [result, setResult] = useState<TransferEvaluation | null>(null);
  const isEnglish = language === "en";
  const targetCapacity = 300;
  const targetEnergy = targetCapacity - targetFreeCapacity;
  const nextTargetEnergy = result
    ? targetCapacity - result.nextTargetFreeCapacity
    : null;

  const links = isEnglish
    ? {
        guide: "/en/blog/screeps-transfer-energy-to-spawn",
        api: "/en/screeps-api/creep",
        errors: "/en/screeps-errors",
        diagnostics: "/en/diagnostics",
        evidence: "/en/verified",
      }
    : {
        guide: "/blog/screeps-transfer-energy-to-spawn",
        api: "/screeps-api/creep",
        errors: "/screeps-errors",
        diagnostics: "/diagnostics",
        evidence: "/verified",
      };

  const presets: ScenarioPreset[] = [
    {
      key: "success",
      scenario: { range: 1, creepEnergy: 50, targetFreeCapacity: 50 },
      label: text.presetSuccess,
      detail: text.presetSuccessDetail,
    },
    {
      key: "partial",
      scenario: { range: 1, creepEnergy: 50, targetFreeCapacity: 25 },
      label: text.presetPartial,
      detail: text.presetPartialDetail,
    },
    {
      key: "range",
      scenario: { range: 2, creepEnergy: 50, targetFreeCapacity: 50 },
      label: text.presetRange,
      detail: text.presetRangeDetail,
    },
    {
      key: "empty",
      scenario: { range: 1, creepEnergy: 0, targetFreeCapacity: 50 },
      label: text.presetEmpty,
      detail: text.presetEmptyDetail,
    },
    {
      key: "full",
      scenario: { range: 1, creepEnergy: 50, targetFreeCapacity: 0 },
      label: text.presetFull,
      detail: text.presetFullDetail,
    },
  ];

  function invalidateResult() {
    setResult(null);
  }

  function resetExperiment() {
    setRange(1);
    setCreepEnergy(50);
    setTargetFreeCapacity(50);
    setResult(null);
  }

  function runScenario(scenario: TransferScenario) {
    setRange(scenario.range);
    setCreepEnergy(scenario.creepEnergy);
    setTargetFreeCapacity(scenario.targetFreeCapacity);
    setResult(evaluateTransfer(scenario));
  }

  function runTick() {
    setResult(
      evaluateTransfer({
        range,
        creepEnergy,
        targetFreeCapacity,
      }),
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p className={styles.intro}>{text.intro}</p>
          <div className={styles.modelNote} role="note">
            <span>{text.modelBadge}</span>
            <div>
              <strong>{text.modelTitle}</strong>
              <p>{text.modelBody}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.labSection} aria-labelledby="transfer-lab-title">
        <div className={styles.labHeader}>
          <div>
            <p className={styles.experimentIndex}>{text.experiment}</p>
            <h2 id="transfer-lab-title">Creep.transfer()</h2>
            <p>{text.experimentLead}</p>
          </div>
          <button type="button" className={styles.secondaryButton} onClick={resetExperiment}>
            {text.reset}
          </button>
        </div>

        <div className={styles.stageGrid}>
          <article className={styles.panel}>
            <div className={styles.panelLabel}>{text.worldState}</div>
            <div className={styles.objectCard}>
              <div className={styles.objectHeader}>
                <strong>{text.creep}</strong>
                <code>Creep</code>
              </div>
              <dl>
                <div><dt>{text.energy}</dt><dd>{creepEnergy} / 50</dd></div>
                <div><dt>{text.position}</dt><dd>20, 20</dd></div>
              </dl>
            </div>
            <div className={styles.objectCard}>
              <div className={styles.objectHeader}>
                <strong>{text.spawn}</strong>
                <code>StructureSpawn</code>
              </div>
              <dl>
                <div><dt>{text.energy}</dt><dd>{targetEnergy} / {targetCapacity}</dd></div>
                <div><dt>{text.freeCapacity}</dt><dd>{targetFreeCapacity}</dd></div>
                <div><dt>{text.position}</dt><dd>{range === 1 ? "21, 20" : `${20 + range}, 20`}</dd></div>
              </dl>
            </div>
          </article>

          <article className={`${styles.panel} ${styles.codePanel}`}>
            <div className={styles.panelLabel}>{text.code}</div>
            <pre><code>{`const result = creep.transfer(\n  Game.spawns.Spawn1,\n  RESOURCE_ENERGY\n);`}</code></pre>
            <div className={styles.returnPreview}>
              <span>result</span>
              <strong>{result ? `${result.returnName} (${result.returnCode})` : "—"}</strong>
            </div>
          </article>

          <article className={styles.panel} aria-live="polite">
            <div className={styles.panelLabel}>{text.nextState}</div>
            {result ? (
              <>
                <div className={styles.objectCard}>
                  <div className={styles.objectHeader}>
                    <strong>{text.creep}</strong>
                    <code>Creep</code>
                  </div>
                  <dl>
                    <div><dt>{text.energy}</dt><dd>{result.nextCreepEnergy} / 50</dd></div>
                    <div><dt>{text.position}</dt><dd>20, 20</dd></div>
                  </dl>
                </div>
                <div className={styles.objectCard}>
                  <div className={styles.objectHeader}>
                    <strong>{text.spawn}</strong>
                    <code>StructureSpawn</code>
                  </div>
                  <dl>
                    <div><dt>{text.energy}</dt><dd>{nextTargetEnergy} / {targetCapacity}</dd></div>
                    <div><dt>{text.freeCapacity}</dt><dd>{result.nextTargetFreeCapacity}</dd></div>
                  </dl>
                </div>
              </>
            ) : (
              <div className={styles.pendingState}>{text.pending}</div>
            )}
          </article>
        </div>

        <section className={styles.presetPanel} aria-labelledby="tick-lab-presets-title">
          <div className={styles.presetHeader}>
            <div>
              <strong id="tick-lab-presets-title">{text.presets}</strong>
              <p>{text.presetsLead}</p>
            </div>
          </div>
          <div className={styles.presetGrid}>
            {presets.map((preset) => (
              <button
                key={preset.key}
                type="button"
                className={styles.presetButton}
                onClick={() => runScenario(preset.scenario)}
              >
                <strong>{preset.label}</strong>
                <span>{preset.detail}</span>
              </button>
            ))}
          </div>
        </section>

        <div className={styles.controlsHeader}>
          <strong>{text.controls}</strong>
          <span>{text.controlsLead}</span>
        </div>

        <div className={styles.controlGrid}>
          <fieldset className={styles.controlCard}>
            <legend>{text.range}</legend>
            <div className={styles.rangeButtons}>
              {[1, 2, 3].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={range === value ? styles.rangeActive : undefined}
                  aria-pressed={range === value}
                  onClick={() => {
                    setRange(value);
                    invalidateResult();
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
            <p>{text.rangeHelp}</p>
          </fieldset>

          <label className={styles.controlCard}>
            <span>{text.creepEnergy}</span>
            <output>{creepEnergy} / 50</output>
            <input
              type="range"
              min="0"
              max="50"
              step="10"
              value={creepEnergy}
              onChange={(event) => {
                setCreepEnergy(Number(event.target.value));
                invalidateResult();
              }}
            />
          </label>

          <label className={styles.controlCard}>
            <span>{text.targetFree}</span>
            <output>{targetFreeCapacity} / 300</output>
            <input
              type="range"
              min="0"
              max="300"
              step="25"
              value={targetFreeCapacity}
              onChange={(event) => {
                setTargetFreeCapacity(Number(event.target.value));
                invalidateResult();
              }}
            />
          </label>
        </div>

        <div className={styles.runRow}>
          <button type="button" className={styles.runButton} onClick={runTick}>
            {text.run}
          </button>
        </div>

        <div className={styles.timelineResultGrid}>
          <section className={styles.timelinePanel} aria-labelledby="tick-timeline-title">
            <div className={styles.panelLabel} id="tick-timeline-title">{text.timeline}</div>
            {result ? (
              <ol className={styles.timeline}>
                {result.steps.map((step) => (
                  <li key={step.key} data-status={step.status}>
                    <span className={styles.timelineDot} aria-hidden="true" />
                    <span>{stepLabels[language][step.key]}</span>
                    <small>
                      {step.status === "pass"
                        ? text.pass
                        : step.status === "fail"
                          ? text.fail
                          : text.skipped}
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.emptyMessage}>{text.ready}</p>
            )}
          </section>

          <section className={styles.resultPanel} aria-live="polite" aria-labelledby="tick-result-title">
            <div className={styles.panelLabel} id="tick-result-title">{text.result}</div>
            {result ? (
              <>
                <div className={styles.returnCode} data-ok={result.returnCode === 0}>
                  <strong>{result.returnName}</strong>
                  <span>{result.returnCode}</span>
                </div>
                <dl className={styles.resultStats}>
                  <div>
                    <dt>{text.intent}</dt>
                    <dd>{result.intentSubmitted ? text.intentSubmitted : text.intentNotSubmitted}</dd>
                  </div>
                  <div>
                    <dt>{text.transferred}</dt>
                    <dd>{result.transferred} ENERGY</dd>
                  </div>
                </dl>
                <h3>{text.explanation}</h3>
                <p>{explanationFor(language, result)}</p>
                <p className={styles.boundaryText}>{text.liveBoundary}</p>
              </>
            ) : (
              <p className={styles.emptyMessage}>{text.ready}</p>
            )}
          </section>
        </div>

        <nav className={styles.related} aria-label={text.related}>
          <strong>{text.related}</strong>
          <div>
            <Link href={links.guide}>{text.guide}</Link>
            <Link href={links.api}>{text.api}</Link>
            <Link href={links.errors}>{text.errors}</Link>
            <Link href={links.diagnostics}>{text.diagnostics}</Link>
            <Link href={links.evidence}>{text.evidence}</Link>
          </div>
        </nav>
      </section>
    </main>
  );
}
