"use client";

import { useEffect, useMemo, useState } from "react";

type Locale = "en" | "zh";
type Mode = "terminal" | "deal" | "order";
type DealSide = "buy" | "sell";

interface Props {
  locale: Locale;
}

interface MarketToolState {
  mode: Mode;
  fromRoom: string;
  toRoom: string;
  amount: number;
  terminalEnergy: number;
  sendingEnergy: boolean;
  dealSide: DealSide;
  price: number;
  energyPrice: number;
  orderAmount: number;
  orderPrice: number;
}

const defaultState: MarketToolState = {
  mode: "terminal",
  fromRoom: "W8N3",
  toRoom: "E2S7",
  amount: 10000,
  terminalEnergy: 50000,
  sendingEnergy: false,
  dealSide: "buy",
  price: 0.25,
  energyPrice: 0.02,
  orderAmount: 100000,
  orderPrice: 0.25,
};

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function parseNumber(params: URLSearchParams, key: string, fallback: number, min: number, max: number) {
  const raw = params.get(key);
  if (raw === null) return fallback;
  return clampNumber(Number(raw), min, max);
}

function parseState(params: URLSearchParams): MarketToolState {
  const mode = params.get("mode");
  const side = params.get("side");
  return {
    mode: mode === "deal" || mode === "order" ? mode : "terminal",
    fromRoom: (params.get("from") || defaultState.fromRoom).toUpperCase(),
    toRoom: (params.get("to") || defaultState.toRoom).toUpperCase(),
    amount: parseNumber(params, "amount", defaultState.amount, 0, 1000000),
    terminalEnergy: parseNumber(params, "terminalEnergy", defaultState.terminalEnergy, 0, 10000000),
    sendingEnergy: params.get("resource") === "energy",
    dealSide: side === "sell" ? "sell" : "buy",
    price: parseNumber(params, "price", defaultState.price, 0, 1000000),
    energyPrice: parseNumber(params, "energyPrice", defaultState.energyPrice, 0, 1000000),
    orderAmount: parseNumber(params, "orderAmount", defaultState.orderAmount, 0, 1000000000),
    orderPrice: parseNumber(params, "orderPrice", defaultState.orderPrice, 0, 1000000),
  };
}

function roomCoordinate(roomName: string): { x: number; y: number } | null {
  const match = /^([WE])(\d+)([NS])(\d+)$/i.exec(roomName.trim());
  if (!match) return null;
  const rawX = Number.parseInt(match[2], 10);
  const rawY = Number.parseInt(match[4], 10);
  return {
    x: match[1].toUpperCase() === "E" ? rawX : -rawX - 1,
    y: match[3].toUpperCase() === "S" ? rawY : -rawY - 1,
  };
}

function roomLinearDistance(fromRoom: string, toRoom: string): number | null {
  const from = roomCoordinate(fromRoom);
  const to = roomCoordinate(toRoom);
  if (!from || !to) return null;
  return Math.max(Math.abs(from.x - to.x), Math.abs(from.y - to.y));
}

function transactionCost(amount: number, distance: number) {
  return Math.ceil(amount * (1 - Math.exp(-distance / 30)));
}

function maxEnergyPayload(availableEnergy: number, distance: number) {
  let low = 0;
  let high = Math.max(0, Math.floor(availableEnergy));
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (middle + transactionCost(middle, distance) <= availableEnergy) low = middle;
    else high = middle - 1;
  }
  return low;
}

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

const copy = {
  en: {
    tabs: { terminal: "Terminal send", deal: "Market deal", order: "Create order fee" },
    inputs: "Inputs", result: "Calculated result", from: "Sending / executing room", to: "Destination / order room",
    amount: "Resource amount", energy: "Terminal Energy available", sendingEnergy: "The resource being sent is Energy",
    side: "Deal direction", buy: "Buy from a sell order", sell: "Sell to a buy order", price: "Order price per unit",
    energyPrice: "Energy value in Credits per unit", orderAmount: "Total order amount", orderPrice: "Order price per unit",
    distance: "Linear room distance", transaction: "Transaction Energy", totalRequired: "Total terminal Energy required",
    maxSend: "Maximum Energy payload with this balance", gross: "Gross Credits", effective: "Effective unit price after Energy",
    fee: "5% order creation fee", enough: "The entered Terminal Energy covers this operation.",
    short: "The Terminal needs more Energy before this operation can execute.", invalid: "Enter valid room names such as W8N3 and E2S7.",
    copyResult: "Copy result summary", copyCode: "Copy safe code example", copied: "Copied.", failed: "Copy failed. Select the visible text manually.",
    boundary: "This tool reproduces the documented room-distance transaction formula. Confirm current room visibility, Terminal cooldown, stores, order identity, amount, and return codes in Screeps before acting.",
  },
  zh: {
    tabs: { terminal: "Terminal 发送", deal: "Market 成交", order: "创建订单手续费" },
    inputs: "输入参数", result: "计算结果", from: "发送方 / 执行成交的房间", to: "目标房间 / 订单房间",
    amount: "资源数量", energy: "Terminal 当前 Energy", sendingEnergy: "发送的资源本身就是 Energy",
    side: "成交方向", buy: "从卖单买入资源", sell: "向买单卖出资源", price: "订单单价",
    energyPrice: "Energy 折算单价（Credits）", orderAmount: "订单总数量", orderPrice: "订单单价",
    distance: "房间线性距离", transaction: "交易消耗 Energy", totalRequired: "Terminal 总 Energy 需求",
    maxSend: "当前 Energy 最多可发送", gross: "Credits 总额", effective: "计入 Energy 后的实际单价",
    fee: "创建订单 5% 手续费", enough: "当前 Terminal Energy 可以覆盖这次操作。",
    short: "当前 Terminal Energy 不足，需要先补充 Energy。", invalid: "请输入有效房间名，例如 W8N3 或 E2S7。",
    copyResult: "复制结果摘要", copyCode: "复制安全代码示例", copied: "已复制。", failed: "复制失败，请手动选择可见文本。",
    boundary: "本工具复现官方房间距离交易公式。执行前仍需在 Screeps 中核对房间、Terminal cooldown、库存、订单身份、数量和返回码。",
  },
} as const;

export function MarketTerminalCalculator({ locale }: Props) {
  const t = copy[locale];
  const [config, setConfig] = useState<MarketToolState>(defaultState);
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
      mode: config.mode,
      from: config.fromRoom,
      to: config.toRoom,
      amount: String(config.amount),
      terminalEnergy: String(config.terminalEnergy),
      side: config.dealSide,
      price: String(config.price),
      energyPrice: String(config.energyPrice),
      orderAmount: String(config.orderAmount),
      orderPrice: String(config.orderPrice),
    });
    if (config.sendingEnergy) params.set("resource", "energy");
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [config, urlReady]);

  function update(patch: Partial<MarketToolState>) {
    setConfig((current) => ({ ...current, ...patch }));
  }

  const distance = useMemo(() => roomLinearDistance(config.fromRoom, config.toRoom), [config.fromRoom, config.toRoom]);
  const cost = distance === null ? 0 : transactionCost(config.amount, distance);
  const requiredEnergy = config.sendingEnergy ? config.amount + cost : cost;
  const maximumEnergySend = distance === null ? 0 : maxEnergyPayload(config.terminalEnergy, distance);
  const grossCredits = config.amount * config.price;
  const energyCredits = cost * config.energyPrice;
  const effectivePrice = config.amount > 0
    ? (config.dealSide === "buy" ? grossCredits + energyCredits : grossCredits - energyCredits) / config.amount
    : 0;
  const orderFee = config.orderAmount * config.orderPrice * 0.05;

  const code = config.mode === "terminal"
    ? `const result = Game.rooms['${config.fromRoom}']?.terminal?.send(${config.sendingEnergy ? "RESOURCE_ENERGY" : "RESOURCE_UTRIUM"}, ${Math.floor(config.amount)}, '${config.toRoom}', 'planned transfer');\nconsole.log({ result, expectedCost: Game.market.calcTransactionCost(${Math.floor(config.amount)}, '${config.fromRoom}', '${config.toRoom}') });`
    : config.mode === "deal"
      ? `const order = Game.market.getOrderById('ORDER_ID');\nif (order && order.roomName === '${config.toRoom}' && order.price === ${config.price}) {\n  const cost = Game.market.calcTransactionCost(${Math.floor(config.amount)}, '${config.fromRoom}', order.roomName);\n  console.log({ orderId: order.id, type: order.type, amount: ${Math.floor(config.amount)}, cost });\n  // Run Game.market.deal only after reviewing this output.\n}`
      : `const fee = ${config.orderAmount} * ${config.orderPrice} * 0.05;\nconsole.log({ amount: ${Math.floor(config.orderAmount)}, price: ${config.orderPrice}, estimatedFee: fee });\n// Create the order only after checking Credits, roomName, resourceType, type, price, and totalAmount.`;

  const summary = config.mode === "terminal"
    ? `${t.tabs.terminal}\n${config.fromRoom} → ${config.toRoom}\n${t.distance}: ${distance ?? "invalid"}\n${t.transaction}: ${cost}\n${t.totalRequired}: ${requiredEnergy}\n${t.maxSend}: ${maximumEnergySend}\n${t.boundary}`
    : config.mode === "deal"
      ? `${t.tabs.deal}\n${config.dealSide === "buy" ? t.buy : t.sell}\n${config.fromRoom} ↔ ${config.toRoom}\n${t.transaction}: ${cost}\n${t.gross}: ${formatNumber(grossCredits)}\n${t.effective}: ${formatNumber(effectivePrice, 4)}\n${t.boundary}`
      : `${t.tabs.order}\n${t.orderAmount}: ${formatNumber(config.orderAmount)}\n${t.orderPrice}: ${formatNumber(config.orderPrice, 4)}\n${t.fee}: ${formatNumber(orderFee)} Credits\n${t.boundary}`;

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(t.copied);
    } catch {
      setStatus(t.failed);
    }
  }

  return (
    <div className="planning-tool" data-tool="market-terminal">
      <div className="planning-tabs" role="tablist" aria-label={locale === "en" ? "Calculation mode" : "计算模式"}>
        {(Object.keys(t.tabs) as Mode[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={config.mode === tab} onClick={() => update({ mode: tab })}>{t.tabs[tab]}</button>)}
      </div>
      <div className="planning-grid">
        <section className="planning-panel" aria-labelledby="market-input-title">
          <p className="eyebrow">INPUTS</p><h2 id="market-input-title">{t.inputs}</h2>
          {config.mode !== "order" ? (
            <div className="planning-fields">
              <label><span>{t.from}</span><input value={config.fromRoom} maxLength={8} onChange={(event) => update({ fromRoom: event.target.value.toUpperCase() })} /></label>
              <label><span>{t.to}</span><input value={config.toRoom} maxLength={8} onChange={(event) => update({ toRoom: event.target.value.toUpperCase() })} /></label>
              <label><span>{t.amount}</span><input type="number" min="0" max="1000000" value={config.amount} onChange={(event) => update({ amount: clampNumber(Number(event.target.value), 0, 1000000) })} /></label>
              <label><span>{t.energy}</span><input type="number" min="0" max="10000000" value={config.terminalEnergy} onChange={(event) => update({ terminalEnergy: clampNumber(Number(event.target.value), 0, 10000000) })} /></label>
              {config.mode === "terminal" ? (
                <label className="planning-check"><input type="checkbox" checked={config.sendingEnergy} onChange={(event) => update({ sendingEnergy: event.target.checked })} /><span>{t.sendingEnergy}</span></label>
              ) : (
                <>
                  <label><span>{t.side}</span><select value={config.dealSide} onChange={(event) => update({ dealSide: event.target.value as DealSide })}><option value="buy">{t.buy}</option><option value="sell">{t.sell}</option></select></label>
                  <label><span>{t.price}</span><input type="number" min="0" step="0.001" value={config.price} onChange={(event) => update({ price: clampNumber(Number(event.target.value), 0, 1000000) })} /></label>
                  <label><span>{t.energyPrice}</span><input type="number" min="0" step="0.001" value={config.energyPrice} onChange={(event) => update({ energyPrice: clampNumber(Number(event.target.value), 0, 1000000) })} /></label>
                </>
              )}
            </div>
          ) : (
            <div className="planning-fields">
              <label><span>{t.orderAmount}</span><input type="number" min="0" max="1000000000" value={config.orderAmount} onChange={(event) => update({ orderAmount: clampNumber(Number(event.target.value), 0, 1000000000) })} /></label>
              <label><span>{t.orderPrice}</span><input type="number" min="0" step="0.001" value={config.orderPrice} onChange={(event) => update({ orderPrice: clampNumber(Number(event.target.value), 0, 1000000) })} /></label>
            </div>
          )}
        </section>
        <aside className="planning-panel planning-results" aria-labelledby="market-result-title">
          <p className="eyebrow">RESULT</p><h2 id="market-result-title">{t.result}</h2>
          {config.mode === "terminal" && <>{distance === null ? <p className="planning-alert planning-alert-warning">{t.invalid}</p> : <dl className="planning-metrics"><div><dt>{t.distance}</dt><dd>{distance}</dd></div><div><dt>{t.transaction}</dt><dd>{formatNumber(cost)} Energy</dd></div><div><dt>{t.totalRequired}</dt><dd>{formatNumber(requiredEnergy)} Energy</dd></div><div><dt>{t.maxSend}</dt><dd>{formatNumber(maximumEnergySend)} Energy</dd></div></dl>}{distance !== null && <p className={`planning-alert ${config.terminalEnergy >= requiredEnergy ? "planning-alert-ok" : "planning-alert-warning"}`}>{config.terminalEnergy >= requiredEnergy ? t.enough : t.short}</p>}</>}
          {config.mode === "deal" && (distance === null ? <p className="planning-alert planning-alert-warning">{t.invalid}</p> : <dl className="planning-metrics"><div><dt>{t.distance}</dt><dd>{distance}</dd></div><div><dt>{t.transaction}</dt><dd>{formatNumber(cost)} Energy</dd></div><div><dt>{t.gross}</dt><dd>{formatNumber(grossCredits)} Credits</dd></div><div><dt>{t.effective}</dt><dd>{formatNumber(effectivePrice, 4)} Credits</dd></div></dl>)}
          {config.mode === "order" && <dl className="planning-metrics"><div><dt>{t.orderAmount}</dt><dd>{formatNumber(config.orderAmount)}</dd></div><div><dt>{t.orderPrice}</dt><dd>{formatNumber(config.orderPrice, 4)} Credits</dd></div><div className="planning-metric-wide"><dt>{t.fee}</dt><dd>{formatNumber(orderFee)} Credits</dd></div></dl>}
          <p className="planning-boundary">{t.boundary}</p>
          <details className="planning-code"><summary>{locale === "en" ? "Safe code example" : "安全代码示例"}</summary><pre>{code}</pre></details>
          <div className="planning-actions"><button type="button" onClick={() => copyText(summary)}>{t.copyResult}</button><button type="button" onClick={() => copyText(code)}>{t.copyCode}</button></div>
          <p className="planning-status" role="status" aria-live="polite">{status}</p>
        </aside>
      </div>
    </div>
  );
}
