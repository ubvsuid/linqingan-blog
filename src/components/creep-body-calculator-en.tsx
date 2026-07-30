"use client";

import { useEffect, useMemo, useState } from "react";

import bodyPartData from "@/lib/screeps-body-parts.json";

type BodyPart = keyof typeof bodyPartData;
type BodyCounts = Record<BodyPart, number>;

const bodyPartOrder: BodyPart[] = [
  "TOUGH",
  "WORK",
  "CARRY",
  "ATTACK",
  "RANGED_ATTACK",
  "HEAL",
  "CLAIM",
  "MOVE",
];

const emptyCounts: BodyCounts = {
  MOVE: 0,
  WORK: 0,
  CARRY: 0,
  ATTACK: 0,
  RANGED_ATTACK: 0,
  HEAL: 0,
  CLAIM: 0,
  TOUGH: 0,
};

const partText: Record<BodyPart, { label: string; description: string }> = {
  TOUGH: { label: "Damage buffer", description: "Adds low-cost hit points and is commonly placed first in the body." },
  WORK: { label: "Work action", description: "Harvests, builds, repairs, upgrades Controllers, and dismantles structures." },
  CARRY: { label: "Resource capacity", description: "Adds store capacity for Energy and other resources." },
  ATTACK: { label: "Melee attack", description: "Deals close-range damage to hostile Creeps and structures." },
  RANGED_ATTACK: { label: "Ranged attack", description: "Deals ranged damage and supports ranged mass attacks." },
  HEAL: { label: "Healing", description: "Restores hits to friendly Creeps at close or ranged distance." },
  CLAIM: { label: "Controller control", description: "Claims, reserves, attacks, or signs room Controllers." },
  MOVE: { label: "Movement", description: "Reduces fatigue and determines movement speed across terrain." },
};

const presets: Array<{ label: string; counts: Partial<BodyCounts> }> = [
  { label: "Basic worker", counts: { WORK: 1, CARRY: 1, MOVE: 1 } },
  { label: "Hauler", counts: { CARRY: 4, MOVE: 2 } },
  { label: "Upgrader", counts: { WORK: 5, CARRY: 1, MOVE: 3 } },
  { label: "Scout", counts: { MOVE: 1 } },
  { label: "Melee unit", counts: { TOUGH: 2, ATTACK: 2, MOVE: 2 } },
];

function createCounts(partial: Partial<BodyCounts> = {}): BodyCounts {
  return { ...emptyCounts, ...partial };
}

function movementTicks(nonMoveParts: number, moveParts: number, terrainCost: number) {
  if (nonMoveParts === 0) return 1;
  if (moveParts === 0) return null;
  return Math.max(1, Math.ceil((nonMoveParts * terrainCost) / (moveParts * 2)));
}

function formatMovement(value: number | null): string {
  return value === null ? "Cannot move" : `${value} tick${value === 1 ? "" : "s"} / tile`;
}

export function EnglishCreepBodyCalculator() {
  const [counts, setCounts] = useState<BodyCounts>(() => createCounts({ WORK: 1, CARRY: 1, MOVE: 1 }));
  const [energyBudget, setEnergyBudget] = useState(300);
  const [copyState, setCopyState] = useState("Copy body array");
  const [resultActionState, setResultActionState] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parsed = createCounts();
    let hasBodyParam = params.get("body") === "configured";

    for (const part of bodyPartOrder) {
      const value = params.get(part.toLowerCase());
      if (value === null) continue;
      const amount = Number.parseInt(value, 10);
      if (Number.isFinite(amount) && amount >= 0) {
        parsed[part] = Math.min(50, amount);
        hasBodyParam = true;
      }
    }

    const parsedBudget = Number.parseInt(params.get("energy") ?? "", 10);
    const nextBudget = Number.isFinite(parsedBudget) && parsedBudget >= 0
      ? Math.min(100000, parsedBudget)
      : 300;
    const parsedTotal = Object.values(parsed).reduce((sum, value) => sum + value, 0);
    const nextCounts = hasBodyParam && parsedTotal <= 50
      ? parsed
      : createCounts({ WORK: 1, CARRY: 1, MOVE: 1 });

    const timer = window.setTimeout(() => {
      setEnergyBudget(nextBudget);
      setCounts(nextCounts);
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const body = useMemo(
    () => bodyPartOrder.flatMap((part) => Array.from({ length: counts[part] }, () => part)),
    [counts],
  );
  const totalParts = body.length;
  const totalCost = body.reduce((sum, part) => sum + bodyPartData[part].cost, 0);
  const spawnTime = totalParts * 3;
  const totalHits = totalParts * 100;
  const carryCapacity = counts.CARRY * 50;
  const nonMoveParts = totalParts - counts.MOVE;
  const bodyCode = `[${body.join(", ")}]`;
  const affordable = totalCost <= energyBudget;
  const movement = {
    road: movementTicks(nonMoveParts, counts.MOVE, 1),
    plain: movementTicks(nonMoveParts, counts.MOVE, 2),
    swamp: movementTicks(nonMoveParts, counts.MOVE, 10),
  };
  const resultSummary = [
    "Screeps Creep Body Calculator",
    `Body: ${bodyCode}`,
    `Cost: ${totalCost} Energy`,
    `Energy budget: ${energyBudget}`,
    `Spawn time: ${spawnTime} ticks`,
    `Base hits: ${totalHits}`,
    `Carry capacity: ${carryCapacity} resources`,
    `Loaded movement: road ${formatMovement(movement.road)}, plain ${formatMovement(movement.plain)}, swamp ${formatMovement(movement.swamp)}`,
    "Boundary: This is a deterministic calculator result, not a live-room observation.",
  ].join("\n");

  useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.pathname, window.location.origin);
    url.searchParams.set("body", "configured");
    for (const part of bodyPartOrder) {
      const key = part.toLowerCase();
      if (counts[part] > 0) url.searchParams.set(key, String(counts[part]));
      else url.searchParams.delete(key);
    }
    url.searchParams.set("energy", String(energyBudget));
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [counts, energyBudget, ready]);

  function changePart(part: BodyPart, delta: number) {
    setCounts((current) => {
      const currentTotal = Object.values(current).reduce((sum, value) => sum + value, 0);
      if (delta > 0 && currentTotal >= 50) return current;
      return { ...current, [part]: Math.max(0, Math.min(50, current[part] + delta)) };
    });
  }

  async function copyBody() {
    try {
      await navigator.clipboard.writeText(bodyCode);
      setCopyState("Copied");
      window.setTimeout(() => setCopyState("Copy body array"), 1600);
    } catch {
      setCopyState("Copy failed — select manually");
    }
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(resultSummary);
      setResultActionState("Result summary copied.");
    } catch {
      setResultActionState("Copy failed. Select the visible result manually.");
    }
  }

  async function shareConfiguration() {
    const shareUrl = new URL(window.location.pathname, window.location.origin);
    shareUrl.searchParams.set("body", "configured");
    for (const part of bodyPartOrder) {
      if (counts[part] > 0) {
        shareUrl.searchParams.set(part.toLowerCase(), String(counts[part]));
      }
    }
    shareUrl.searchParams.set("energy", String(energyBudget));
    const url = shareUrl.toString();

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Screeps Creep Body Calculator",
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
      setResultActionState("Shareable configuration link copied.");
    } catch {
      setResultActionState("Could not copy the link. Copy it from the address bar.");
    }
  }

  return (
    <div className="body-calculator-en">
      <section className="body-builder-en" aria-labelledby="body-builder-en-title">
        <div className="body-builder-heading-en">
          <div><p className="eyebrow">BODY BUILDER</p><h2 id="body-builder-en-title">Choose body parts</h2></div>
          <div className="body-limit-en" aria-live="polite"><strong>{totalParts}</strong><span>/ 50 parts</span></div>
        </div>

        <div className="body-presets-en" aria-label="Common body presets">
          {presets.map((preset) => (
            <button key={preset.label} type="button" onClick={() => setCounts(createCounts(preset.counts))}>{preset.label}</button>
          ))}
          <button type="button" onClick={() => setCounts(createCounts())}>Clear</button>
        </div>

        <div className="body-part-grid-en">
          {bodyPartOrder.map((part) => (
            <article key={part}>
              <div>
                <strong>{part}</strong>
                <span>{partText[part].label} · {bodyPartData[part].cost} Energy</span>
                <p>{partText[part].description}</p>
              </div>
              <div className="body-stepper-en" aria-label={`${part} count`}>
                <button type="button" aria-label={`Remove one ${part}`} onClick={() => changePart(part, -1)} disabled={counts[part] === 0}>−</button>
                <output>{counts[part]}</output>
                <button type="button" aria-label={`Add one ${part}`} onClick={() => changePart(part, 1)} disabled={totalParts >= 50}>＋</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="body-results-en" aria-labelledby="body-results-en-title">
        <div><p className="eyebrow">RESULT</p><h2 id="body-results-en-title">Calculated body</h2></div>
        <label className="energy-budget-en">
          <span>Room Energy budget</span>
          <input type="number" min="0" max="100000" step="50" value={energyBudget} onChange={(event) => setEnergyBudget(Math.max(0, Math.min(100000, Number(event.target.value) || 0)))} />
        </label>
        <dl className="body-metrics-en">
          <div><dt>Body cost</dt><dd>{totalCost} Energy</dd></div>
          <div><dt>Spawn time</dt><dd>{spawnTime} ticks</dd></div>
          <div><dt>Base hits</dt><dd>{totalHits}</dd></div>
          <div><dt>Carry capacity</dt><dd>{carryCapacity} resources</dd></div>
        </dl>
        <div className={`budget-status-en ${affordable ? "budget-ok-en" : "budget-short-en"}`}>
          {affordable ? `Affordable with ${energyBudget - totalCost} Energy remaining.` : `${totalCost - energyBudget} more Energy required.`}
        </div>
        <section className="movement-result-en" aria-labelledby="movement-result-en-title">
          <h3 id="movement-result-en-title">Loaded movement estimate</h3>
          <dl>
            <div><dt>Road</dt><dd>{formatMovement(movement.road)}</dd></div>
            <div><dt>Plain</dt><dd>{formatMovement(movement.plain)}</dd></div>
            <div><dt>Swamp</dt><dd>{formatMovement(movement.swamp)}</dd></div>
          </dl>
          <p>Assumes every non-MOVE part creates fatigue. Empty CARRY parts, boosts, damage, pulling, and actual path conditions can change the result.</p>
        </section>
        <div className="body-code-en"><code>{bodyCode}</code><button type="button" onClick={copyBody} disabled={totalParts === 0}>{copyState}</button></div>
        <div className="tool-result-actions-en" aria-label="Copy or share this calculation">
          <button type="button" onClick={copyResult} disabled={totalParts === 0}>Copy result summary</button>
          <button type="button" onClick={shareConfiguration}>Share configuration link</button>
        </div>
        <p className="tool-action-status-en" role="status" aria-live="polite">{resultActionState}</p>
      </aside>
    </div>
  );
}
