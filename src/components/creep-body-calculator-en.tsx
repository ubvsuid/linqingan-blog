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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parsed = createCounts();
    let hasBodyParam = false;

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

  useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.href);
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
      </aside>

      <style>{`
        .body-calculator-en { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(320px, .65fr); gap: 24px; align-items: start; }
        .body-builder-en, .body-results-en { border: 1px solid var(--border); border-radius: 24px; background: var(--surface); }
        .body-builder-en { padding: clamp(24px, 4vw, 38px); }
        .body-results-en { position: sticky; top: 24px; display: grid; gap: 24px; padding: 28px; }
        .body-builder-heading-en { display: flex; align-items: end; justify-content: space-between; gap: 24px; }
        .body-builder-en h2, .body-results-en h2 { margin: 8px 0 0; font-size: clamp(30px, 4vw, 44px); letter-spacing: -.045em; }
        .body-limit-en { display: flex; align-items: baseline; gap: 5px; color: var(--muted); white-space: nowrap; }
        .body-limit-en strong { color: var(--foreground); font-size: 34px; }
        .body-presets-en { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; }
        .body-presets-en button, .body-stepper-en button, .body-code-en button { min-height: 42px; border: 1px solid var(--border); border-radius: 999px; padding: 0 14px; background: var(--background); color: var(--foreground); cursor: pointer; }
        .body-part-grid-en { display: grid; margin-top: 28px; border-top: 1px solid var(--border); }
        .body-part-grid-en article { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 22px; align-items: center; border-bottom: 1px solid var(--border); padding: 21px 0; }
        .body-part-grid-en article > div:first-child { display: grid; gap: 5px; }
        .body-part-grid-en article strong { font-family: "SFMono-Regular", Consolas, monospace; }
        .body-part-grid-en article span, .body-part-grid-en article p { color: var(--muted); }
        .body-part-grid-en article span { font-size: 12px; }
        .body-part-grid-en article p { margin: 2px 0 0; line-height: 1.6; }
        .body-stepper-en { display: grid; grid-template-columns: 42px 36px 42px; gap: 7px; align-items: center; }
        .body-stepper-en button { width: 42px; padding: 0; font-size: 20px; }
        .body-stepper-en output { text-align: center; font-weight: 700; }
        .energy-budget-en { display: grid; gap: 8px; color: var(--muted); font-size: 13px; }
        .energy-budget-en input { min-height: 50px; border: 1px solid var(--border); border-radius: 14px; padding: 0 14px; background: var(--background); color: var(--foreground); font: inherit; font-size: 16px; }
        .body-metrics-en { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0; border-top: 1px solid var(--border); }
        .body-metrics-en div { display: grid; gap: 6px; border-bottom: 1px solid var(--border); padding: 18px 12px 18px 0; }
        .body-metrics-en div:nth-child(even) { border-left: 1px solid var(--border); padding-left: 16px; }
        .body-metrics-en dt, .movement-result-en dt { color: var(--muted); font-size: 12px; }
        .body-metrics-en dd, .movement-result-en dd { margin: 0; font-weight: 700; }
        .budget-status-en { border-radius: 14px; padding: 14px 16px; line-height: 1.6; }
        .budget-ok-en { background: color-mix(in srgb, #2f9e44 12%, var(--background)); }
        .budget-short-en { background: color-mix(in srgb, #e03131 10%, var(--background)); }
        .movement-result-en { border-top: 1px solid var(--border); padding-top: 22px; }
        .movement-result-en h3 { margin: 0; font-size: 18px; }
        .movement-result-en dl { display: grid; gap: 10px; margin: 16px 0 0; }
        .movement-result-en dl div { display: flex; justify-content: space-between; gap: 18px; }
        .movement-result-en p { margin: 16px 0 0; color: var(--muted); font-size: 12px; line-height: 1.65; }
        .body-code-en { display: grid; gap: 12px; }
        .body-code-en code { overflow-wrap: anywhere; border: 1px solid var(--border); border-radius: 14px; padding: 16px; background: var(--background); line-height: 1.65; }
        .body-code-en button { justify-self: start; }
        button:disabled { cursor: not-allowed; opacity: .42; }
        @media (max-width: 900px) { .body-calculator-en { grid-template-columns: 1fr; } .body-results-en { position: static; } }
        @media (max-width: 560px) { .body-builder-heading-en { align-items: flex-start; flex-direction: column; } .body-part-grid-en article { grid-template-columns: 1fr; } .body-stepper-en { justify-self: start; } .body-metrics-en { grid-template-columns: 1fr; } .body-metrics-en div:nth-child(even) { border-left: 0; padding-left: 0; } }
      `}</style>
    </div>
  );
}
