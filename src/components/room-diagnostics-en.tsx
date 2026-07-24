"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

type Severity = "Critical" | "Warning" | "Healthy";

interface Finding {
  severity: Severity;
  title: string;
  detail: string;
  href?: string;
}

const probeCode = `const room = Game.rooms['W1N1'];
if (!room) throw new Error('No visibility for this room');
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

export function EnglishRoomDiagnostics() {
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
  const [copyState, setCopyState] = useState("Copy Console probe");

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
      results.push({ severity: "Critical", title: "No available Spawn", detail: "The room cannot create replacement Creeps. Confirm that a Spawn exists, belongs to you, and is usable at the current RCL.", href: "/en/screeps-errors" });
    }
    if (harvesters === 0) {
      results.push({ severity: "Critical", title: "Harvester count is zero", detail: "The room may be in an economic collapse. Spawn the cheapest viable harvester first and pause non-essential roles." });
    } else if (harvesters === 1) {
      results.push({ severity: "Warning", title: "Low harvesting redundancy", detail: "A single death, path block, or incorrect state can stop Energy input. Check replacement timing and ticksToLive." });
    }
    if (haulers === 0 && stored > 0) {
      results.push({ severity: "Warning", title: "Logistics may be missing", detail: "Storage contains Energy but the hauler count is zero. Confirm whether harvesters deliver directly or add a dedicated hauling role." });
    }
    if (capacity > 0 && available / capacity < 0.35) {
      results.push({ severity: "Warning", title: "Low immediately available Energy", detail: `The room is at ${Math.round((available / capacity) * 100)}% of capacity. Check harvesting, hauling, Spawn and Extension filling, and high-cost spawn requests.` });
    }
    if (downgrade > 0 && downgrade < 5000) {
      results.push({ severity: "Critical", title: "Controller downgrade is close", detail: "Raise Upgrader priority and secure Energy near the Controller. This threshold is a maintenance recommendation, not a fixed official alert." });
    } else if (downgrade > 0 && downgrade < 10000) {
      results.push({ severity: "Warning", title: "Controller downgrade time is low", detail: "Check Upgrader population, Energy source, path length, and whether another task is overriding upgrading." });
    }
    if (sites > 20) {
      results.push({ severity: "Warning", title: "Large construction queue", detail: "Many sites can spread Builders and Energy across low-priority work. Stage construction around economy, roads, and defense." });
    }
    if (used / limit >= 0.9) {
      results.push({ severity: "Critical", title: "CPU is near or above the limit", detail: `Current use is about ${Math.round((used / limit) * 100)}%. Record multi-tick samples, then inspect repeated find calls, path searches, sorting, and logs.` });
    } else if (used / limit >= 0.7) {
      results.push({ severity: "Warning", title: "CPU use is elevated", detail: "Do not optimize from one tick. Record average use, peaks, and bucket direction before changing code." });
    }
    if (cpuBucket < 1000) {
      results.push({ severity: "Critical", title: "CPU bucket is very low", detail: "Pause optional scans and deferrable work to avoid sustained overuse and execution pressure." });
    } else if (cpuBucket < 5000) {
      results.push({ severity: "Warning", title: "CPU bucket is below the comfortable range", detail: "Observe the net bucket change over time and compare average CPU use with the account limit." });
    }

    if (results.length === 0) {
      results.push({ severity: "Healthy", title: "No obvious blocking condition", detail: "This is only a static snapshot. Continue checking action return codes, ticksToLive, paths, and multi-tick trends." });
    }

    const order: Record<Severity, number> = { Critical: 0, Warning: 1, Healthy: 2 };
    return results.sort((left, right) => order[left.severity] - order[right.severity]);
  }, [spawnCount, harvesterCount, haulerCount, energyAvailable, energyCapacity, storageEnergy, controllerTicks, constructionSites, cpuUsed, cpuLimit, bucket]);

  async function copyProbe() {
    try {
      await navigator.clipboard.writeText(probeCode);
      setCopyState("Copied");
      window.setTimeout(() => setCopyState("Copy Console probe"), 1600);
    } catch {
      setCopyState("Copy failed — select manually");
    }
  }

  const fields = [
    ["Spawn count", spawnCount, setSpawnCount],
    ["Harvester count", harvesterCount, setHarvesterCount],
    ["Hauler count", haulerCount, setHaulerCount],
    ["room.energyAvailable", energyAvailable, setEnergyAvailable],
    ["room.energyCapacityAvailable", energyCapacity, setEnergyCapacity],
    ["Storage Energy", storageEnergy, setStorageEnergy],
    ["Controller ticksToDowngrade", controllerTicks, setControllerTicks],
    ["My construction sites", constructionSites, setConstructionSites],
    ["Game.cpu.getUsed()", cpuUsed, setCpuUsed],
    ["Game.cpu.limit", cpuLimit, setCpuLimit],
    ["Game.cpu.bucket", bucket, setBucket],
  ] as const;

  return (
    <div className="room-diagnostics-en">
      <section className="diagnostic-inputs-en" aria-labelledby="diagnostic-inputs-en-title">
        <div className="diagnostic-heading-en">
          <div><p className="eyebrow">ROOM SNAPSHOT</p><h2 id="diagnostic-inputs-en-title">Enter the current room state</h2></div>
          <button type="button" onClick={copyProbe}>{copyState}</button>
        </div>
        <p className="diagnostic-note-en">The tool does not connect to your Screeps account. Enter values manually, or replace the example room name in the read-only Console probe and copy the resulting snapshot.</p>
        <div className="diagnostic-field-grid-en">
          {fields.map(([label, value, setter]) => (
            <label key={label}><span>{label}</span><input type="number" min="0" value={value} onChange={(event) => setter(event.target.value)} /></label>
          ))}
        </div>
      </section>

      <section className="diagnostic-results-en" aria-labelledby="diagnostic-results-en-title">
        <div><p className="eyebrow">RESULT</p><h2 id="diagnostic-results-en-title">Prioritized findings</h2></div>
        <div className="diagnostic-findings-en" aria-live="polite">
          {findings.map((finding, index) => (
            <article className={`finding-en finding-${finding.severity.toLowerCase()}-en`} key={`${finding.title}-${index}`}>
              <span>{finding.severity}</span>
              <div><h3>{finding.title}</h3><p>{finding.detail}</p>{finding.href ? <Link href={finding.href}>Open the relevant reference →</Link> : null}</div>
            </article>
          ))}
        </div>
        <details className="diagnostic-probe-en"><summary>View the read-only Console probe</summary><pre><code>{probeCode}</code></pre></details>
      </section>

      <style>{`
        .room-diagnostics-en { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(340px, .95fr); gap: 24px; align-items: start; }
        .diagnostic-inputs-en, .diagnostic-results-en { border: 1px solid var(--border); border-radius: 24px; padding: clamp(24px, 4vw, 38px); background: var(--surface); }
        .diagnostic-results-en { position: sticky; top: 24px; display: grid; gap: 24px; }
        .diagnostic-heading-en { display: flex; align-items: end; justify-content: space-between; gap: 18px; }
        .diagnostic-heading-en h2, .diagnostic-results-en h2 { margin: 8px 0 0; font-size: clamp(30px, 4vw, 44px); letter-spacing: -.045em; }
        .diagnostic-heading-en button { min-height: 42px; border: 1px solid var(--border); border-radius: 999px; padding: 0 14px; background: var(--background); color: var(--foreground); cursor: pointer; }
        .diagnostic-note-en { margin: 22px 0 0; color: var(--muted); line-height: 1.7; }
        .diagnostic-field-grid-en { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 28px; }
        .diagnostic-field-grid-en label { display: grid; gap: 7px; color: var(--muted); font-size: 12px; }
        .diagnostic-field-grid-en input { min-height: 48px; border: 1px solid var(--border); border-radius: 13px; padding: 0 13px; background: var(--background); color: var(--foreground); font: inherit; font-size: 15px; }
        .diagnostic-findings-en { display: grid; gap: 10px; }
        .finding-en { display: grid; grid-template-columns: 70px minmax(0, 1fr); gap: 16px; border: 1px solid var(--border); border-radius: 16px; padding: 18px; }
        .finding-en > span { width: fit-content; height: fit-content; border-radius: 999px; padding: 5px 8px; background: var(--background); font-size: 10px; font-weight: 700; }
        .finding-en h3 { margin: 0; font-size: 18px; }
        .finding-en p { margin: 7px 0 0; color: var(--muted); font-size: 13px; line-height: 1.65; }
        .finding-en a { display: inline-flex; margin-top: 10px; font-size: 13px; font-weight: 700; }
        .finding-critical-en { border-color: color-mix(in srgb, #b91c1c 45%, var(--border)); }
        .finding-warning-en { border-color: color-mix(in srgb, #b45309 40%, var(--border)); }
        .finding-healthy-en { border-color: color-mix(in srgb, #15803d 35%, var(--border)); }
        .diagnostic-probe-en { border-top: 1px solid var(--border); padding-top: 18px; }
        .diagnostic-probe-en summary { cursor: pointer; font-weight: 700; }
        .diagnostic-probe-en pre { overflow-x: auto; margin: 16px 0 0; border-radius: 14px; padding: 16px; background: var(--background); font-size: 12px; line-height: 1.6; }
        @media (max-width: 900px) { .room-diagnostics-en { grid-template-columns: 1fr; } .diagnostic-results-en { position: static; } }
        @media (max-width: 620px) { .diagnostic-field-grid-en { grid-template-columns: 1fr; } .diagnostic-heading-en { align-items: start; flex-direction: column; } .finding-en { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
