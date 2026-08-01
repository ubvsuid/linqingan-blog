"use client";

import { useEffect, useMemo, useState } from "react";

import { OPERATE_CONTROLLER_BONUS } from "@/lib/screeps-planning-data";

type Locale = "en" | "zh";
type UpgradeBoost = "none" | "GH" | "GH2O" | "XGH2O";

interface Props {
  locale: Locale;
}

interface ControllerToolState {
  rcl: number;
  ticksToDowngrade: number;
  safeLine: number;
  secondsPerTick: number;
  creeps: number;
  workParts: number;
  boost: UpgradeBoost;
  activePercent: number;
  progressRemaining: number;
  operateLevel: number;
}

const defaultState: ControllerToolState = {
  rcl: 8,
  ticksToDowngrade: 150000,
  safeLine: 50000,
  secondsPerTick: 3.5,
  creeps: 1,
  workParts: 15,
  boost: "none",
  activePercent: 90,
  progressRemaining: 1000000,
  operateLevel: 0,
};

const boostMultiplier: Record<UpgradeBoost, number> = {
  none: 1,
  GH: 1.5,
  GH2O: 1.8,
  XGH2O: 2,
};

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function parseNumber(params: URLSearchParams, key: string, fallback: number, min: number, max: number) {
  const raw = params.get(key);
  if (raw === null) return fallback;
  return clampNumber(Number(raw), min, max);
}

function parseState(params: URLSearchParams): ControllerToolState {
  const boost = params.get("boost");
  return {
    rcl: parseNumber(params, "rcl", defaultState.rcl, 1, 8),
    ticksToDowngrade: parseNumber(params, "ticks", defaultState.ticksToDowngrade, 0, 1000000),
    safeLine: parseNumber(params, "safe", defaultState.safeLine, 0, 1000000),
    secondsPerTick: parseNumber(params, "seconds", defaultState.secondsPerTick, 0.1, 120),
    creeps: parseNumber(params, "creeps", defaultState.creeps, 0, 100),
    workParts: parseNumber(params, "work", defaultState.workParts, 0, 50),
    boost: boost === "GH" || boost === "GH2O" || boost === "XGH2O" ? boost : "none",
    activePercent: parseNumber(params, "active", defaultState.activePercent, 0, 100),
    progressRemaining: parseNumber(params, "progress", defaultState.progressRemaining, 0, 1000000000),
    operateLevel: parseNumber(params, "operate", defaultState.operateLevel, 0, 5),
  };
}

function formatNumber(value: number, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

const copy = {
  en: {
    inputs: "Room and upgrader assumptions", result: "Downgrade and upgrade plan", rcl: "Controller level",
    ticks: "Current ticksToDowngrade", safe: "Safety line", seconds: "Estimated seconds per game tick",
    creeps: "Upgrader Creeps", work: "WORK parts per Upgrader", boost: "WORK upgrade Boost",
    active: "Effective upgrading time", progress: "Controller progress remaining", operate: "OPERATE_CONTROLLER level",
    noOperate: "None", timeToLine: "Ticks until safety line", wallTime: "Estimated wall-clock margin",
    energyTick: "Average Energy per game tick", progressTick: "Average progress per game tick",
    activePower: "Progress on an active upgrade tick", targetTicks: "Estimated ticks to target progress",
    rcl8Cap: "RCL8 Energy cap used", healthy: "The entered downgrade margin is above the selected safety line.",
    warning: "The Controller is close to the selected safety line. Restore a reliable Energy path before optimizing throughput.",
    critical: "The Controller is already at or below the selected safety line.", copyResult: "Copy plan summary",
    copyProbe: "Copy Console probe", copied: "Copied.", failed: "Copy failed. Select the visible text manually.",
    boundary: "This is a planning estimate. ticksToDowngrade, progress, Energy delivery, fatigue, Boost availability, RCL8 limits, accepted intents, and later-tick state must be checked in the live room.",
  },
  zh: {
    inputs: "房间与 Upgrader 假设", result: "降级与升级规划", rcl: "Controller 等级",
    ticks: "当前 ticksToDowngrade", safe: "安全线", seconds: "每个游戏 Tick 的估算秒数",
    creeps: "Upgrader 数量", work: "每只 Upgrader 的 WORK 数量", boost: "WORK 升级 Boost",
    active: "实际执行升级的时间比例", progress: "Controller 剩余进度", operate: "OPERATE_CONTROLLER 等级",
    noOperate: "未使用", timeToLine: "距离安全线剩余 Tick", wallTime: "估算现实时间余量",
    energyTick: "平均每个游戏 Tick 消耗 Energy", progressTick: "平均每个游戏 Tick 增加进度",
    activePower: "实际升级 Tick 的进度能力", targetTicks: "完成目标进度的估算 Tick",
    rcl8Cap: "采用的 RCL8 Energy 上限", healthy: "当前降级余量高于所选安全线。",
    warning: "Controller 已接近安全线，应先恢复稳定供能，再优化升级效率。",
    critical: "Controller 已达到或低于所选安全线。", copyResult: "复制规划摘要",
    copyProbe: "复制 Console 探针", copied: "已复制。", failed: "复制失败，请手动选择可见文本。",
    boundary: "本结果仅用于规划。必须在真实房间中核对 ticksToDowngrade、进度、供能、fatigue、Boost库存、RCL8限制、返回码和后续Tick状态。",
  },
} as const;

export function ControllerUpgraderPlanner({ locale }: Props) {
  const t = copy[locale];
  const [config, setConfig] = useState<ControllerToolState>(defaultState);
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
      rcl: String(config.rcl),
      ticks: String(config.ticksToDowngrade),
      safe: String(config.safeLine),
      seconds: String(config.secondsPerTick),
      creeps: String(config.creeps),
      work: String(config.workParts),
      boost: config.boost,
      active: String(config.activePercent),
      progress: String(config.progressRemaining),
      operate: String(config.operateLevel),
    });
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [config, urlReady]);

  function update(patch: Partial<ControllerToolState>) {
    setConfig((current) => ({ ...current, ...patch }));
  }

  const result = useMemo(() => {
    const rawEnergyOnActiveTick = config.creeps * config.workParts;
    const rcl8Limit = 15 + (OPERATE_CONTROLLER_BONUS[config.operateLevel] ?? 0);
    const energyOnActiveTick = config.rcl === 8 ? Math.min(rawEnergyOnActiveTick, rcl8Limit) : rawEnergyOnActiveTick;
    const progressOnActiveTick = energyOnActiveTick * boostMultiplier[config.boost];
    const activeRatio = config.activePercent / 100;
    const averageEnergy = energyOnActiveTick * activeRatio;
    const averageProgress = progressOnActiveTick * activeRatio;
    const targetTicks = averageProgress > 0 ? Math.ceil(config.progressRemaining / averageProgress) : Number.POSITIVE_INFINITY;
    const ticksUntilLine = Math.max(0, config.ticksToDowngrade - config.safeLine);
    const wallSeconds = ticksUntilLine * config.secondsPerTick;
    const severity = config.ticksToDowngrade <= config.safeLine
      ? "critical"
      : config.ticksToDowngrade <= config.safeLine * 1.5
        ? "warning"
        : "healthy";
    return { rawEnergyOnActiveTick, rcl8Limit, progressOnActiveTick, averageEnergy, averageProgress, targetTicks, ticksUntilLine, wallSeconds, severity };
  }, [config]);

  const wallHours = result.wallSeconds / 3600;
  const alertText = result.severity === "critical" ? t.critical : result.severity === "warning" ? t.warning : t.healthy;
  const probe = `const room = Game.rooms['ROOM_NAME'];\nconst controller = room?.controller;\nconsole.log({\n  gameTime: Game.time,\n  room: room?.name,\n  level: controller?.level,\n  ticksToDowngrade: controller?.ticksToDowngrade,\n  progress: controller?.progress,\n  progressTotal: controller?.progressTotal,\n  downgradeSafeLine: ${Math.floor(config.safeLine)},\n  warning: Boolean(controller && controller.ticksToDowngrade <= ${Math.floor(config.safeLine)})\n});`;
  const summary = [
    locale === "en" ? "Screeps Controller Downgrade and Upgrader Planner" : "Screeps Controller 降级与 Upgrader 规划器",
    `RCL: ${config.rcl}`,
    `${t.ticks}: ${formatNumber(config.ticksToDowngrade)}`,
    `${t.safe}: ${formatNumber(config.safeLine)}`,
    `${t.timeToLine}: ${formatNumber(result.ticksUntilLine)}`,
    `${t.wallTime}: ${formatNumber(wallHours)} h`,
    `${t.energyTick}: ${formatNumber(result.averageEnergy)}`,
    `${t.progressTick}: ${formatNumber(result.averageProgress)}`,
    `${t.targetTicks}: ${formatNumber(result.targetTicks)}`,
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
    <div className="planning-tool" data-tool="controller-upgrader">
      <div className="planning-grid">
        <section className="planning-panel" aria-labelledby="controller-input-title">
          <p className="eyebrow">INPUTS</p><h2 id="controller-input-title">{t.inputs}</h2>
          <div className="planning-fields">
            <label><span>{t.rcl}</span><select value={config.rcl} onChange={(event) => update({ rcl: clampNumber(Number(event.target.value), 1, 8) })}>{[1,2,3,4,5,6,7,8].map((level) => <option value={level} key={level}>RCL {level}</option>)}</select></label>
            <label><span>{t.ticks}</span><input type="number" min="0" value={config.ticksToDowngrade} onChange={(event) => update({ ticksToDowngrade: clampNumber(Number(event.target.value), 0, 1000000) })} /></label>
            <label><span>{t.safe}</span><input type="number" min="0" value={config.safeLine} onChange={(event) => update({ safeLine: clampNumber(Number(event.target.value), 0, 1000000) })} /></label>
            <label><span>{t.seconds}</span><input type="number" min="0.1" step="0.1" value={config.secondsPerTick} onChange={(event) => update({ secondsPerTick: clampNumber(Number(event.target.value), 0.1, 120) })} /></label>
            <label><span>{t.creeps}</span><input type="number" min="0" max="100" value={config.creeps} onChange={(event) => update({ creeps: clampNumber(Number(event.target.value), 0, 100) })} /></label>
            <label><span>{t.work}</span><input type="number" min="0" max="50" value={config.workParts} onChange={(event) => update({ workParts: clampNumber(Number(event.target.value), 0, 50) })} /></label>
            <label><span>{t.boost}</span><select value={config.boost} onChange={(event) => update({ boost: event.target.value as UpgradeBoost })}><option value="none">{locale === "en" ? "None" : "未使用"}</option><option value="GH">GH · 1.5×</option><option value="GH2O">GH2O · 1.8×</option><option value="XGH2O">XGH2O · 2×</option></select></label>
            <label><span>{t.active}: {config.activePercent}%</span><input type="range" min="0" max="100" value={config.activePercent} onChange={(event) => update({ activePercent: clampNumber(Number(event.target.value), 0, 100) })} /></label>
            <label><span>{t.progress}</span><input type="number" min="0" value={config.progressRemaining} onChange={(event) => update({ progressRemaining: clampNumber(Number(event.target.value), 0, 1000000000) })} /></label>
            <label><span>{t.operate}</span><select value={config.operateLevel} onChange={(event) => update({ operateLevel: clampNumber(Number(event.target.value), 0, 5) })}><option value="0">{t.noOperate}</option>{[1,2,3,4,5].map((level) => <option value={level} key={level}>Level {level} · +{OPERATE_CONTROLLER_BONUS[level] ?? 0}</option>)}</select></label>
          </div>
        </section>

        <aside className="planning-panel planning-results" aria-labelledby="controller-result-title">
          <p className="eyebrow">RESULT</p><h2 id="controller-result-title">{t.result}</h2>
          <p className={`planning-alert planning-alert-${result.severity === "healthy" ? "ok" : "warning"}`}>{alertText}</p>
          <dl className="planning-metrics">
            <div><dt>{t.timeToLine}</dt><dd>{formatNumber(result.ticksUntilLine)}</dd></div>
            <div><dt>{t.wallTime}</dt><dd>{formatNumber(wallHours)} h</dd></div>
            <div><dt>{t.energyTick}</dt><dd>{formatNumber(result.averageEnergy)}</dd></div>
            <div><dt>{t.progressTick}</dt><dd>{formatNumber(result.averageProgress)}</dd></div>
            <div><dt>{t.activePower}</dt><dd>{formatNumber(result.progressOnActiveTick)}</dd></div>
            <div><dt>{t.targetTicks}</dt><dd>{formatNumber(result.targetTicks)}</dd></div>
            {config.rcl === 8 && <div className="planning-metric-wide"><dt>{t.rcl8Cap}</dt><dd>{formatNumber(result.rcl8Limit)} Energy / tick</dd></div>}
          </dl>
          {config.rcl === 8 && result.rawEnergyOnActiveTick > result.rcl8Limit && <p className="planning-note">{locale === "en" ? `${formatNumber(result.rawEnergyOnActiveTick - result.rcl8Limit)} WORK Energy is above the selected RCL8 cap and does not increase Controller progress on that tick.` : `有 ${formatNumber(result.rawEnergyOnActiveTick - result.rcl8Limit)} 点 WORK Energy 超出所选 RCL8 上限，不会在该 Tick 增加 Controller 进度。`}</p>}
          <p className="planning-boundary">{t.boundary}</p>
          <details className="planning-code"><summary>{locale === "en" ? "Read-only Console probe" : "只读 Console 探针"}</summary><pre>{probe}</pre></details>
          <div className="planning-actions"><button type="button" onClick={() => copyText(summary)}>{t.copyResult}</button><button type="button" onClick={() => copyText(probe)}>{t.copyProbe}</button></div>
          <p className="planning-status" role="status" aria-live="polite">{status}</p>
        </aside>
      </div>
    </div>
  );
}
