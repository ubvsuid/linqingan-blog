"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CARRY_BOOST_MULTIPLIER,
  CARRY_CAPACITY,
  CREEP_LIFE_TIME,
  CREEP_SPAWN_TIME,
  MOVE_POWER,
  TERRAIN_FATIGUE,
  type CarryBoost,
  type TerrainKind,
} from "@/lib/screeps-operations-data";

type Locale = "en" | "zh";

interface Props {
  locale: Locale;
}

interface HaulingState {
  distance: number;
  carryParts: number;
  moveParts: number;
  otherParts: number;
  carryBoost: CarryBoost;
  loadedTerrain: TerrainKind;
  emptyTerrain: TerrainKind;
  loadTicks: number;
  unloadTicks: number;
  targetPerTick: number;
  safetyTicks: number;
}

const defaultState: HaulingState = {
  distance: 25,
  carryParts: 10,
  moveParts: 5,
  otherParts: 0,
  carryBoost: "none",
  loadedTerrain: "road",
  emptyTerrain: "road",
  loadTicks: 1,
  unloadTicks: 1,
  targetPerTick: 10,
  safetyTicks: 20,
};

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function parseNumber(params: URLSearchParams, key: string, fallback: number, min: number, max: number) {
  const raw = params.get(key);
  if (raw === null) return fallback;
  return clampNumber(Number(raw), min, max);
}

function parseTerrain(value: string | null, fallback: TerrainKind): TerrainKind {
  return value === "plain" || value === "swamp" || value === "road" ? value : fallback;
}

function parseState(params: URLSearchParams): HaulingState {
  const boost = params.get("boost");
  return {
    distance: parseNumber(params, "distance", defaultState.distance, 0, 5000),
    carryParts: parseNumber(params, "carry", defaultState.carryParts, 0, 50),
    moveParts: parseNumber(params, "move", defaultState.moveParts, 0, 50),
    otherParts: parseNumber(params, "other", defaultState.otherParts, 0, 50),
    carryBoost: boost === "KH" || boost === "KH2O" || boost === "XKH2O" ? boost : "none",
    loadedTerrain: parseTerrain(params.get("loaded"), defaultState.loadedTerrain),
    emptyTerrain: parseTerrain(params.get("empty"), defaultState.emptyTerrain),
    loadTicks: parseNumber(params, "load", defaultState.loadTicks, 0, 1000),
    unloadTicks: parseNumber(params, "unload", defaultState.unloadTicks, 0, 1000),
    targetPerTick: parseNumber(params, "target", defaultState.targetPerTick, 0, 1000000),
    safetyTicks: parseNumber(params, "safety", defaultState.safetyTicks, 0, 5000),
  };
}

function ticksPerTile(weight: number, moveParts: number, terrain: TerrainKind) {
  if (moveParts <= 0) return Number.POSITIVE_INFINITY;
  if (weight <= 0) return 1;
  const fatigue = weight * TERRAIN_FATIGUE[terrain];
  return Math.max(1, Math.ceil(fatigue / (moveParts * MOVE_POWER)));
}

function formatNumber(value: number, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

const copy = {
  en: {
    inputs: "Route and body assumptions",
    result: "Hauling throughput plan",
    distance: "One-way route tiles",
    carry: "CARRY parts",
    move: "MOVE parts",
    other: "Other weighted body parts",
    boost: "CARRY capacity Boost",
    none: "None",
    loadedTerrain: "Loaded-leg terrain",
    emptyTerrain: "Empty-leg terrain",
    road: "Road",
    plain: "Plain",
    swamp: "Swamp",
    load: "Loading overhead ticks",
    unload: "Unloading overhead ticks",
    target: "Required delivery per tick",
    safety: "Replacement safety buffer",
    capacity: "Payload per trip",
    loadedSpeed: "Loaded ticks per tile",
    emptySpeed: "Empty ticks per tile",
    cycle: "Round-trip cycle ticks",
    throughput: "Throughput per Creep",
    needed: "Creeps required",
    delivered: "Estimated lifetime delivery",
    cycles: "Complete cycles per lifetime",
    replacement: "Start replacement at TTL",
    spawnTime: "Spawn time",
    recommendedMove: "MOVE needed for 1 loaded tile/tick",
    bodySize: "Total body parts",
    healthy: "The selected body can cover the target throughput at the calculated Creep count.",
    warning: "The body or route is inefficient. Review MOVE ratio, terrain, route length, and replacement timing.",
    invalid: "At least one MOVE part and one CARRY part are required for a hauling plan.",
    bodyTooLarge: "The configured body exceeds the 50-part Creep limit.",
    copyResult: "Copy route summary",
    copyProbe: "Copy read-only Creep probe",
    copied: "Copied.",
    failed: "Copy failed. Select the visible text manually.",
    boundary: "The planner assumes a full payload on the loaded leg, empty CARRY parts on the return leg, a stable route, and no traffic. It does not model path recalculation, pull chains, damaged MOVE parts, fatigue already present, hostile delays, source downtime, transfer failures, or container capacity.",
  },
  zh: {
    inputs: "路线与身体参数",
    result: "运输吞吐量规划",
    distance: "单程路线格数",
    carry: "CARRY部件数",
    move: "MOVE部件数",
    other: "其他产生重量的部件数",
    boost: "CARRY容量Boost",
    none: "未使用",
    loadedTerrain: "满载路段地形",
    emptyTerrain: "空载返回地形",
    road: "Road道路",
    plain: "Plain平原",
    swamp: "Swamp沼泽",
    load: "装载额外Tick",
    unload: "卸载额外Tick",
    target: "目标每Tick运输量",
    safety: "替换安全缓冲Tick",
    capacity: "每次运输容量",
    loadedSpeed: "满载每格所需Tick",
    emptySpeed: "空载每格所需Tick",
    cycle: "完整往返周期Tick",
    throughput: "单只Creep每Tick吞吐量",
    needed: "所需Creep数量",
    delivered: "单只Creep寿命内预计运输量",
    cycles: "寿命内完整往返次数",
    replacement: "应在TTL达到此值时开始替换",
    spawnTime: "生成时间",
    recommendedMove: "满载每格1 Tick所需MOVE",
    bodySize: "身体部件总数",
    healthy: "按计算出的Creep数量，当前身体可以覆盖目标吞吐量。",
    warning: "当前身体或路线效率较低，请检查MOVE比例、地形、路线长度和替换时间。",
    invalid: "运输规划至少需要1个MOVE和1个CARRY。",
    bodyTooLarge: "当前身体超过Creep最多50个部件的限制。",
    copyResult: "复制路线摘要",
    copyProbe: "复制只读Creep探针",
    copied: "已复制。",
    failed: "复制失败，请手动选择可见文本。",
    boundary: "本工具假设去程满载、返程CARRY为空、路线稳定且没有拥堵。它不计算路径重算、pull链、MOVE受伤、已有fatigue、敌对干扰、Source停产、transfer失败和Container容量。",
  },
} as const;

export function HaulingThroughputPlanner({ locale }: Props) {
  const t = copy[locale];
  const [config, setConfig] = useState<HaulingState>(defaultState);
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
      distance: String(config.distance),
      carry: String(config.carryParts),
      move: String(config.moveParts),
      other: String(config.otherParts),
      boost: config.carryBoost,
      loaded: config.loadedTerrain,
      empty: config.emptyTerrain,
      load: String(config.loadTicks),
      unload: String(config.unloadTicks),
      target: String(config.targetPerTick),
      safety: String(config.safetyTicks),
    });
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [config, urlReady]);

  function update(patch: Partial<HaulingState>) {
    setConfig((current) => ({ ...current, ...patch }));
  }

  const calculation = useMemo(() => {
    const bodySize = config.carryParts + config.moveParts + config.otherParts;
    const capacity = config.carryParts * CARRY_CAPACITY * CARRY_BOOST_MULTIPLIER[config.carryBoost];
    const loadedWeight = config.carryParts + config.otherParts;
    const emptyWeight = config.otherParts;
    const loadedTicksPerTile = ticksPerTile(loadedWeight, config.moveParts, config.loadedTerrain);
    const emptyTicksPerTile = ticksPerTile(emptyWeight, config.moveParts, config.emptyTerrain);
    const loadedTravel = config.distance * loadedTicksPerTile;
    const emptyTravel = config.distance * emptyTicksPerTile;
    const cycleTicks = config.loadTicks + loadedTravel + config.unloadTicks + emptyTravel;
    const throughput = cycleTicks > 0 && Number.isFinite(cycleTicks) ? capacity / cycleTicks : 0;
    const needed = throughput > 0 ? Math.ceil(config.targetPerTick / throughput) : Number.POSITIVE_INFINITY;
    const spawnTicks = bodySize * CREEP_SPAWN_TIME;
    const replacementLead = spawnTicks + emptyTravel + config.safetyTicks;
    const productiveTicks = Math.max(0, CREEP_LIFE_TIME - emptyTravel - config.safetyTicks);
    const cycles = cycleTicks > 0 && Number.isFinite(cycleTicks) ? Math.floor(productiveTicks / cycleTicks) : 0;
    const lifetimeDelivered = cycles * capacity;
    const recommendedMove = Math.ceil(loadedWeight * TERRAIN_FATIGUE[config.loadedTerrain] / MOVE_POWER);
    const valid = config.carryParts > 0 && config.moveParts > 0 && bodySize <= 50;
    const efficient = valid && loadedTicksPerTile <= 2 && replacementLead < CREEP_LIFE_TIME;
    return { bodySize, capacity, loadedTicksPerTile, emptyTicksPerTile, loadedTravel, emptyTravel, cycleTicks, throughput, needed, spawnTicks, replacementLead, cycles, lifetimeDelivered, recommendedMove, valid, efficient };
  }, [config]);

  const alertText = calculation.bodySize > 50 ? t.bodyTooLarge : !calculation.valid ? t.invalid : calculation.efficient ? t.healthy : t.warning;
  const summary = [
    locale === "en" ? "Screeps Hauling Throughput Planner" : "Screeps运输吞吐量规划器",
    `${t.distance}: ${config.distance}`,
    `${t.bodySize}: ${calculation.bodySize}`,
    `${t.capacity}: ${formatNumber(calculation.capacity)}`,
    `${t.loadedSpeed}: ${formatNumber(calculation.loadedTicksPerTile)}`,
    `${t.emptySpeed}: ${formatNumber(calculation.emptyTicksPerTile)}`,
    `${t.cycle}: ${formatNumber(calculation.cycleTicks)}`,
    `${t.throughput}: ${formatNumber(calculation.throughput, 4)}`,
    `${t.needed}: ${formatNumber(calculation.needed)}`,
    `${t.replacement}: ${formatNumber(calculation.replacementLead)}`,
    t.boundary,
  ].join("\n");

  const probe = `const creep = Game.creeps['HAULER_NAME'];\nif (creep) {\n  console.log({\n    name: creep.name,\n    room: creep.room.name,\n    position: creep.pos,\n    ticksToLive: creep.ticksToLive,\n    fatigue: creep.fatigue,\n    carryParts: creep.getActiveBodyparts(CARRY),\n    moveParts: creep.getActiveBodyparts(MOVE),\n    usedCapacity: creep.store.getUsedCapacity(),\n    freeCapacity: creep.store.getFreeCapacity(),\n    replacementLead: ${Math.floor(calculation.replacementLead)}\n  });\n}`;

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(t.copied);
    } catch {
      setStatus(t.failed);
    }
  }

  const terrainOptions: TerrainKind[] = ["road", "plain", "swamp"];

  return (
    <div className="planning-tool" data-tool="hauling-throughput">
      <div className="planning-grid">
        <section className="planning-panel" aria-labelledby="hauling-input-title">
          <p className="eyebrow">INPUTS</p>
          <h2 id="hauling-input-title">{t.inputs}</h2>
          <div className="planning-fields">
            <label><span>{t.distance}</span><input type="number" min="0" max="5000" value={config.distance} onChange={(event) => update({ distance: clampNumber(Number(event.target.value), 0, 5000) })} /></label>
            <label><span>{t.target}</span><input type="number" min="0" step="0.1" value={config.targetPerTick} onChange={(event) => update({ targetPerTick: clampNumber(Number(event.target.value), 0, 1000000) })} /></label>
            <label><span>{t.carry}</span><input type="number" min="0" max="50" value={config.carryParts} onChange={(event) => update({ carryParts: clampNumber(Number(event.target.value), 0, 50) })} /></label>
            <label><span>{t.move}</span><input type="number" min="0" max="50" value={config.moveParts} onChange={(event) => update({ moveParts: clampNumber(Number(event.target.value), 0, 50) })} /></label>
            <label><span>{t.other}</span><input type="number" min="0" max="50" value={config.otherParts} onChange={(event) => update({ otherParts: clampNumber(Number(event.target.value), 0, 50) })} /></label>
            <label><span>{t.boost}</span><select value={config.carryBoost} onChange={(event) => update({ carryBoost: event.target.value as CarryBoost })}><option value="none">{t.none}</option><option value="KH">KH · 2×</option><option value="KH2O">KH2O · 3×</option><option value="XKH2O">XKH2O · 4×</option></select></label>
            <label><span>{t.loadedTerrain}</span><select value={config.loadedTerrain} onChange={(event) => update({ loadedTerrain: event.target.value as TerrainKind })}>{terrainOptions.map((terrain) => <option value={terrain} key={terrain}>{t[terrain]}</option>)}</select></label>
            <label><span>{t.emptyTerrain}</span><select value={config.emptyTerrain} onChange={(event) => update({ emptyTerrain: event.target.value as TerrainKind })}>{terrainOptions.map((terrain) => <option value={terrain} key={terrain}>{t[terrain]}</option>)}</select></label>
            <label><span>{t.load}</span><input type="number" min="0" max="1000" value={config.loadTicks} onChange={(event) => update({ loadTicks: clampNumber(Number(event.target.value), 0, 1000) })} /></label>
            <label><span>{t.unload}</span><input type="number" min="0" max="1000" value={config.unloadTicks} onChange={(event) => update({ unloadTicks: clampNumber(Number(event.target.value), 0, 1000) })} /></label>
            <label><span>{t.safety}</span><input type="number" min="0" max="5000" value={config.safetyTicks} onChange={(event) => update({ safetyTicks: clampNumber(Number(event.target.value), 0, 5000) })} /></label>
          </div>
        </section>

        <aside className="planning-panel planning-results" aria-labelledby="hauling-result-title">
          <p className="eyebrow">RESULT</p>
          <h2 id="hauling-result-title">{t.result}</h2>
          <p className={`planning-alert ${calculation.valid && calculation.efficient ? "planning-alert-ok" : "planning-alert-warning"}`}>{alertText}</p>
          <dl className="planning-metrics">
            <div><dt>{t.bodySize}</dt><dd>{calculation.bodySize}</dd></div>
            <div><dt>{t.capacity}</dt><dd>{formatNumber(calculation.capacity)}</dd></div>
            <div><dt>{t.loadedSpeed}</dt><dd>{formatNumber(calculation.loadedTicksPerTile)}</dd></div>
            <div><dt>{t.emptySpeed}</dt><dd>{formatNumber(calculation.emptyTicksPerTile)}</dd></div>
            <div><dt>{t.cycle}</dt><dd>{formatNumber(calculation.cycleTicks)}</dd></div>
            <div><dt>{t.throughput}</dt><dd>{formatNumber(calculation.throughput, 4)}</dd></div>
            <div><dt>{t.needed}</dt><dd>{formatNumber(calculation.needed)}</dd></div>
            <div><dt>{t.cycles}</dt><dd>{formatNumber(calculation.cycles)}</dd></div>
            <div><dt>{t.delivered}</dt><dd>{formatNumber(calculation.lifetimeDelivered)}</dd></div>
            <div><dt>{t.spawnTime}</dt><dd>{formatNumber(calculation.spawnTicks)}</dd></div>
            <div><dt>{t.replacement}</dt><dd>{formatNumber(calculation.replacementLead)}</dd></div>
            <div><dt>{t.recommendedMove}</dt><dd>{formatNumber(calculation.recommendedMove)}</dd></div>
          </dl>
          <p className="planning-boundary">{t.boundary}</p>
          <details className="planning-code"><summary>{locale === "en" ? "Read-only Creep probe" : "只读Creep探针"}</summary><pre>{probe}</pre></details>
          <div className="planning-actions"><button type="button" onClick={() => copyText(summary)}>{t.copyResult}</button><button type="button" onClick={() => copyText(probe)}>{t.copyProbe}</button></div>
          <p className="planning-status" role="status" aria-live="polite">{status}</p>
        </aside>
      </div>
    </div>
  );
}
