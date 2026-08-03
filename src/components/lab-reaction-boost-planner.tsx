"use client";

import { useEffect, useMemo, useState } from "react";

import {
  BASE_REACTION_AMOUNT,
  BOOST_ENERGY_PER_PART,
  BOOST_MINERAL_PER_PART,
  BOOST_OPTIONS,
  LAB_RECIPES,
  OPERATE_LAB_BONUS,
  type LabCompound,
} from "@/lib/screeps-planning-data";
import { buildBatchedReactionPlan } from "@/lib/screeps-reaction-planner";

type Locale = "en" | "zh";
type Mode = "reaction" | "boost";

interface Props {
  locale: Locale;
}

interface LabToolState {
  mode: Mode;
  target: LabCompound;
  amount: number;
  existingStock: number;
  labCount: number;
  operateLevel: number;
  partsPerCreep: number;
  creepCount: number;
}

const compounds = Object.keys(LAB_RECIPES) as LabCompound[];
const boostCompounds = BOOST_OPTIONS.map((option) => option.compound);
const defaultState: LabToolState = {
  mode: "boost",
  target: "XGH2O",
  amount: 3000,
  existingStock: 0,
  labCount: 6,
  operateLevel: 0,
  partsPerCreep: 20,
  creepCount: 5,
};

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function parseNumber(params: URLSearchParams, key: string, fallback: number, min: number, max: number) {
  const raw = params.get(key);
  if (raw === null) return fallback;
  return clampNumber(Number(raw), min, max);
}

function parseState(params: URLSearchParams): LabToolState {
  const mode: Mode = params.get("mode") === "reaction" ? "reaction" : "boost";
  const candidate = params.get("target") as LabCompound | null;
  const target = candidate && candidate in LAB_RECIPES && (mode === "reaction" || boostCompounds.includes(candidate))
    ? candidate
    : defaultState.target;
  return {
    mode,
    target,
    amount: parseNumber(params, "amount", defaultState.amount, 0, 100000000),
    existingStock: parseNumber(params, "stock", defaultState.existingStock, 0, 100000000),
    labCount: parseNumber(params, "labs", defaultState.labCount, 3, 10),
    operateLevel: parseNumber(params, "operate", defaultState.operateLevel, 0, 5),
    partsPerCreep: parseNumber(params, "parts", defaultState.partsPerCreep, 0, 50),
    creepCount: parseNumber(params, "creeps", defaultState.creepCount, 0, 10000),
  };
}

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

const copy = {
  en: {
    tabs: { reaction: "Reaction production", boost: "Creep Boost batch" }, inputs: "Production assumptions",
    result: "Reaction plan", target: "Target compound", amount: "Target compound amount",
    stock: "Target compound already in stock", labs: "Total Labs available", operate: "OPERATE_LAB level",
    none: "None", parts: "Body parts boosted per Creep", creeps: "Creeps in this batch", effect: "Boost effect",
    outputLabs: "Output Labs", perRun: "Compound per output Lab run", mineral: "Boost mineral required",
    energy: "Boost Energy required", produce: "Compound still required", scheduled: "Scheduled output after batch rounding",
    ticks: "Sequential reaction ticks", stages: "Reaction stages", bases: "Base mineral requirements", runs: "runs",
    copyResult: "Copy production summary", copyJson: "Copy plan JSON", copied: "Copied.",
    failed: "Copy failed. Select the visible text manually.",
    boundary: "The tick estimate assumes two input Labs, the remaining Labs used as parallel output Labs, one shared cluster reused sequentially for each reaction stage, uninterrupted cooldowns, enough reagent capacity, and no hauling delay. Every stage is rounded to complete parallel Lab batches. Verify stores, ranges, cooldowns, Power effects, return codes, and later-tick state in the live room.",
  },
  zh: {
    tabs: { reaction: "化合物生产", boost: "Creep Boost 批次" }, inputs: "生产参数", result: "反应规划",
    target: "目标化合物", amount: "目标化合物数量", stock: "已有目标化合物库存", labs: "可用 Lab 总数",
    operate: "OPERATE_LAB 等级", none: "未使用", parts: "每只 Creep 需要 Boost 的部件数", creeps: "本批次 Creep 数量",
    effect: "Boost 效果", outputLabs: "输出 Lab 数量", perRun: "每个输出 Lab 每轮产量", mineral: "Boost 所需化合物",
    energy: "Boost 所需 Energy", produce: "仍然需要的化合物", scheduled: "按完整批次安排的产量",
    ticks: "顺序生产所需 Tick", stages: "反应阶段", bases: "基础矿物需求", runs: "轮",
    copyResult: "复制生产摘要", copyJson: "复制计划 JSON", copied: "已复制。", failed: "复制失败，请手动选择可见文本。",
    boundary: "Tick估算假设使用2个输入Lab，其余Lab并行输出，同一组Lab按阶段顺序复用，cooldown不中断、输入容量充足且不计算运输时间。每个阶段都会按完整并行Lab批次向上取整。必须在真实房间中核对库存、距离、cooldown、Power效果、返回码和后续Tick状态。",
  },
} as const;

export function LabReactionBoostPlanner({ locale }: Props) {
  const t = copy[locale];
  const [config, setConfig] = useState<LabToolState>(defaultState);
  const [urlReady, setUrlReady] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setConfig(parseState(new URLSearchParams(window.location.search)));
      setUrlReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!urlReady) return;
    const params = new URLSearchParams({
      mode: config.mode,
      target: config.target,
      amount: String(config.amount),
      stock: String(config.existingStock),
      labs: String(config.labCount),
      operate: String(config.operateLevel),
      parts: String(config.partsPerCreep),
      creeps: String(config.creepCount),
    });
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [config, urlReady]);

  function update(patch: Partial<LabToolState>) {
    setConfig((current) => ({ ...current, ...patch }));
  }

  function selectMode(mode: Mode) {
    update({ mode, target: mode === "boost" && !boostCompounds.includes(config.target) ? "XGH2O" : config.target });
  }

  const selectedBoost = BOOST_OPTIONS.find((option) => option.compound === config.target)
    ?? BOOST_OPTIONS.find((option) => option.compound === "XGH2O")!;
  const availableCompounds = config.mode === "boost" ? boostCompounds : compounds;
  const boostMineral = config.partsPerCreep * config.creepCount * BOOST_MINERAL_PER_PART;
  const boostEnergy = config.partsPerCreep * config.creepCount * BOOST_ENERGY_PER_PART;
  const requestedAmount = config.mode === "boost" ? boostMineral : config.amount;
  const productionAmount = Math.max(0, Math.ceil(requestedAmount - config.existingStock));

  const calculation = useMemo(() => {
    const outputLabs = Math.max(1, config.labCount - 2);
    const amountPerRun = BASE_REACTION_AMOUNT + (OPERATE_LAB_BONUS[config.operateLevel] ?? 0);
    const parallelBatchSize = outputLabs * amountPerRun;
    const plan = buildBatchedReactionPlan(config.target, productionAmount, parallelBatchSize);
    const stages = plan.stages.map((stage) => {
      const runs = stage.amount === 0 ? 0 : Math.ceil(stage.amount / parallelBatchSize);
      return { ...stage, runs, ticks: runs * stage.cooldown };
    });
    return {
      plan,
      outputLabs,
      amountPerRun,
      parallelBatchSize,
      stages,
      scheduledOutput: stages.find((stage) => stage.compound === config.target)?.amount ?? 0,
      totalTicks: stages.reduce((sum, stage) => sum + stage.ticks, 0),
    };
  }, [config.labCount, config.operateLevel, config.target, productionAmount]);

  const summaryObject = {
    mode: config.mode,
    target: config.target,
    requestedAmount,
    existingStock: config.existingStock,
    productionAmount,
    scheduledOutput: calculation.scheduledOutput,
    labCount: config.labCount,
    inputLabs: 2,
    outputLabs: calculation.outputLabs,
    operateLabLevel: config.operateLevel,
    amountPerOutputLabRun: calculation.amountPerRun,
    parallelBatchSize: calculation.parallelBatchSize,
    sequentialReactionTicks: calculation.totalTicks,
    boost: config.mode === "boost" ? {
      creeps: config.creepCount,
      partsPerCreep: config.partsPerCreep,
      mineralRequired: boostMineral,
      energyRequired: boostEnergy,
      effect: locale === "en" ? selectedBoost.effect : selectedBoost.effectZh,
    } : null,
    baseResources: calculation.plan.baseResources,
    stages: calculation.stages.map((stage) => ({ compound: stage.compound, amount: stage.amount, cooldown: stage.cooldown, runs: stage.runs, ticks: stage.ticks })),
    boundary: t.boundary,
  };

  const summary = [
    locale === "en" ? "Screeps Lab Reaction and Boost Planner" : "Screeps Lab 反应与 Boost 规划器",
    `${t.target}: ${config.target}`,
    `${t.produce}: ${formatNumber(productionAmount)}`,
    `${t.scheduled}: ${formatNumber(calculation.scheduledOutput)}`,
    `${t.outputLabs}: ${calculation.outputLabs}`,
    `${t.perRun}: ${calculation.amountPerRun}`,
    `${t.ticks}: ${formatNumber(calculation.totalTicks)}`,
    ...(config.mode === "boost" ? [`${t.mineral}: ${formatNumber(boostMineral)}`, `${t.energy}: ${formatNumber(boostEnergy)}`, `${t.effect}: ${locale === "en" ? selectedBoost.effect : selectedBoost.effectZh}`] : []),
    `${t.bases}: ${Object.entries(calculation.plan.baseResources).map(([resource, value]) => `${resource} ${formatNumber(value)}`).join(", ")}`,
    t.boundary,
  ].join("\n");

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(t.copied);
    } catch {
      setStatus(t.failed);
    }
  }

  return (
    <div className="planning-tool" data-tool="lab-boost">
      <div className="planning-tabs" role="tablist" aria-label={locale === "en" ? "Planning mode" : "规划模式"}>
        {(Object.keys(t.tabs) as Mode[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={config.mode === tab} onClick={() => selectMode(tab)}>{t.tabs[tab]}</button>)}
      </div>
      <div className="planning-grid">
        <section className="planning-panel" aria-labelledby="lab-input-title">
          <p className="eyebrow">INPUTS</p><h2 id="lab-input-title">{t.inputs}</h2>
          <div className="planning-fields">
            <label><span>{t.target}</span><select value={config.target} onChange={(event) => update({ target: event.target.value as LabCompound })}>{availableCompounds.map((compound) => { const option = BOOST_OPTIONS.find((item) => item.compound === compound); return <option value={compound} key={compound}>{compound}{option ? ` · ${locale === "en" ? option.effect : option.effectZh}` : ""}</option>; })}</select></label>
            {config.mode === "reaction" && <label><span>{t.amount}</span><input type="number" min="0" value={config.amount} onChange={(event) => update({ amount: clampNumber(Number(event.target.value), 0, 100000000) })} /></label>}
            {config.mode === "boost" && <><label><span>{t.parts}</span><input type="number" min="0" max="50" value={config.partsPerCreep} onChange={(event) => update({ partsPerCreep: clampNumber(Number(event.target.value), 0, 50) })} /></label><label><span>{t.creeps}</span><input type="number" min="0" max="10000" value={config.creepCount} onChange={(event) => update({ creepCount: clampNumber(Number(event.target.value), 0, 10000) })} /></label></>}
            <label><span>{t.stock}</span><input type="number" min="0" value={config.existingStock} onChange={(event) => update({ existingStock: clampNumber(Number(event.target.value), 0, 100000000) })} /></label>
            <label><span>{t.labs}</span><input type="number" min="3" max="10" value={config.labCount} onChange={(event) => update({ labCount: clampNumber(Number(event.target.value), 3, 10) })} /></label>
            <label><span>{t.operate}</span><select value={config.operateLevel} onChange={(event) => update({ operateLevel: clampNumber(Number(event.target.value), 0, 5) })}><option value="0">{t.none}</option>{[1,2,3,4,5].map((level) => <option key={level} value={level}>Level {level} · +{OPERATE_LAB_BONUS[level] ?? 0}</option>)}</select></label>
          </div>
        </section>

        <aside className="planning-panel planning-results" aria-labelledby="lab-result-title">
          <p className="eyebrow">RESULT</p><h2 id="lab-result-title">{t.result}</h2>
          <dl className="planning-metrics">
            {config.mode === "boost" && <><div><dt>{t.mineral}</dt><dd>{formatNumber(boostMineral)}</dd></div><div><dt>{t.energy}</dt><dd>{formatNumber(boostEnergy)}</dd></div><div className="planning-metric-wide"><dt>{t.effect}</dt><dd>{locale === "en" ? selectedBoost.effect : selectedBoost.effectZh}</dd></div></>}
            <div><dt>{t.produce}</dt><dd>{formatNumber(productionAmount)}</dd></div><div><dt>{t.scheduled}</dt><dd>{formatNumber(calculation.scheduledOutput)}</dd></div><div><dt>{t.outputLabs}</dt><dd>{calculation.outputLabs}</dd></div><div><dt>{t.perRun}</dt><dd>{calculation.amountPerRun}</dd></div><div className="planning-metric-wide"><dt>{t.ticks}</dt><dd>{formatNumber(calculation.totalTicks)}</dd></div>
          </dl>
          <section className="planning-stage-list" aria-labelledby="lab-stage-title"><h3 id="lab-stage-title">{t.stages}</h3>{calculation.stages.length === 0 ? <p>{locale === "en" ? "Existing stock already covers the requested amount." : "现有库存已经覆盖目标数量。"}</p> : <ol>{calculation.stages.map((stage) => <li key={stage.compound}><strong>{stage.compound}</strong><span>{formatNumber(stage.amount)} · {stage.runs} {t.runs} · {stage.ticks} ticks</span></li>)}</ol>}</section>
          <section className="planning-stage-list" aria-labelledby="lab-base-title"><h3 id="lab-base-title">{t.bases}</h3><ul>{Object.entries(calculation.plan.baseResources).map(([resource, value]) => <li key={resource}><strong>{resource}</strong><span>{formatNumber(value)}</span></li>)}</ul></section>
          <p className="planning-boundary">{t.boundary}</p>
          <div className="planning-actions"><button type="button" onClick={() => copyText(summary)}>{t.copyResult}</button><button type="button" onClick={() => copyText(JSON.stringify(summaryObject, null, 2))}>{t.copyJson}</button></div>
          <p className="planning-status" role="status" aria-live="polite">{status}</p>
        </aside>
      </div>
    </div>
  );
}
