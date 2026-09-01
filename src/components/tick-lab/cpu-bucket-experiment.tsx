"use client";

import Link from "next/link";
import { useState } from "react";

import {
  cpuBudgetConstants,
  evaluateCpuBudget,
  getModeledCpuTickLimit,
  type CpuBudgetEvaluation,
  type CpuBudgetScenario,
  type CpuBudgetStepKey,
} from "@/lib/tick-lab-cpu";

import styles from "./tick-lab.module.css";

type TickLabLanguage = "zh" | "en";

interface CpuBucketExperimentProps {
  language: TickLabLanguage;
}

const stepLabels: Record<TickLabLanguage, Record<CpuBudgetStepKey, string>> = {
  zh: {
    "read-cpu": "读取受控 Game.cpu 快照",
    "derive-tick-limit": "根据 limit + bucket 推导本 Tick 的模型化 tickLimit",
    "measure-used": "读取当前 Game.cpu.getUsed() 快照",
    "check-headroom": "检查剩余 tickLimit 是否覆盖可选任务估算成本",
    "decide-task": "本地预算守卫决定 RUN 或 SKIP",
    "model-total-used": "计算本 Tick 的模型化总 CPU 使用量",
    "model-bucket": "按 baseline 差额计算模型化下一 Tick bucket",
  },
  en: {
    "read-cpu": "Read the constrained Game.cpu snapshot",
    "derive-tick-limit": "Derive the modeled current-tick tickLimit from limit + bucket",
    "measure-used": "Read the current Game.cpu.getUsed() snapshot",
    "check-headroom": "Check whether remaining tickLimit covers the optional task estimate",
    "decide-task": "Let the local budget guard choose RUN or SKIP",
    "model-total-used": "Calculate modeled total CPU used for this Tick",
    "model-bucket": "Model the next bucket from the baseline difference",
  },
};

const copy = {
  zh: {
    experiment: "实验 03 / CPU Budget",
    experimentLead: "用一个受控 Game.cpu 快照理解 limit、tickLimit、bucket 与 getUsed() 如何共同决定可选任务是否还有安全预算。",
    boundaryTitle: "受控边界",
    boundaryBody: "本实验固定 Game.cpu.limit = 100 CPU，只改变 bucket、当前已使用 CPU 与一个可选任务的估算成本。tickLimit 按官方文档描述的 bucket 行为建模，上限 500；bucket 上限 10,000。RUN / SKIP 是本地教学守卫的决定，不是 Screeps API 返回码或 Intent。实际任务 CPU 成本仍必须在真实 shard 中测量。",
    worldState: "Tick 300 · CPU Snapshot",
    code: "Budget Guard",
    nextState: "Tick 301 · 模型化 Bucket",
    cpu: "Game.cpu",
    optionalTask: "Optional task",
    limit: "limit",
    tickLimit: "tickLimit",
    bucket: "bucket",
    used: "getUsed()",
    estimate: "Estimated cost",
    headroom: "Headroom",
    pending: "运行预算检查后显示模型化 CPU 与 bucket 变化",
    presets: "直接试一个 CPU 分支",
    presetsLead: "这些场景把“补 bucket / 保持 / 花 bucket / 卡在 tickLimit / 主动跳过任务”拆开显示。",
    presetRefill: "补充 Bucket",
    presetRefillDetail: "60 used / +40 bucket",
    presetSteady: "刚好 Baseline",
    presetSteadyDetail: "100 total / bucket steady",
    presetSpend: "使用储备",
    presetSpendDetail: "200 total / -100 bucket",
    presetCeiling: "刚好 TickLimit",
    presetCeilingDetail: "500 total / bucket → 0",
    presetSkip: "预算不足",
    presetSkipDetail: "150 ceiling / task skipped",
    presetEmpty: "空 Bucket",
    presetEmptyDetail: "tickLimit = limit = 100",
    controls: "自定义 CPU 快照",
    controlsLead: "改变 bucket、当前 getUsed() 与可选任务成本估算，再运行一次预算检查。",
    reset: "重置",
    run: "Run CPU Budget ▶",
    timeline: "CPU Timeline",
    result: "Budget Decision",
    taskDecision: "Optional Task",
    runDecision: "RUN",
    skipDecision: "SKIP",
    modeledTotal: "模型化总 CPU",
    bucketDelta: "Bucket Δ",
    nextBucket: "模型化下一 Bucket",
    explanation: "发生了什么",
    ready: "选择场景或调整参数，然后运行这个 Tick。",
    refill: "可选任务仍在 tickLimit 内，而且模型化总 CPU 低于 baseline limit；未使用的 baseline CPU 会补入 bucket，直到 10,000 上限。",
    steady: "模型化总 CPU 正好等于 baseline limit，因此这个受控 Tick 不补充也不消耗 bucket。",
    spend: "可选任务仍在当前 tickLimit 内，但模型化总 CPU 高于 baseline limit；超出 baseline 的部分从 bucket 储备中支出。",
    skip: "可选任务的估算成本超过当前剩余 tickLimit，因此本地教学守卫选择 SKIP。这里没有 API 错误码；如果强行运行且真实成本符合该估算，脚本可能在达到 CPU 限制前无法完成。",
    liveBoundary: "注意：这里的任务成本是人为估算，Tick 301 bucket 是受控教学模型计算结果，不是从真实 shard 捕获的 Runtime Evidence。Game.cpu.getUsed() 的实际值和任务成本会随真实代码与 Tick 状态变化；官方 Simulation 模式下 getUsed() 始终返回 0。",
    related: "继续查询 CPU",
    basics: "CPU / Bucket 基础",
    degradation: "Bucket 降载策略",
    diagnostics: "Diagnostics",
    evidence: "Runtime Evidence",
    pass: "通过",
    fail: "不足",
    skipped: "未执行",
  },
  en: {
    experiment: "Experiment 03 / CPU Budget",
    experimentLead: "Use one constrained Game.cpu snapshot to see how limit, tickLimit, bucket, and getUsed() determine whether an optional task still has safe budget.",
    boundaryTitle: "Controlled boundary",
    boundaryBody: "This experiment fixes Game.cpu.limit at 100 CPU and varies only bucket, CPU already used, and one optional-task cost estimate. tickLimit is modeled from the documented bucket behavior and capped at 500; bucket is capped at 10,000. RUN / SKIP is a local teaching guard decision, not a Screeps API return code or intent. Real task CPU cost must still be measured on a live shard.",
    worldState: "Tick 300 · CPU Snapshot",
    code: "Budget Guard",
    nextState: "Tick 301 · Modeled Bucket",
    cpu: "Game.cpu",
    optionalTask: "Optional task",
    limit: "limit",
    tickLimit: "tickLimit",
    bucket: "bucket",
    used: "getUsed()",
    estimate: "Estimated cost",
    headroom: "Headroom",
    pending: "Run the budget check to reveal modeled CPU and bucket movement",
    presets: "Try a CPU branch directly",
    presetsLead: "These scenarios separate bucket refill, steady use, reserve spending, the tickLimit ceiling, and a task that should be skipped.",
    presetRefill: "Refill bucket",
    presetRefillDetail: "60 used / +40 bucket",
    presetSteady: "Exact baseline",
    presetSteadyDetail: "100 total / bucket steady",
    presetSpend: "Spend reserve",
    presetSpendDetail: "200 total / -100 bucket",
    presetCeiling: "Exact tickLimit",
    presetCeilingDetail: "500 total / bucket → 0",
    presetSkip: "No headroom",
    presetSkipDetail: "150 ceiling / task skipped",
    presetEmpty: "Empty bucket",
    presetEmptyDetail: "tickLimit = limit = 100",
    controls: "Custom CPU snapshot",
    controlsLead: "Change bucket, current getUsed(), and the optional-task estimate, then run another budget check.",
    reset: "Reset",
    run: "Run CPU Budget ▶",
    timeline: "CPU Timeline",
    result: "Budget Decision",
    taskDecision: "Optional Task",
    runDecision: "RUN",
    skipDecision: "SKIP",
    modeledTotal: "Modeled total CPU",
    bucketDelta: "Bucket Δ",
    nextBucket: "Modeled next Bucket",
    explanation: "What happened",
    ready: "Pick a scenario or adjust the controls, then run this Tick.",
    refill: "The optional task still fits inside tickLimit and modeled total CPU stays below the baseline limit. The unused baseline CPU replenishes bucket, capped at 10,000.",
    steady: "Modeled total CPU exactly matches the baseline limit, so this constrained Tick neither replenishes nor spends bucket.",
    spend: "The optional task still fits inside the current tickLimit, but modeled total CPU exceeds the baseline limit. The amount above baseline is spent from bucket reserve.",
    skip: "The optional-task estimate is larger than the remaining tickLimit, so the local teaching guard chooses SKIP. There is no API error code here; forcing the task with that real cost could leave the script unable to finish before the CPU limit is reached.",
    liveBoundary: "Note: task cost here is a manual estimate and Tick 301 bucket is calculated by the constrained teaching model, not Runtime Evidence captured from a real shard. Actual Game.cpu.getUsed() and task cost vary with real code and Tick state; the official Simulation mode always returns 0 from getUsed().",
    related: "Continue with CPU",
    basics: "CPU / Bucket basics",
    degradation: "Bucket degradation strategy",
    diagnostics: "Diagnostics",
    evidence: "Runtime Evidence",
    pass: "Pass",
    fail: "Insufficient",
    skipped: "Skipped",
  },
} as const;

function explanationFor(language: TickLabLanguage, result: CpuBudgetEvaluation) {
  const text = copy[language];
  if (!result.taskRuns) return text.skip;
  if (result.bucketDirection === "replenish") return text.refill;
  if (result.bucketDirection === "spend") return text.spend;
  return text.steady;
}

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

export function CpuBucketExperiment({ language }: CpuBucketExperimentProps) {
  const text = copy[language];
  const [bucket, setBucket] = useState(4000);
  const [used, setUsed] = useState(40);
  const [plannedTaskCost, setPlannedTaskCost] = useState(20);
  const [result, setResult] = useState<CpuBudgetEvaluation | null>(null);
  const tickLimit = getModeledCpuTickLimit(bucket);
  const isEnglish = language === "en";

  const links = isEnglish
    ? {
        basics: "/en/blog/screeps-cpu-getused-bucket",
        degradation: "/en/blog/screeps-cpu-bucket-degradation",
        diagnostics: "/en/diagnostics",
        evidence: "/en/verified",
      }
    : {
        basics: "/blog/screeps-cpu-getused-bucket",
        degradation: "/blog/screeps-cpu-bucket-degradation",
        diagnostics: "/diagnostics",
        evidence: "/verified",
      };

  const presets: Array<{ key: string; scenario: CpuBudgetScenario; label: string; detail: string }> = [
    { key: "refill", scenario: { bucket: 4000, used: 40, plannedTaskCost: 20 }, label: text.presetRefill, detail: text.presetRefillDetail },
    { key: "steady", scenario: { bucket: 4000, used: 60, plannedTaskCost: 40 }, label: text.presetSteady, detail: text.presetSteadyDetail },
    { key: "spend", scenario: { bucket: 4000, used: 80, plannedTaskCost: 120 }, label: text.presetSpend, detail: text.presetSpendDetail },
    { key: "ceiling", scenario: { bucket: 400, used: 350, plannedTaskCost: 150 }, label: text.presetCeiling, detail: text.presetCeilingDetail },
    { key: "skip", scenario: { bucket: 50, used: 100, plannedTaskCost: 80 }, label: text.presetSkip, detail: text.presetSkipDetail },
    { key: "empty", scenario: { bucket: 0, used: 70, plannedTaskCost: 30 }, label: text.presetEmpty, detail: text.presetEmptyDetail },
  ];

  function invalidateResult() {
    setResult(null);
  }

  function setBucketSafely(nextBucket: number) {
    const nextTickLimit = getModeledCpuTickLimit(nextBucket);
    setBucket(nextBucket);
    setUsed((current) => Math.min(current, nextTickLimit));
    invalidateResult();
  }

  function runScenario(scenario: CpuBudgetScenario) {
    setBucket(scenario.bucket);
    setUsed(scenario.used);
    setPlannedTaskCost(scenario.plannedTaskCost);
    setResult(evaluateCpuBudget(scenario));
  }

  function resetExperiment() {
    setBucket(4000);
    setUsed(40);
    setPlannedTaskCost(20);
    setResult(null);
  }

  function runTick() {
    setResult(evaluateCpuBudget({ bucket, used, plannedTaskCost }));
  }

  return (
    <section className={styles.labSection} aria-labelledby="cpu-lab-title">
      <div className={styles.labHeader}>
        <div>
          <p className={styles.experimentIndex}>{text.experiment}</p>
          <h2 id="cpu-lab-title">Game.cpu</h2>
          <p>{text.experimentLead}</p>
        </div>
        <button type="button" className={styles.secondaryButton} onClick={resetExperiment}>{text.reset}</button>
      </div>

      <div className={styles.modelNote} role="note" style={{ marginBottom: 14 }}>
        <span>{text.boundaryTitle}</span>
        <div>
          <strong>Game.cpu.limit = {cpuBudgetConstants.baselineLimit}</strong>
          <p>{text.boundaryBody}</p>
        </div>
      </div>

      <div className={styles.stageGrid}>
        <article className={styles.panel}>
          <div className={styles.panelLabel}>{text.worldState}</div>
          <div className={styles.objectCard}>
            <div className={styles.objectHeader}>
              <strong>{text.cpu}</strong>
              <code>CPU snapshot</code>
            </div>
            <dl>
              <div><dt>{text.limit}</dt><dd>{cpuBudgetConstants.baselineLimit}</dd></div>
              <div><dt>{text.tickLimit}</dt><dd>{tickLimit}</dd></div>
              <div><dt>{text.bucket}</dt><dd>{bucket} / {cpuBudgetConstants.bucketCapacity}</dd></div>
              <div><dt>{text.used}</dt><dd>{used}</dd></div>
            </dl>
          </div>
          <div className={styles.objectCard}>
            <div className={styles.objectHeader}>
              <strong>{text.optionalTask}</strong>
              <code>local estimate</code>
            </div>
            <dl>
              <div><dt>{text.estimate}</dt><dd>{plannedTaskCost}</dd></div>
              <div><dt>{text.headroom}</dt><dd>{Math.max(0, tickLimit - used)}</dd></div>
            </dl>
          </div>
        </article>

        <article className={`${styles.panel} ${styles.codePanel}`}>
          <div className={styles.panelLabel}>{text.code}</div>
          <pre><code>{`const plannedTaskCost = ${plannedTaskCost}; // local estimate\nconst used = Game.cpu.getUsed();\nconst headroom = Game.cpu.tickLimit - used;\n\nif (headroom >= plannedTaskCost) {\n  runOptionalTask();\n}`}</code></pre>
          <div className={styles.returnPreview}>
            <span>decision</span>
            <strong>{result?.decision ?? "—"}</strong>
          </div>
        </article>

        <article className={styles.panel} aria-live="polite">
          <div className={styles.panelLabel}>{text.nextState}</div>
          {result ? (
            <div className={styles.objectCard}>
              <div className={styles.objectHeader}>
                <strong>{text.bucket}</strong>
                <code>modeled</code>
              </div>
              <dl>
                <div><dt>{text.taskDecision}</dt><dd>{result.taskRuns ? text.runDecision : text.skipDecision}</dd></div>
                <div><dt>{text.modeledTotal}</dt><dd>{result.modeledTotalUsed}</dd></div>
                <div><dt>{text.bucketDelta}</dt><dd>{signed(result.bucketDelta)}</dd></div>
                <div><dt>{text.nextBucket}</dt><dd>{result.nextBucket}</dd></div>
              </dl>
            </div>
          ) : (
            <div className={styles.pendingState}>{text.pending}</div>
          )}
        </article>
      </div>

      <section className={styles.presetPanel} aria-labelledby="cpu-presets-title">
        <div className={styles.presetHeader}>
          <div>
            <strong id="cpu-presets-title">{text.presets}</strong>
            <p>{text.presetsLead}</p>
          </div>
        </div>
        <div className={styles.presetGrid}>
          {presets.map((preset) => (
            <button key={preset.key} type="button" className={styles.presetButton} onClick={() => runScenario(preset.scenario)}>
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
        <label className={styles.controlCard}>
          <span>{text.bucket}</span>
          <output>{bucket} / {cpuBudgetConstants.bucketCapacity}</output>
          <input
            type="range"
            min="0"
            max={cpuBudgetConstants.bucketCapacity}
            step="50"
            value={bucket}
            onChange={(event) => setBucketSafely(Number(event.target.value))}
          />
        </label>
        <label className={styles.controlCard}>
          <span>{text.used}</span>
          <output>{used} / {tickLimit}</output>
          <input
            type="range"
            min="0"
            max={tickLimit}
            step="10"
            value={used}
            onChange={(event) => { setUsed(Number(event.target.value)); invalidateResult(); }}
          />
        </label>
        <label className={styles.controlCard}>
          <span>{text.estimate}</span>
          <output>{plannedTaskCost} CPU</output>
          <input
            type="range"
            min="0"
            max={cpuBudgetConstants.maxTickLimit}
            step="10"
            value={plannedTaskCost}
            onChange={(event) => { setPlannedTaskCost(Number(event.target.value)); invalidateResult(); }}
          />
        </label>
      </div>

      <div className={styles.runRow}>
        <button type="button" className={styles.runButton} onClick={runTick}>{text.run}</button>
      </div>

      <div className={styles.timelineResultGrid}>
        <section className={styles.timelinePanel} aria-labelledby="cpu-timeline-title">
          <div className={styles.panelLabel} id="cpu-timeline-title">{text.timeline}</div>
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
          ) : (
            <p className={styles.emptyMessage}>{text.ready}</p>
          )}
        </section>

        <section className={styles.resultPanel} aria-live="polite" aria-labelledby="cpu-result-title">
          <div className={styles.panelLabel} id="cpu-result-title">{text.result}</div>
          {result ? (
            <>
              <div className={styles.returnCode}>
                <strong>{result.decision}</strong>
                <span>{result.headroomBeforeTask} CPU</span>
              </div>
              <dl className={styles.resultStats}>
                <div><dt>{text.tickLimit}</dt><dd>{result.tickLimit}</dd></div>
                <div><dt>{text.headroom}</dt><dd>{result.headroomBeforeTask}</dd></div>
                <div><dt>{text.modeledTotal}</dt><dd>{result.modeledTotalUsed}</dd></div>
                <div><dt>{text.bucketDelta}</dt><dd>{signed(result.bucketDelta)}</dd></div>
                <div><dt>{text.nextBucket}</dt><dd>{result.nextBucket}</dd></div>
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
          <Link href={links.basics}>{text.basics}</Link>
          <Link href={links.degradation}>{text.degradation}</Link>
          <Link href={links.diagnostics}>{text.diagnostics}</Link>
          <Link href={links.evidence}>{text.evidence}</Link>
        </div>
      </nav>
    </section>
  );
}
