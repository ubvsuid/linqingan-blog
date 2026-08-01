"use client";

import { useEffect, useMemo, useState } from "react";

import {
  BASE_REACTION_AMOUNT,
  BOOST_ENERGY_PER_PART,
  BOOST_MINERAL_PER_PART,
  BOOST_OPTIONS,
  LAB_RECIPES,
  OPERATE_LAB_BONUS,
  buildReactionPlan,
  type LabCompound,
} from "@/lib/screeps-planning-data";

type Locale = "en" | "zh";
type Mode = "reaction" | "boost";

interface Props {
  locale: Locale;
}

const compounds = Object.keys(LAB_RECIPES) as LabCompound[];

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

const copy = {
  en: {
    tabs: { reaction: "Reaction production", boost: "Creep Boost batch" },
    inputs: "Production assumptions",
    result: "Reaction plan",
    target: "Target compound",
    amount: "Target compound amount",
    stock: "Target compound already in stock",
    labs: "Total Labs available",
    operate: "OPERATE_LAB level",
    none: "None",
    parts: "Body parts boosted per Creep",
    creeps: "Creeps in this batch",
    effect: "Boost effect",
    outputLabs: "Output Labs",
    perRun: "Compound per output Lab run",
    mineral: "Boost mineral required",
    energy: "Boost Energy required",
    produce: "Compound still to produce",
    ticks: "Sequential reaction ticks",
    stages: "Reaction stages",
    bases: "Base mineral requirements",
    runs: "runs",
    copyResult: "Copy production summary",
    copyJson: "Copy plan JSON",
    copied: "Copied.",
    failed: "Copy failed. Select the visible text manually.",
    boundary: "The tick estimate assumes two input Labs, the remaining Labs used as parallel output Labs, one shared cluster reused sequentially for each reaction stage, uninterrupted cooldowns, enough reagent capacity, and no hauling delay. Verify stores, ranges, cooldowns, Power effects, return codes, and later-tick state in the live room.",
  },
  zh: {
    tabs: { reaction: "化合物生产", boost: "Creep Boost 批次" },
    inputs: "生产参数",
    result: "反应规划",
    target: "目标化合物",
    amount: "目标化合物数量",
    stock: "已有目标化合物库存",
    labs: "可用 Lab 总数",
    operate: "OPERATE_LAB 等级",
    none: "未使用",
    parts: "每只 Creep 需要 Boost 的部件数",
    creeps: "本批次 Creep 数量",
    effect: "Boost 效果",
    outputLabs: "输出 Lab 数量",
    perRun: "每个输出 Lab 每轮产量",
    mineral: "Boost 所需化合物",
    energy: "Boost 所需 Energy",
    produce: "仍需生产的化合物",
    ticks: "顺序生产所需 Tick",
    stages: "反应阶段",
    bases: "基础矿物需求",
    runs: "轮",
    copyResult: "复制生产摘要",
    copyJson: "复制计划 JSON",
    copied: "已复制。",
    failed: "复制失败，请手动选择可见文本。",
    boundary: "Tick估算假设使用2个输入Lab，其余Lab并行输出，同一组Lab按阶段顺序复用，cooldown不中断、输入容量充足且不计算运输时间。必须在真实房间中核对库存、距离、cooldown、Power效果、返回码和后续Tick状态。",
  },
} as const;

export function LabReactionBoostPlanner({ locale }: Props) {
  const t = copy[locale];
  const [mode, setMode] = useState<Mode>("boost");
  const [target, setTarget] = useState<LabCompound>("XGH2O");
  const [amount, setAmount] = useState(3000);
  const [existingStock, setExistingStock] = useState(0);
  const [labCount, setLabCount] = useState(6);
  const [operateLevel, setOperateLevel] = useState(0);
  const [partsPerCreep, setPartsPerCreep] = useState(20);
  const [creepCount, setCreepCount] = useState(5);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextMode = params.get("mode");
    if (nextMode === "reaction" || nextMode === "boost") setMode(nextMode);
    const nextTarget = params.get("target") as LabCompound | null;
    if (nextTarget && nextTarget in LAB_RECIPES) setTarget(nextTarget);
    const numeric: Array<[string, (value: number) => void, number, number]> = [
      ["amount", setAmount, 0, 100000000],
      ["stock", setExistingStock, 0, 100000000],
      ["labs", setLabCount, 3, 10],
      ["operate", setOperateLevel, 0, 5],
      ["parts", setPartsPerCreep, 0, 50],
      ["creeps", setCreepCount, 0, 10000],
    ];
    for (const [key, setter, min, max] of numeric) {
      const parsed = Number(params.get(key));
      if (Number.isFinite(parsed)) setter(clampNumber(parsed, min, max));
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams({
      mode,
      target,
      amount: String(amount),
      stock: String(existingStock),
      labs: String(labCount),
      operate: String(operateLevel),
      parts: String(partsPerCreep),
      creeps: String(creepCount),
    });
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [amount, creepCount, existingStock, labCount, mode, operateLevel, partsPerCreep, ready, target]);

  const selectedBoost = BOOST_OPTIONS.find((option) => option.compound === target) ?? BOOST_OPTIONS.find((option) => option.compound === "XGH2O")!;
  const boostMineral = partsPerCreep * creepCount * BOOST_MINERAL_PER_PART;
  const boostEnergy = partsPerCreep * creepCount * BOOST_ENERGY_PER_PART;
  const requestedAmount = mode === "boost" ? boostMineral : amount;
  const productionAmount = Math.max(0, Math.ceil(requestedAmount - existingStock));

  const calculation = useMemo(() => {
    const plan = buildReactionPlan(target, productionAmount);
    const outputLabs = Math.max(1, labCount - 2);
    const amountPerRun = BASE_REACTION_AMOUNT + OPERATE_LAB_BONUS[operateLevel];
    const stages = plan.stages.map((stage) => {
      const runs = stage.amount === 0 ? 0 : Math.ceil(stage.amount / (outputLabs * amountPerRun));
      return { ...stage, runs, ticks: runs * stage.cooldown };
    });
    return {
      plan,
      outputLabs,
      amountPerRun,
      stages,
      totalTicks: stages.reduce((sum, stage) => sum + stage.ticks, 0),
    };
  }, [labCount, operateLevel, productionAmount, target]);

  const summaryObject = {
    mode,
    target,
    requestedAmount,
    existingStock,
    productionAmount,
    labCount,
    inputLabs: 2,
    outputLabs: calculation.outputLabs,
    operateLabLevel: operateLevel,
    amountPerOutputLabRun: calculation.amountPerRun,
    sequentialReactionTicks: calculation.totalTicks,
    boost: mode === "boost" ? {
      creeps: creepCount,
      partsPerCreep,
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
    `${t.target}: ${target}`,
    `${t.produce}: ${formatNumber(productionAmount)}`,
    `${t.outputLabs}: ${calculation.outputLabs}`,
    `${t.perRun}: ${calculation.amountPerRun}`,
    `${t.ticks}: ${formatNumber(calculation.totalTicks)}`,
    ...(mode === "boost" ? [`${t.mineral}: ${formatNumber(boostMineral)}`, `${t.energy}: ${formatNumber(boostEnergy)}`, `${t.effect}: ${locale === "en" ? selectedBoost.effect : selectedBoost.effectZh}`] : []),
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
        {(Object.keys(t.tabs) as Mode[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={mode === tab} onClick={() => setMode(tab)}>{t.tabs[tab]}</button>)}
      </div>

      <div className="planning-grid">
        <section className="planning-panel" aria-labelledby="lab-input-title">
          <p className="eyebrow">INPUTS</p>
          <h2 id="lab-input-title">{t.inputs}</h2>
          <div className="planning-fields">
            <label><span>{t.target}</span><select value={target} onChange={(event) => setTarget(event.target.value as LabCompound)}>{compounds.map((compound) => {
              const boostOption = BOOST_OPTIONS.find((option) => option.compound === compound);
              const suffix = boostOption ? ` · ${locale === "en" ? boostOption.effect : boostOption.effectZh}` : "";
              return <option value={compound} key={compound}>{compound}{suffix}</option>;
            })}</select></label>
            {mode === "reaction" && <label><span>{t.amount}</span><input type="number" min="0" value={amount} onChange={(event) => setAmount(clampNumber(Number(event.target.value), 0, 100000000))} /></label>}
            {mode === "boost" && <><label><span>{t.parts}</span><input type="number" min="0" max="50" value={partsPerCreep} onChange={(event) => setPartsPerCreep(clampNumber(Number(event.target.value), 0, 50))} /></label><label><span>{t.creeps}</span><input type="number" min="0" max="10000" value={creepCount} onChange={(event) => setCreepCount(clampNumber(Number(event.target.value), 0, 10000))} /></label></>}
            <label><span>{t.stock}</span><input type="number" min="0" value={existingStock} onChange={(event) => setExistingStock(clampNumber(Number(event.target.value), 0, 100000000))} /></label>
            <label><span>{t.labs}</span><input type="number" min="3" max="10" value={labCount} onChange={(event) => setLabCount(clampNumber(Number(event.target.value), 3, 10))} /></label>
            <label><span>{t.operate}</span><select value={operateLevel} onChange={(event) => setOperateLevel(clampNumber(Number(event.target.value), 0, 5))}><option value="0">{t.none}</option>{[1,2,3,4,5].map((level) => <option key={level} value={level}>Level {level} · +{OPERATE_LAB_BONUS[level]}</option>)}</select></label>
          </div>
        </section>

        <aside className="planning-panel planning-results" aria-labelledby="lab-result-title">
          <p className="eyebrow">RESULT</p>
          <h2 id="lab-result-title">{t.result}</h2>
          <dl className="planning-metrics">
            {mode === "boost" && <><div><dt>{t.mineral}</dt><dd>{formatNumber(boostMineral)}</dd></div><div><dt>{t.energy}</dt><dd>{formatNumber(boostEnergy)}</dd></div><div className="planning-metric-wide"><dt>{t.effect}</dt><dd>{locale === "en" ? selectedBoost.effect : selectedBoost.effectZh}</dd></div></>}
            <div><dt>{t.produce}</dt><dd>{formatNumber(productionAmount)}</dd></div>
            <div><dt>{t.outputLabs}</dt><dd>{calculation.outputLabs}</dd></div>
            <div><dt>{t.perRun}</dt><dd>{calculation.amountPerRun}</dd></div>
            <div><dt>{t.ticks}</dt><dd>{formatNumber(calculation.totalTicks)}</dd></div>
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
