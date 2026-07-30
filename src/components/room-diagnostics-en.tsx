"use client";

import { useEffect, useMemo, useState } from "react";

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

function parseUrlNumber(value: string | null, fallback: string): string {
  if (value === null) return fallback;
  if (value.trim() === "") return "0";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return String(Math.min(Math.max(0, parsed), 1_000_000_000));
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
  const [resultActionState, setResultActionState] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const timer = window.setTimeout(() => {
      setSpawnCount(parseUrlNumber(params.get("spawns"), "1"));
      setHarvesterCount(parseUrlNumber(params.get("harvesters"), "2"));
      setHaulerCount(parseUrlNumber(params.get("haulers"), "1"));
      setEnergyAvailable(parseUrlNumber(params.get("energy"), "300"));
      setEnergyCapacity(parseUrlNumber(params.get("capacity"), "550"));
      setStorageEnergy(parseUrlNumber(params.get("storage"), "20000"));
      setControllerTicks(parseUrlNumber(params.get("downgrade"), "10000"));
      setConstructionSites(parseUrlNumber(params.get("sites"), "0"));
      setCpuUsed(parseUrlNumber(params.get("cpu"), "8"));
      setCpuLimit(parseUrlNumber(params.get("limit"), "20"));
      setBucket(parseUrlNumber(params.get("bucket"), "10000"));
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

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

  useEffect(() => {
    if (!ready) return;

    const url = new URL(window.location.pathname, window.location.origin);
    const values = {
      spawns: spawnCount,
      harvesters: harvesterCount,
      haulers: haulerCount,
      energy: energyAvailable,
      capacity: energyCapacity,
      storage: storageEnergy,
      downgrade: controllerTicks,
      sites: constructionSites,
      cpu: cpuUsed,
      limit: cpuLimit,
      bucket,
    };

    for (const [key, value] of Object.entries(values)) {
      url.searchParams.set(key, String(parseNumber(value)));
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [
    bucket,
    constructionSites,
    controllerTicks,
    cpuLimit,
    cpuUsed,
    energyAvailable,
    energyCapacity,
    harvesterCount,
    haulerCount,
    ready,
    spawnCount,
    storageEnergy,
  ]);

  const resultSummary = [
    "Static Screeps Room Snapshot Diagnostic",
    "Input source: user-entered values; this tool is not connected to a Screeps account.",
    `Snapshot: spawns ${parseNumber(spawnCount)}, harvesters ${parseNumber(harvesterCount)}, haulers ${parseNumber(haulerCount)}, Energy ${parseNumber(energyAvailable)}/${parseNumber(energyCapacity)}, storage Energy ${parseNumber(storageEnergy)}, Controller downgrade ${parseNumber(controllerTicks)}, construction sites ${parseNumber(constructionSites)}, CPU ${parseNumber(cpuUsed)}/${parseNumber(cpuLimit)}, bucket ${parseNumber(bucket)}.`,
    "",
    ...findings.map(
      (finding) =>
        `[${finding.severity}] ${finding.title}: ${finding.detail}`,
    ),
    "",
    "Boundary: These are static maintenance checks, not live-room or multi-tick evidence.",
  ].join("\n");

  async function copyProbe() {
    try {
      await navigator.clipboard.writeText(probeCode);
      setCopyState("Copied");
      window.setTimeout(() => setCopyState("Copy Console probe"), 1600);
    } catch {
      setCopyState("Copy failed — select manually");
    }
  }

  async function copyResults() {
    try {
      await navigator.clipboard.writeText(resultSummary);
      setResultActionState("Diagnostic summary copied.");
    } catch {
      setResultActionState("Copy failed. Select the visible findings manually.");
    }
  }

  async function shareSnapshot() {
    const shareUrl = new URL(window.location.pathname, window.location.origin);
    const values = {
      spawns: spawnCount,
      harvesters: harvesterCount,
      haulers: haulerCount,
      energy: energyAvailable,
      capacity: energyCapacity,
      storage: storageEnergy,
      downgrade: controllerTicks,
      sites: constructionSites,
      cpu: cpuUsed,
      limit: cpuLimit,
      bucket,
    };
    for (const [key, value] of Object.entries(values)) {
      shareUrl.searchParams.set(key, String(parseNumber(value)));
    }
    const url = shareUrl.toString();

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Screeps Room Snapshot Diagnostic",
          text: resultSummary,
          url,
        });
        setResultActionState("Share sheet opened.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setResultActionState("Sharing cancelled.");
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setResultActionState("Shareable snapshot link copied.");
    } catch {
      setResultActionState("Could not copy the link. Copy it from the address bar.");
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
        <div className="tool-result-actions-en" aria-label="Copy or share these findings">
          <button type="button" onClick={copyResults}>Copy diagnostic summary</button>
          <button type="button" onClick={shareSnapshot}>Share snapshot link</button>
        </div>
        <p className="tool-action-status-en" role="status" aria-live="polite">{resultActionState}</p>
        <details className="diagnostic-probe-en"><summary>View the read-only Console probe</summary><pre><code>{probeCode}</code></pre></details>
      </section>
    </div>
  );
}
