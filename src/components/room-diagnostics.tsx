"use client";

import { useMemo, useState } from "react";

type Severity = "严重" | "注意" | "正常";

interface Finding {
  severity: Severity;
  title: string;
  detail: string;
  href?: string;
}

const probeCode = `const room = Game.rooms['W1N1'];
if (!room) throw new Error('当前没有该房间视野');
const creeps = room.find(FIND_MY_CREEPS);
const roleCounts = _.countBy(creeps, creep => creep.memory.role || 'unknown');
console.log(JSON.stringify({
  room: room.name,
  energyAvailable: room.energyAvailable,
  energyCapacityAvailable: room.energyCapacityAvailable,
  spawnCount: room.find(FIND_MY_SPAWNS).length,
  creepCount: creeps.length,
  roleCounts,
  storageEnergy: room.storage?.store.getUsedCapacity(RESOURCE_ENERGY) ?? null,
  controllerTicksToDowngrade: room.controller?.ticksToDowngrade ?? null,
  constructionSites: room.find(FIND_MY_CONSTRUCTION_SITES).length,
  cpuUsed: Game.cpu.getUsed(),
  cpuLimit: Game.cpu.limit,
  bucket: Game.cpu.bucket
}, null, 2));`;

function parseNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

export function RoomDiagnostics() {
  const [spawnCount, setSpawnCount] = useState("1");
  const [harvesterCount, setHarvesterCount] = useState("2");
  const [haulerCount, setHaulerCount] = useState("1");
  const [energyAvailable, setEnergyAvailable] = useState("300");
  const [energyCapacity, setEnergyCapacity] = useState("550");
  const [storageEnergy, setStorageEnergy] = useState("20000");
  const [controllerTicks, setControllerTicks] = useState("10000");
  const [constructionSites, setConstructionSites] = useState("0");
  const [cpuUsed, setCpuUsed] = useState("8");
  const [cpuLimit, setCpuLimit] = useState("20");
  const [bucket, setBucket] = useState("10000");
  const [copyState, setCopyState] = useState("复制 Console 探针");

  const findings = useMemo<Finding[]>(() => {
    const spawns = parseNumber(spawnCount);
    const harvesters = parseNumber(harvesterCount);
    const haulers = parseNumber(haulerCount);
    const available = parseNumber(energyAvailable);
    const capacity = parseNumber(energyCapacity);
    const stored = parseNumber(storageEnergy);
    const downgrade = parseNumber(controllerTicks);
    const sites = parseNumber(constructionSites);
    const used = parseNumber(cpuUsed);
    const limit = Math.max(1, parseNumber(cpuLimit, 1));
    const cpuBucket = parseNumber(bucket);
    const results: Finding[] = [];

    if (spawns === 0) {
      results.push({ severity: "严重", title: "房间没有可用 Spawn", detail: "无法在本房间生成替代 Creep。先确认 Spawn 是否存在、属于自己且当前 RCL 允许使用。", href: "/blog/screeps-spawn-emergency-recovery" });
    }
    if (harvesters === 0) {
      results.push({ severity: "严重", title: "采集者数量为 0", detail: "房间可能进入断代。优先生成最低成本采集者，并暂停非必要角色。", href: "/blog/screeps-spawn-emergency-recovery" });
    } else if (harvesters === 1) {
      results.push({ severity: "注意", title: "采集冗余较低", detail: "唯一采集者死亡或卡住时会直接中断 Energy 输入。检查补员时机和剩余寿命。" });
    }
    if (haulers === 0 && stored > 0) {
      results.push({ severity: "注意", title: "可能缺少运输角色", detail: "Storage 已有 Energy，但运输者为 0。确认采集者是否兼任运输，或新增明确的物流角色。" });
    }
    if (capacity > 0 && available / capacity < 0.35) {
      results.push({ severity: "注意", title: "当前可用 Energy 偏低", detail: `当前为 ${Math.round((available / capacity) * 100)}%。检查采集、运输、Spawn/Extension 装填和高消耗任务。`, href: "/blog/screeps-storage-energy-usage" });
    }
    if (downgrade > 0 && downgrade < 5000) {
      results.push({ severity: "严重", title: "Controller 接近降级", detail: "立即提高 Upgrader 优先级并保证 Controller 附近 Energy 供应。阈值是诊断建议，不是官方固定告警线。", href: "/blog/screeps-controller-downgrade" });
    } else if (downgrade > 0 && downgrade < 10000) {
      results.push({ severity: "注意", title: "Controller 降级时间偏低", detail: "检查 Upgrader 数量、能量来源和路径，避免进入紧急恢复状态。", href: "/blog/screeps-controller-downgrade" });
    }
    if (sites > 20) {
      results.push({ severity: "注意", title: "工地数量较多", detail: "大量工地可能分散 Builder 和 Energy。按核心经济、道路和防御顺序控制建设批次。", href: "/blog/screeps-construction-site-progress" });
    }
    if (used / limit >= 0.9) {
      results.push({ severity: "严重", title: "CPU 接近或超过限额", detail: `当前使用约 ${Math.round((used / limit) * 100)}%。先记录多 tick 样本，再检查高频 find、路径计算、排序和日志。`, href: "/blog/screeps-cpu-getused-bucket" });
    } else if (used / limit >= 0.7) {
      results.push({ severity: "注意", title: "CPU 使用率偏高", detail: "不要仅凭一个 tick 判断。记录平均值、峰值和 bucket 变化后再优化。", href: "/blog/screeps-cpu-getused-bucket" });
    }
    if (cpuBucket < 1000) {
      results.push({ severity: "严重", title: "CPU bucket 很低", detail: "暂停非必要扫描和可延后任务，避免持续透支导致执行受限。", href: "/blog/screeps-cpu-getused-bucket" });
    } else if (cpuBucket < 5000) {
      results.push({ severity: "注意", title: "CPU bucket 正在下降", detail: "观察一段时间的净变化，确认平均 CPU 是否长期高于可恢复水平。" });
    }

    if (results.length === 0) {
      results.push({ severity: "正常", title: "没有发现明显阻断项", detail: "这只是静态快照诊断。继续观察返回值、角色寿命、路径和多 tick 趋势。" });
    }

    const order: Record<Severity, number> = { 严重: 0, 注意: 1, 正常: 2 };
    return results.sort((left, right) => order[left.severity] - order[right.severity]);
  }, [spawnCount, harvesterCount, haulerCount, energyAvailable, energyCapacity, storageEnergy, controllerTicks, constructionSites, cpuUsed, cpuLimit, bucket]);

  async function copyProbe() {
    try {
      await navigator.clipboard.writeText(probeCode);
      setCopyState("已复制");
      window.setTimeout(() => setCopyState("复制 Console 探针"), 1600);
    } catch {
      setCopyState("复制失败，请手动选择");
    }
  }

  const fields = [
    ["Spawn 数量", spawnCount, setSpawnCount],
    ["Harvester 数量", harvesterCount, setHarvesterCount],
    ["Hauler 数量", haulerCount, setHaulerCount],
    ["room.energyAvailable", energyAvailable, setEnergyAvailable],
    ["room.energyCapacityAvailable", energyCapacity, setEnergyCapacity],
    ["Storage Energy", storageEnergy, setStorageEnergy],
    ["Controller ticksToDowngrade", controllerTicks, setControllerTicks],
    ["己方工地数量", constructionSites, setConstructionSites],
    ["Game.cpu.getUsed()", cpuUsed, setCpuUsed],
    ["Game.cpu.limit", cpuLimit, setCpuLimit],
    ["Game.cpu.bucket", bucket, setBucket],
  ] as const;

  return (
    <div className="room-diagnostics">
      <section className="diagnostic-inputs" aria-labelledby="diagnostic-inputs-title">
        <div className="diagnostic-heading">
          <div><p className="eyebrow">ROOM SNAPSHOT</p><h2 id="diagnostic-inputs-title">输入当前房间快照</h2></div>
          <button type="button" onClick={copyProbe}>{copyState}</button>
        </div>
        <p className="diagnostic-note">工具不会连接你的 Screeps 账号。可以手动输入，或把 Console 探针中的房间名改成自己的房间后执行，再将结果填入。</p>
        <div className="diagnostic-field-grid">
          {fields.map(([label, value, setter]) => (
            <label key={label}><span>{label}</span><input type="number" min="0" value={value} onChange={(event) => setter(event.target.value)} /></label>
          ))}
        </div>
      </section>

      <section className="diagnostic-results" aria-labelledby="diagnostic-results-title">
        <div><p className="eyebrow">RESULT</p><h2 id="diagnostic-results-title">诊断结果</h2></div>
        <div className="diagnostic-findings" aria-live="polite">
          {findings.map((finding, index) => (
            <article className={`finding finding-${finding.severity}`} key={`${finding.title}-${index}`}>
              <span>{finding.severity}</span>
              <div><h3>{finding.title}</h3><p>{finding.detail}</p>{finding.href ? <a href={finding.href}>阅读对应排查文章 →</a> : null}</div>
            </article>
          ))}
        </div>
        <details className="diagnostic-probe"><summary>查看 Console 探针代码</summary><pre><code>{probeCode}</code></pre></details>
      </section>

      <style>{`
        .room-diagnostics { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(340px, .95fr); gap: 24px; align-items: start; }
        .diagnostic-inputs, .diagnostic-results { border: 1px solid var(--border); border-radius: 24px; padding: clamp(24px, 4vw, 38px); background: var(--surface); }
        .diagnostic-results { position: sticky; top: 24px; display: grid; gap: 24px; }
        .diagnostic-heading { display: flex; align-items: end; justify-content: space-between; gap: 18px; }
        .diagnostic-heading h2, .diagnostic-results h2 { margin: 8px 0 0; font-size: clamp(30px, 4vw, 44px); letter-spacing: -.045em; }
        .diagnostic-heading button { min-height: 42px; border: 1px solid var(--border); border-radius: 999px; padding: 0 14px; background: var(--background); color: var(--foreground); cursor: pointer; }
        .diagnostic-note { margin: 22px 0 0; color: var(--muted); line-height: 1.7; }
        .diagnostic-field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 28px; }
        .diagnostic-field-grid label { display: grid; gap: 7px; color: var(--muted); font-size: 12px; }
        .diagnostic-field-grid input { min-height: 48px; border: 1px solid var(--border); border-radius: 13px; padding: 0 13px; background: var(--background); color: var(--foreground); font: inherit; font-size: 15px; }
        .diagnostic-findings { display: grid; gap: 10px; }
        .finding { display: grid; grid-template-columns: 54px minmax(0, 1fr); gap: 16px; border: 1px solid var(--border); border-radius: 16px; padding: 18px; }
        .finding > span { width: fit-content; height: fit-content; border-radius: 999px; padding: 5px 8px; background: var(--background); font-size: 11px; font-weight: 700; }
        .finding h3 { margin: 0; font-size: 18px; }
        .finding p { margin: 7px 0 0; color: var(--muted); font-size: 13px; line-height: 1.65; }
        .finding a { display: inline-flex; margin-top: 10px; font-size: 13px; font-weight: 700; }
        .finding-严重 { border-color: color-mix(in srgb, #b91c1c 45%, var(--border)); }
        .finding-注意 { border-color: color-mix(in srgb, #b45309 40%, var(--border)); }
        .finding-正常 { border-color: color-mix(in srgb, #15803d 35%, var(--border)); }
        .diagnostic-probe { border-top: 1px solid var(--border); padding-top: 18px; }
        .diagnostic-probe summary { cursor: pointer; font-weight: 700; }
        .diagnostic-probe pre { overflow-x: auto; margin: 16px 0 0; border-radius: 14px; padding: 16px; background: var(--background); font-size: 12px; line-height: 1.6; }
        @media (max-width: 900px) { .room-diagnostics { grid-template-columns: 1fr; } .diagnostic-results { position: static; } }
        @media (max-width: 620px) { .diagnostic-field-grid { grid-template-columns: 1fr; } .diagnostic-heading { align-items: start; flex-direction: column; } }
      `}</style>
    </div>
  );
}
