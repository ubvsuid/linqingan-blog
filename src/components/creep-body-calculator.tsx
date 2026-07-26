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

const presets: Array<{
  label: string;
  description: string;
  energy: number;
  counts: Partial<BodyCounts>;
}> = [
  { label: "200 基础工人", description: "采集、运输、建造的最低通用身体", energy: 200, counts: { WORK: 1, CARRY: 1, MOVE: 1 } },
  { label: "300 采集者", description: "两个 WORK，适合早期固定采集", energy: 300, counts: { WORK: 2, CARRY: 1, MOVE: 1 } },
  { label: "300 运输者", description: "4 CARRY + 2 MOVE，平地满载较均衡", energy: 300, counts: { CARRY: 4, MOVE: 2 } },
  { label: "550 建设者", description: "3 WORK + 2 CARRY + 3 MOVE", energy: 550, counts: { WORK: 3, CARRY: 2, MOVE: 3 } },
  { label: "650 升级者", description: "5 WORK，适合稳定供能的 Controller", energy: 650, counts: { WORK: 5, CARRY: 1, MOVE: 2 } },
  { label: "800 道路运输", description: "10 CARRY + 6 MOVE，满载道路运输", energy: 800, counts: { CARRY: 10, MOVE: 6 } },
  { label: "560 近战守卫", description: "4 TOUGH + 4 ATTACK + 4 MOVE", energy: 560, counts: { TOUGH: 4, ATTACK: 4, MOVE: 4 } },
  { label: "侦察者", description: "只用于获取视野，不承担战斗", energy: 50, counts: { MOVE: 1 } },
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
  return value === null ? "无法移动" : `${value} tick / 格`;
}

export function CreepBodyCalculator() {
  const [counts, setCounts] = useState<BodyCounts>(() => createCounts({ WORK: 1, CARRY: 1, MOVE: 1 }));
  const [energyBudget, setEnergyBudget] = useState(300);
  const [copyState, setCopyState] = useState("复制身体数组");
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
      return {
        ...current,
        [part]: Math.max(0, Math.min(50, current[part] + delta)),
      };
    });
  }

  function applyPreset(preset: (typeof presets)[number]) {
    setCounts(createCounts(preset.counts));
    setEnergyBudget(preset.energy);
  }

  async function copyBody() {
    try {
      await navigator.clipboard.writeText(bodyCode);
      setCopyState("已复制");
      window.setTimeout(() => setCopyState("复制身体数组"), 1600);
    } catch {
      setCopyState("复制失败，请手动选择");
    }
  }

  return (
    <div className="body-calculator">
      <section className="body-builder" aria-labelledby="body-builder-title">
        <div className="body-builder-heading">
          <div>
            <p className="eyebrow">BODY BUILDER</p>
            <h2 id="body-builder-title">选择身体部件</h2>
          </div>
          <div className="body-limit" aria-live="polite">
            <strong>{totalParts}</strong>
            <span>/ 50 个部件</span>
          </div>
        </div>

        <div className="body-presets" aria-label="常用身体预设">
          {presets.map((preset) => (
            <button key={preset.label} type="button" onClick={() => applyPreset(preset)} title={preset.description}>
              <strong>{preset.label}</strong>
              <small>{preset.description}</small>
            </button>
          ))}
          <button type="button" onClick={() => setCounts(createCounts())}>清空</button>
        </div>

        <div className="body-part-grid">
          {bodyPartOrder.map((part) => (
            <article key={part}>
              <div>
                <strong>{part}</strong>
                <span>{bodyPartData[part].label} · {bodyPartData[part].cost} Energy</span>
                <p>{bodyPartData[part].description}</p>
              </div>
              <div className="body-stepper" aria-label={`${part} 数量`}>
                <button type="button" aria-label={`减少一个 ${part}`} onClick={() => changePart(part, -1)} disabled={counts[part] === 0}>−</button>
                <output>{counts[part]}</output>
                <button type="button" aria-label={`增加一个 ${part}`} onClick={() => changePart(part, 1)} disabled={totalParts >= 50}>＋</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="body-results" aria-labelledby="body-results-title">
        <div>
          <p className="eyebrow">RESULT</p>
          <h2 id="body-results-title">计算结果</h2>
        </div>

        <label className="energy-budget">
          <span>房间可用 Energy</span>
          <input
            type="number"
            min="0"
            max="100000"
            step="50"
            value={energyBudget}
            onChange={(event) => setEnergyBudget(Math.max(0, Math.min(100000, Number(event.target.value) || 0)))}
          />
        </label>

        <dl className="body-metrics">
          <div><dt>身体成本</dt><dd>{totalCost} Energy</dd></div>
          <div><dt>生成时间</dt><dd>{spawnTime} ticks</dd></div>
          <div><dt>基础生命值</dt><dd>{totalHits} hits</dd></div>
          <div><dt>携带容量</dt><dd>{carryCapacity} 资源</dd></div>
        </dl>

        <div className={`budget-status ${affordable ? "budget-ok" : "budget-short"}`}>
          {affordable
            ? `当前预算可以生成，剩余 ${energyBudget - totalCost} Energy。`
            : `当前预算还差 ${totalCost - energyBudget} Energy。`}
        </div>

        <section className="movement-result" aria-labelledby="movement-result-title">
          <h3 id="movement-result-title">满载移动估算</h3>
          <dl>
            <div><dt>Road</dt><dd>{formatMovement(movement.road)}</dd></div>
            <div><dt>Plain</dt><dd>{formatMovement(movement.plain)}</dd></div>
            <div><dt>Swamp</dt><dd>{formatMovement(movement.swamp)}</dd></div>
          </dl>
          <p>按所有非 MOVE 部件产生 fatigue 估算。空 CARRY、Boost、受伤部件和道路状态会改变实际结果。</p>
        </section>

        <div className="body-code">
          <code>{bodyCode}</code>
          <button type="button" onClick={copyBody} disabled={totalParts === 0}>{copyState}</button>
        </div>
      </aside>

      <style>{`
        .body-calculator { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(320px, .65fr); gap: 24px; align-items: start; }
        .body-builder, .body-results { border: 1px solid var(--border); border-radius: 24px; background: var(--surface); }
        .body-builder { padding: clamp(24px, 4vw, 38px); }
        .body-results { position: sticky; top: 24px; display: grid; gap: 24px; padding: 28px; }
        .body-builder-heading { display: flex; align-items: end; justify-content: space-between; gap: 24px; }
        .body-builder h2, .body-results h2 { margin: 8px 0 0; font-size: clamp(30px, 4vw, 44px); letter-spacing: -.045em; }
        .body-limit { display: flex; align-items: baseline; gap: 5px; color: var(--muted); white-space: nowrap; }
        .body-limit strong { color: var(--foreground); font-size: 34px; }
        .body-presets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; margin-top: 28px; }
        .body-presets button { display: grid; gap: 5px; min-height: 72px; align-content: center; border: 1px solid var(--border); border-radius: 15px; padding: 11px 14px; background: var(--background); color: var(--foreground); text-align: left; cursor: pointer; }
        .body-presets button strong { font-size: 13px; }
        .body-presets button small { color: var(--muted); font-size: 11px; line-height: 1.4; }
        .body-stepper button, .body-code button { min-height: 42px; border: 1px solid var(--border); border-radius: 999px; padding: 0 14px; background: var(--background); color: var(--foreground); cursor: pointer; }
        .body-presets button:hover, .body-stepper button:hover:not(:disabled), .body-code button:hover:not(:disabled) { border-color: var(--foreground); }
        .body-part-grid { display: grid; margin-top: 28px; border-top: 1px solid var(--border); }
        .body-part-grid article { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 22px; align-items: center; border-bottom: 1px solid var(--border); padding: 21px 0; }
        .body-part-grid article > div:first-child { display: grid; gap: 5px; }
        .body-part-grid article strong { font-family: "SFMono-Regular", Consolas, monospace; }
        .body-part-grid article span { color: var(--muted); font-size: 12px; }
        .body-part-grid article p { margin: 2px 0 0; color: var(--muted); line-height: 1.6; }
        .body-stepper { display: grid; grid-template-columns: 42px 36px 42px; gap: 7px; align-items: center; }
        .body-stepper button { width: 42px; padding: 0; font-size: 20px; }
        .body-stepper button:disabled, .body-code button:disabled { cursor: not-allowed; opacity: .42; }
        .body-stepper output { text-align: center; font-weight: 700; }
        .energy-budget { display: grid; gap: 8px; color: var(--muted); font-size: 13px; }
        .energy-budget input { width: 100%; min-height: 50px; border: 1px solid var(--border); border-radius: 14px; padding: 0 14px; background: var(--background); color: var(--foreground); font: inherit; font-size: 16px; }
        .body-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0; border-top: 1px solid var(--border); }
        .body-metrics div { display: grid; gap: 6px; border-bottom: 1px solid var(--border); padding: 18px 12px 18px 0; }
        .body-metrics div:nth-child(even) { border-left: 1px solid var(--border); padding-left: 16px; }
        .body-metrics dt, .movement-result dt { color: var(--muted); font-size: 12px; }
        .body-metrics dd, .movement-result dd { margin: 0; font-weight: 700; }
        .budget-status { border-radius: 14px; padding: 14px 16px; line-height: 1.6; }
        .budget-ok { background: color-mix(in srgb, #2f9e44 12%, var(--background)); }
        .budget-short { background: color-mix(in srgb, #e03131 10%, var(--background)); }
        .movement-result { border-top: 1px solid var(--border); padding-top: 22px; }
        .movement-result h3 { margin: 0; font-size: 18px; }
        .movement-result dl { display: grid; gap: 10px; margin: 16px 0 0; }
        .movement-result dl div { display: flex; justify-content: space-between; gap: 18px; }
        .movement-result p { margin: 16px 0 0; color: var(--muted); font-size: 12px; line-height: 1.65; }
        .body-code { display: grid; gap: 12px; }
        .body-code code { overflow-wrap: anywhere; border: 1px solid var(--border); border-radius: 14px; padding: 16px; background: var(--background); line-height: 1.65; }
        .body-code button { justify-self: start; }
        @media (max-width: 900px) { .body-calculator { grid-template-columns: 1fr; } .body-results { position: static; } }
        @media (max-width: 560px) { .body-presets { grid-template-columns: 1fr; } }
        @media (max-width: 560px) { .body-builder-heading { align-items: flex-start; flex-direction: column; } .body-part-grid article { grid-template-columns: 1fr; } .body-stepper { justify-self: start; } .body-metrics { grid-template-columns: 1fr; } .body-metrics div:nth-child(even) { border-left: 0; padding-left: 0; } }
      `}</style>
    </div>
  );
}
