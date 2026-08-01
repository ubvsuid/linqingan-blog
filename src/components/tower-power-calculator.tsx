"use client";

import { useEffect, useMemo, useState } from "react";

import {
  OPERATE_TOWER_BONUS,
  TOWER_ENERGY_COST,
  TOWER_POWER,
  getTowerRangeFactor,
  type TowerAction,
} from "@/lib/screeps-operations-data";

type Locale = "en" | "zh";

interface Props {
  locale: Locale;
}

interface TowerState {
  action: TowerAction;
  range: number;
  towers: number;
  energyPerTower: number;
  operateLevel: number;
  targetAmount: number;
  opposingPerTick: number;
}

const defaultState: TowerState = {
  action: "attack",
  range: 10,
  towers: 3,
  energyPerTower: 1000,
  operateLevel: 0,
  targetAmount: 5000,
  opposingPerTick: 0,
};

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function parseNumber(params: URLSearchParams, key: string, fallback: number, min: number, max: number) {
  const raw = params.get(key);
  if (raw === null) return fallback;
  return clampNumber(Number(raw), min, max);
}

function parseState(params: URLSearchParams): TowerState {
  const action = params.get("action");
  return {
    action: action === "heal" || action === "repair" ? action : "attack",
    range: parseNumber(params, "range", defaultState.range, 0, 50),
    towers: parseNumber(params, "towers", defaultState.towers, 1, 6),
    energyPerTower: parseNumber(params, "energy", defaultState.energyPerTower, 0, 1000),
    operateLevel: parseNumber(params, "operate", defaultState.operateLevel, 0, 5),
    targetAmount: parseNumber(params, "target", defaultState.targetAmount, 0, 1000000000),
    opposingPerTick: parseNumber(params, "opposing", defaultState.opposingPerTick, 0, 1000000000),
  };
}

function formatNumber(value: number, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

const copy = {
  en: {
    tabs: { attack: "Attack", heal: "Heal", repair: "Repair" },
    inputs: "Tower and target assumptions",
    result: "Tower power plan",
    range: "Range to target",
    towers: "Towers firing together",
    energy: "Energy available per Tower",
    operate: "OPERATE_TOWER level",
    none: "None",
    targetAttack: "Target hits to remove",
    targetHeal: "Missing Creep hits",
    targetRepair: "Missing structure hits",
    opposingAttack: "Enemy healing per tick",
    opposingHeal: "Incoming damage per tick",
    opposingRepair: "Incoming damage or decay per tick",
    factor: "Range effectiveness",
    perTower: "Power per Tower",
    gross: "Gross power per tick",
    net: "Net progress per tick",
    volleyEnergy: "Energy per full volley",
    volleys: "Available full volleys",
    ticks: "Ticks required",
    energyNeeded: "Energy required",
    remaining: "Target amount left after stored Energy",
    complete: "Stored Tower Energy can cover the entered target under these assumptions.",
    insufficient: "Stored Tower Energy is not enough to finish the entered target under these assumptions.",
    stalled: "Opposing power equals or exceeds the Tower output, so the target cannot progress in this model.",
    copyResult: "Copy Tower summary",
    copyProbe: "Copy read-only Tower probe",
    copied: "Copied.",
    failed: "Copy failed. Select the visible text manually.",
    boundary: "The calculator uses standard Tower range falloff and assumes every selected Tower can act on the same target each tick. Attack results ignore TOUGH ordering, Boost damage reduction, ramparts, Safe Mode, target movement, simultaneous hostile actions, action priority, and failed intents unless represented by the opposing-per-tick input.",
  },
  zh: {
    tabs: { attack: "攻击", heal: "治疗", repair: "维修" },
    inputs: "Tower与目标参数",
    result: "Tower能力规划",
    range: "与目标的Range距离",
    towers: "同时执行的Tower数量",
    energy: "每座Tower当前Energy",
    operate: "OPERATE_TOWER等级",
    none: "未使用",
    targetAttack: "需要消除的目标Hits",
    targetHeal: "Creep缺失Hits",
    targetRepair: "结构缺失Hits",
    opposingAttack: "敌方每Tick治疗量",
    opposingHeal: "每Tick受到的伤害",
    opposingRepair: "每Tick伤害或自然损耗",
    factor: "距离效率",
    perTower: "单座Tower效果",
    gross: "每Tick总效果",
    net: "每Tick净进度",
    volleyEnergy: "全部Tower每轮Energy",
    volleys: "可执行完整轮数",
    ticks: "预计所需Tick",
    energyNeeded: "预计所需Energy",
    remaining: "现有Energy耗尽后剩余目标量",
    complete: "按当前假设，Tower库存可以覆盖目标。",
    insufficient: "按当前假设，Tower库存不足以完成目标。",
    stalled: "对抗量等于或超过Tower输出，当前模型中无法推进目标。",
    copyResult: "复制Tower摘要",
    copyProbe: "复制只读Tower探针",
    copied: "已复制。",
    failed: "复制失败，请手动选择可见文本。",
    boundary: "本工具按标准Tower距离衰减计算，并假设所有Tower每Tick都能作用于同一目标。攻击结果不会自动计算TOUGH顺序、Boost减伤、Rampart、Safe Mode、目标移动、同时敌对动作、动作优先级和失败返回码，除非通过每Tick对抗量手动表示。",
  },
} as const;

export function TowerPowerCalculator({ locale }: Props) {
  const t = copy[locale];
  const [config, setConfig] = useState<TowerState>(defaultState);
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
      action: config.action,
      range: String(config.range),
      towers: String(config.towers),
      energy: String(config.energyPerTower),
      operate: String(config.operateLevel),
      target: String(config.targetAmount),
      opposing: String(config.opposingPerTick),
    });
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [config, urlReady]);

  function update(patch: Partial<TowerState>) {
    setConfig((current) => ({ ...current, ...patch }));
  }

  const calculation = useMemo(() => {
    const rangeFactor = getTowerRangeFactor(config.range);
    const operateBonus = OPERATE_TOWER_BONUS[config.operateLevel] ?? 0;
    const perTower = Math.floor(TOWER_POWER[config.action] * rangeFactor * (1 + operateBonus));
    const grossPerTick = perTower * config.towers;
    const netPerTick = Math.max(0, grossPerTick - config.opposingPerTick);
    const energyPerVolley = config.towers * TOWER_ENERGY_COST;
    const availableVolleys = Math.floor(config.energyPerTower / TOWER_ENERGY_COST);
    const ticksRequired = netPerTick > 0 ? Math.ceil(config.targetAmount / netPerTick) : Number.POSITIVE_INFINITY;
    const energyRequired = Number.isFinite(ticksRequired) ? ticksRequired * energyPerVolley : Number.POSITIVE_INFINITY;
    const remaining = Math.max(0, config.targetAmount - netPerTick * availableVolleys);
    const canComplete = netPerTick > 0 && ticksRequired <= availableVolleys;
    return { rangeFactor, operateBonus, perTower, grossPerTick, netPerTick, energyPerVolley, availableVolleys, ticksRequired, energyRequired, remaining, canComplete };
  }, [config]);

  const targetLabel = config.action === "attack" ? t.targetAttack : config.action === "heal" ? t.targetHeal : t.targetRepair;
  const opposingLabel = config.action === "attack" ? t.opposingAttack : config.action === "heal" ? t.opposingHeal : t.opposingRepair;
  const alertText = calculation.netPerTick <= 0 ? t.stalled : calculation.canComplete ? t.complete : t.insufficient;
  const summary = [
    locale === "en" ? "Screeps Tower Damage, Heal, and Repair Calculator" : "Screeps Tower伤害、治疗与维修计算器",
    `${t.tabs[config.action]} · ${t.towers}: ${config.towers} · ${t.range}: ${config.range}`,
    `${t.factor}: ${formatNumber(calculation.rangeFactor * 100)}%`,
    `${t.perTower}: ${formatNumber(calculation.perTower)}`,
    `${t.gross}: ${formatNumber(calculation.grossPerTick)}`,
    `${t.net}: ${formatNumber(calculation.netPerTick)}`,
    `${t.ticks}: ${formatNumber(calculation.ticksRequired)}`,
    `${t.energyNeeded}: ${formatNumber(calculation.energyRequired)}`,
    `${t.remaining}: ${formatNumber(calculation.remaining)}`,
    t.boundary,
  ].join("\n");

  const probe = `const target = Game.getObjectById('TARGET_ID');\nconst towers = Object.values(Game.structures).filter(structure => structure.structureType === STRUCTURE_TOWER && structure.my);\nconsole.log(towers.map(tower => ({\n  id: tower.id,\n  room: tower.room.name,\n  range: target ? tower.pos.getRangeTo(target) : null,\n  energy: tower.store.getUsedCapacity(RESOURCE_ENERGY),\n  cooldown: tower.cooldown ?? 0\n})));`;

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(t.copied);
    } catch {
      setStatus(t.failed);
    }
  }

  return (
    <div className="planning-tool" data-tool="tower-power">
      <div className="planning-tabs" role="tablist" aria-label={locale === "en" ? "Tower action" : "Tower动作"}>
        {(Object.keys(t.tabs) as TowerAction[]).map((action) => <button type="button" role="tab" aria-selected={config.action === action} key={action} onClick={() => update({ action })}>{t.tabs[action]}</button>)}
      </div>
      <div className="planning-grid">
        <section className="planning-panel" aria-labelledby="tower-input-title">
          <p className="eyebrow">INPUTS</p>
          <h2 id="tower-input-title">{t.inputs}</h2>
          <div className="planning-fields">
            <label><span>{t.range}</span><input type="number" min="0" max="50" value={config.range} onChange={(event) => update({ range: clampNumber(Number(event.target.value), 0, 50) })} /></label>
            <label><span>{t.towers}</span><select value={config.towers} onChange={(event) => update({ towers: clampNumber(Number(event.target.value), 1, 6) })}>{[1, 2, 3, 4, 5, 6].map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
            <label><span>{t.energy}</span><input type="number" min="0" max="1000" value={config.energyPerTower} onChange={(event) => update({ energyPerTower: clampNumber(Number(event.target.value), 0, 1000) })} /></label>
            <label><span>{t.operate}</span><select value={config.operateLevel} onChange={(event) => update({ operateLevel: clampNumber(Number(event.target.value), 0, 5) })}><option value="0">{t.none}</option>{[1, 2, 3, 4, 5].map((level) => <option value={level} key={level}>Level {level} · +{Math.round((OPERATE_TOWER_BONUS[level] ?? 0) * 100)}%</option>)}</select></label>
            <label><span>{targetLabel}</span><input type="number" min="0" value={config.targetAmount} onChange={(event) => update({ targetAmount: clampNumber(Number(event.target.value), 0, 1000000000) })} /></label>
            <label><span>{opposingLabel}</span><input type="number" min="0" value={config.opposingPerTick} onChange={(event) => update({ opposingPerTick: clampNumber(Number(event.target.value), 0, 1000000000) })} /></label>
          </div>
        </section>

        <aside className="planning-panel planning-results" aria-labelledby="tower-result-title">
          <p className="eyebrow">RESULT</p>
          <h2 id="tower-result-title">{t.result}</h2>
          <p className={`planning-alert ${calculation.canComplete ? "planning-alert-ok" : "planning-alert-warning"}`}>{alertText}</p>
          <dl className="planning-metrics">
            <div><dt>{t.factor}</dt><dd>{formatNumber(calculation.rangeFactor * 100)}%</dd></div>
            <div><dt>{t.perTower}</dt><dd>{formatNumber(calculation.perTower)}</dd></div>
            <div><dt>{t.gross}</dt><dd>{formatNumber(calculation.grossPerTick)}</dd></div>
            <div><dt>{t.net}</dt><dd>{formatNumber(calculation.netPerTick)}</dd></div>
            <div><dt>{t.volleyEnergy}</dt><dd>{formatNumber(calculation.energyPerVolley)}</dd></div>
            <div><dt>{t.volleys}</dt><dd>{formatNumber(calculation.availableVolleys)}</dd></div>
            <div><dt>{t.ticks}</dt><dd>{formatNumber(calculation.ticksRequired)}</dd></div>
            <div><dt>{t.energyNeeded}</dt><dd>{formatNumber(calculation.energyRequired)}</dd></div>
            <div className="planning-metric-wide"><dt>{t.remaining}</dt><dd>{formatNumber(calculation.remaining)}</dd></div>
          </dl>
          <p className="planning-boundary">{t.boundary}</p>
          <details className="planning-code"><summary>{locale === "en" ? "Read-only Tower probe" : "只读Tower探针"}</summary><pre>{probe}</pre></details>
          <div className="planning-actions"><button type="button" onClick={() => copyText(summary)}>{t.copyResult}</button><button type="button" onClick={() => copyText(probe)}>{t.copyProbe}</button></div>
          <p className="planning-status" role="status" aria-live="polite">{status}</p>
        </aside>
      </div>
    </div>
  );
}
