"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CREEP_CLAIM_LIFE_TIME,
  CREEP_LIFE_TIME,
  CREEP_SPAWN_TIME,
  OPERATE_SPAWN_REDUCTION,
} from "@/lib/screeps-operations-data";

type Locale = "en" | "zh";
type LifetimeKind = "normal" | "claim";

interface Props {
  locale: Locale;
}

interface RoleProfile {
  name: string;
  bodyParts: number;
  count: number;
  travelTicks: number;
  safetyTicks: number;
  lifetime: LifetimeKind;
}

interface SpawnPlannerState {
  spawns: number;
  operateLevel: number;
  roles: RoleProfile[];
}

const defaultRoles: RoleProfile[] = [
  { name: "Harvester", bodyParts: 12, count: 2, travelTicks: 15, safetyTicks: 10, lifetime: "normal" },
  { name: "Hauler", bodyParts: 10, count: 2, travelTicks: 20, safetyTicks: 10, lifetime: "normal" },
  { name: "Upgrader", bodyParts: 15, count: 1, travelTicks: 10, safetyTicks: 10, lifetime: "normal" },
  { name: "Reserver", bodyParts: 4, count: 0, travelTicks: 80, safetyTicks: 20, lifetime: "claim" },
];

const defaultState: SpawnPlannerState = {
  spawns: 1,
  operateLevel: 0,
  roles: defaultRoles,
};

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function parseNumber(params: URLSearchParams, key: string, fallback: number, min: number, max: number) {
  const raw = params.get(key);
  if (raw === null) return fallback;
  return clampNumber(Number(raw), min, max);
}

function normalizeRole(value: Partial<RoleProfile>, fallback: RoleProfile): RoleProfile {
  return {
    name: String(value.name ?? fallback.name).replace(/[<>]/g, "").slice(0, 32) || fallback.name,
    bodyParts: clampNumber(Number(value.bodyParts ?? fallback.bodyParts), 1, 50),
    count: clampNumber(Number(value.count ?? fallback.count), 0, 100),
    travelTicks: clampNumber(Number(value.travelTicks ?? fallback.travelTicks), 0, 5000),
    safetyTicks: clampNumber(Number(value.safetyTicks ?? fallback.safetyTicks), 0, 5000),
    lifetime: value.lifetime === "claim" ? "claim" : "normal",
  };
}

function parseState(params: URLSearchParams): SpawnPlannerState {
  let roles = defaultRoles;
  const encodedRoles = params.get("roles");
  if (encodedRoles) {
    try {
      const parsed = JSON.parse(encodedRoles);
      if (Array.isArray(parsed)) {
        roles = defaultRoles.map((fallback, index) => normalizeRole(parsed[index] ?? {}, fallback));
      }
    } catch {
      roles = defaultRoles;
    }
  }

  return {
    spawns: parseNumber(params, "spawns", defaultState.spawns, 1, 3),
    operateLevel: parseNumber(params, "operate", defaultState.operateLevel, 0, 5),
    roles,
  };
}

function formatNumber(value: number, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

const copy = {
  en: {
    inputs: "Spawn capacity and role profiles",
    result: "Replacement capacity plan",
    spawns: "Available Spawns",
    operate: "OPERATE_SPAWN level",
    none: "None",
    role: "Role",
    body: "Body parts",
    count: "Active Creeps",
    travel: "Travel ticks",
    buffer: "Safety buffer",
    lifetime: "Lifetime",
    normal: "Normal · 1500 ticks",
    claim: "CLAIM body · 600 ticks",
    utilization: "Average Spawn utilization",
    demand: "Spawn ticks demanded per 1500 ticks",
    capacity: "Spawn capacity per 1500 ticks",
    minimum: "Minimum Spawns by average load",
    slack: "Average free Spawn ticks",
    spawnTime: "Spawn time",
    prespawn: "Start replacement at TTL",
    interval: "Average replacement interval",
    share: "Capacity share",
    healthy: "Average replacement demand fits the selected Spawn capacity.",
    tight: "Spawn capacity is tight. Bursts, emergency Creeps, and delayed Energy refills can create queue gaps.",
    overloaded: "Average replacement demand exceeds the selected Spawn capacity.",
    copyResult: "Copy plan summary",
    copyProbe: "Copy read-only queue probe",
    copied: "Copied.",
    failed: "Copy failed. Select the visible text manually.",
    boundary: "This is an average-load planner, not an exact scheduler. It does not model simultaneous replacement deadlines, Spawn Energy refill time, spawn direction blocking, DISRUPT_SPAWN, extension availability, failed spawnCreep calls, or live queue priority.",
  },
  zh: {
    inputs: "Spawn容量与角色配置",
    result: "替换与队列规划",
    spawns: "可用Spawn数量",
    operate: "OPERATE_SPAWN等级",
    none: "未使用",
    role: "角色名称",
    body: "身体部件数",
    count: "常驻Creep数量",
    travel: "到工作点的Tick",
    buffer: "安全缓冲Tick",
    lifetime: "寿命类型",
    normal: "普通Creep · 1500 Tick",
    claim: "含CLAIM · 600 Tick",
    utilization: "平均Spawn利用率",
    demand: "每1500 Tick需要的生成Tick",
    capacity: "每1500 Tick可用生成容量",
    minimum: "按平均负载所需Spawn",
    slack: "平均空闲生成Tick",
    spawnTime: "生成时间",
    prespawn: "应在TTL达到此值时开始替换",
    interval: "平均替换间隔",
    share: "容量占用比例",
    healthy: "平均替换需求可以被当前Spawn容量覆盖。",
    tight: "Spawn容量较紧，集中替换、紧急Creep和补能延迟都可能造成断档。",
    overloaded: "平均替换需求已经超过当前Spawn容量。",
    copyResult: "复制规划摘要",
    copyProbe: "复制只读队列探针",
    copied: "已复制。",
    failed: "复制失败，请手动选择可见文本。",
    boundary: "本工具只计算平均负载，不是精确队列调度器。它不计算多个角色同时到期、Spawn补能、出生方向阻塞、DISRUPT_SPAWN、Extension可用性、spawnCreep失败和真实优先级。",
  },
} as const;

export function SpawnQueueReplacementPlanner({ locale }: Props) {
  const t = copy[locale];
  const [config, setConfig] = useState<SpawnPlannerState>(defaultState);
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
      spawns: String(config.spawns),
      operate: String(config.operateLevel),
      roles: JSON.stringify(config.roles),
    });
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [config, urlReady]);

  function update(patch: Partial<Omit<SpawnPlannerState, "roles">>) {
    setConfig((current) => ({ ...current, ...patch }));
  }

  function updateRole(index: number, patch: Partial<RoleProfile>) {
    setConfig((current) => ({
      ...current,
      roles: current.roles.map((role, roleIndex) => roleIndex === index ? normalizeRole({ ...role, ...patch }, role) : role),
    }));
  }

  const calculation = useMemo(() => {
    const reduction = OPERATE_SPAWN_REDUCTION[config.operateLevel] ?? 0;
    const roles = config.roles.map((role) => {
      const lifetime = role.lifetime === "claim" ? CREEP_CLAIM_LIFE_TIME : CREEP_LIFE_TIME;
      const baseSpawnTicks = role.bodyParts * CREEP_SPAWN_TIME;
      const spawnTicks = Math.max(1, Math.ceil(baseSpawnTicks * (1 - reduction)));
      const demandPerTick = role.count * spawnTicks / lifetime;
      const replacementLead = spawnTicks + role.travelTicks + role.safetyTicks;
      const interval = role.count > 0 ? lifetime / role.count : Number.POSITIVE_INFINITY;
      const capacityShare = demandPerTick / config.spawns * 100;
      return { ...role, lifetimeTicks: lifetime, baseSpawnTicks, spawnTicks, demandPerTick, replacementLead, interval, capacityShare };
    });
    const demandPerTick = roles.reduce((sum, role) => sum + role.demandPerTick, 0);
    const demandPer1500 = demandPerTick * CREEP_LIFE_TIME;
    const capacityPer1500 = config.spawns * CREEP_LIFE_TIME;
    const utilization = demandPerTick / config.spawns * 100;
    const minimumSpawns = demandPerTick > 0 ? Math.ceil(demandPerTick) : 0;
    const slack = capacityPer1500 - demandPer1500;
    const severity = utilization > 100 ? "overloaded" : utilization >= 85 ? "tight" : "healthy";
    return { roles, demandPer1500, capacityPer1500, utilization, minimumSpawns, slack, severity, reduction };
  }, [config]);

  const alertText = calculation.severity === "overloaded" ? t.overloaded : calculation.severity === "tight" ? t.tight : t.healthy;
  const summary = [
    locale === "en" ? "Screeps Spawn Queue and Replacement Planner" : "Screeps Spawn队列与替换规划器",
    `${t.spawns}: ${config.spawns}`,
    `${t.operate}: ${config.operateLevel}`,
    `${t.utilization}: ${formatNumber(calculation.utilization)}%`,
    `${t.demand}: ${formatNumber(calculation.demandPer1500)}`,
    `${t.capacity}: ${formatNumber(calculation.capacityPer1500)}`,
    `${t.minimum}: ${calculation.minimumSpawns}`,
    ...calculation.roles.filter((role) => role.count > 0).map((role) => `${role.name}: ${role.count} × ${role.bodyParts} parts · ${role.spawnTicks} spawn ticks · replace at TTL ${role.replacementLead}`),
    t.boundary,
  ].join("\n");

  const probe = `const roleProfiles = ${JSON.stringify(calculation.roles.filter((role) => role.count > 0).map((role) => ({ role: role.name, plannedCount: role.count, replacementLead: role.replacementLead })), null, 2)};\nfor (const profile of roleProfiles) {\n  const creeps = Object.values(Game.creeps).filter(creep => creep.memory.role === profile.role);\n  const ttl = creeps.map(creep => creep.ticksToLive ?? 0).sort((a, b) => a - b);\n  console.log({ role: profile.role, plannedCount: profile.plannedCount, liveCount: creeps.length, lowestTTL: ttl[0] ?? null, replacementLead: profile.replacementLead });\n}`;

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(t.copied);
    } catch {
      setStatus(t.failed);
    }
  }

  return (
    <div className="planning-tool" data-tool="spawn-queue">
      <div className="planning-grid">
        <section className="planning-panel" aria-labelledby="spawn-input-title">
          <p className="eyebrow">INPUTS</p>
          <h2 id="spawn-input-title">{t.inputs}</h2>
          <div className="planning-fields">
            <label><span>{t.spawns}</span><select value={config.spawns} onChange={(event) => update({ spawns: clampNumber(Number(event.target.value), 1, 3) })}>{[1, 2, 3].map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
            <label><span>{t.operate}</span><select value={config.operateLevel} onChange={(event) => update({ operateLevel: clampNumber(Number(event.target.value), 0, 5) })}><option value="0">{t.none}</option>{[1, 2, 3, 4, 5].map((level) => <option value={level} key={level}>Level {level} · -{Math.round((OPERATE_SPAWN_REDUCTION[level] ?? 0) * 100)}%</option>)}</select></label>
          </div>

          <div className="planning-profile-list">
            {config.roles.map((role, index) => (
              <fieldset className="planning-profile" key={index}>
                <legend>{locale === "en" ? `Profile ${index + 1}` : `角色配置 ${index + 1}`}</legend>
                <div className="planning-fields">
                  <label><span>{t.role}</span><input value={role.name} onChange={(event) => updateRole(index, { name: event.target.value })} /></label>
                  <label><span>{t.body}</span><input type="number" min="1" max="50" value={role.bodyParts} onChange={(event) => updateRole(index, { bodyParts: Number(event.target.value) })} /></label>
                  <label><span>{t.count}</span><input type="number" min="0" max="100" value={role.count} onChange={(event) => updateRole(index, { count: Number(event.target.value) })} /></label>
                  <label><span>{t.travel}</span><input type="number" min="0" max="5000" value={role.travelTicks} onChange={(event) => updateRole(index, { travelTicks: Number(event.target.value) })} /></label>
                  <label><span>{t.buffer}</span><input type="number" min="0" max="5000" value={role.safetyTicks} onChange={(event) => updateRole(index, { safetyTicks: Number(event.target.value) })} /></label>
                  <label><span>{t.lifetime}</span><select value={role.lifetime} onChange={(event) => updateRole(index, { lifetime: event.target.value as LifetimeKind })}><option value="normal">{t.normal}</option><option value="claim">{t.claim}</option></select></label>
                </div>
              </fieldset>
            ))}
          </div>
        </section>

        <aside className="planning-panel planning-results" aria-labelledby="spawn-result-title">
          <p className="eyebrow">RESULT</p>
          <h2 id="spawn-result-title">{t.result}</h2>
          <p className={`planning-alert ${calculation.severity === "healthy" ? "planning-alert-ok" : "planning-alert-warning"}`}>{alertText}</p>
          <dl className="planning-metrics">
            <div><dt>{t.utilization}</dt><dd>{formatNumber(calculation.utilization)}%</dd></div>
            <div><dt>{t.minimum}</dt><dd>{calculation.minimumSpawns}</dd></div>
            <div><dt>{t.demand}</dt><dd>{formatNumber(calculation.demandPer1500)}</dd></div>
            <div><dt>{t.capacity}</dt><dd>{formatNumber(calculation.capacityPer1500)}</dd></div>
            <div className="planning-metric-wide"><dt>{t.slack}</dt><dd>{formatNumber(calculation.slack)}</dd></div>
          </dl>

          <section className="planning-stage-list" aria-labelledby="spawn-role-result-title">
            <h3 id="spawn-role-result-title">{locale === "en" ? "Role replacement details" : "角色替换明细"}</h3>
            <ol>
              {calculation.roles.map((role, index) => (
                <li key={`${role.name}-${index}`}>
                  <strong>{role.name} × {role.count}</strong>
                  <span>{t.spawnTime}: {role.spawnTicks} · {t.prespawn}: {role.replacementLead} · {t.interval}: {formatNumber(role.interval)} · {t.share}: {formatNumber(role.capacityShare)}%</span>
                </li>
              ))}
            </ol>
          </section>

          <p className="planning-boundary">{t.boundary}</p>
          <details className="planning-code"><summary>{locale === "en" ? "Read-only queue probe" : "只读队列探针"}</summary><pre>{probe}</pre></details>
          <div className="planning-actions"><button type="button" onClick={() => copyText(summary)}>{t.copyResult}</button><button type="button" onClick={() => copyText(probe)}>{t.copyProbe}</button></div>
          <p className="planning-status" role="status" aria-live="polite">{status}</p>
        </aside>
      </div>
    </div>
  );
}
