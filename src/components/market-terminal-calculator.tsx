"use client";

import { useEffect, useMemo, useState } from "react";

type Locale = "en" | "zh";
type Mode = "terminal" | "deal" | "order";
type DealSide = "buy" | "sell";

interface Props {
  locale: Locale;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function roomCoordinate(roomName: string): { x: number; y: number } | null {
  const match = /^([WE])(\d+)([NS])(\d+)$/i.exec(roomName.trim());
  if (!match) return null;
  const horizontal = match[1].toUpperCase();
  const vertical = match[3].toUpperCase();
  const rawX = Number.parseInt(match[2], 10);
  const rawY = Number.parseInt(match[4], 10);
  return {
    x: horizontal === "E" ? rawX : -rawX - 1,
    y: vertical === "S" ? rawY : -rawY - 1,
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
    const total = middle + transactionCost(middle, distance);
    if (total <= availableEnergy) low = middle;
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
    inputs: "Inputs",
    result: "Calculated result",
    from: "Sending / executing room",
    to: "Destination / order room",
    amount: "Resource amount",
    energy: "Terminal Energy available",
    sendingEnergy: "The resource being sent is Energy",
    side: "Deal direction",
    buy: "Buy from a sell order",
    sell: "Sell to a buy order",
    price: "Order price per unit",
    energyPrice: "Energy value in Credits per unit",
    orderAmount: "Total order amount",
    orderPrice: "Order price per unit",
    distance: "Linear room distance",
    transaction: "Transaction Energy",
    totalRequired: "Total terminal Energy required",
    maxSend: "Maximum Energy payload with this balance",
    gross: "Gross Credits",
    effective: "Effective unit price after Energy",
    fee: "5% order creation fee",
    statusEnough: "The entered Terminal Energy covers this operation.",
    statusShort: "The Terminal needs more Energy before this operation can execute.",
    invalidRoom: "Enter valid room names such as W8N3 and E2S7.",
    copyResult: "Copy result summary",
    copyCode: "Copy safe code example",
    copied: "Copied.",
    failed: "Copy failed. Select the visible text manually.",
    boundary: "This tool reproduces the documented room-distance transaction formula. Confirm current room visibility, Terminal cooldown, stores, order identity, amount, and return codes in Screeps before acting.",
  },
  zh: {
    tabs: { terminal: "Terminal 发送", deal: "Market 成交", order: "创建订单手续费" },
    inputs: "输入参数",
    result: "计算结果",
    from: "发送方 / 执行成交的房间",
    to: "目标房间 / 订单房间",
    amount: "资源数量",
    energy: "Terminal 当前 Energy",
    sendingEnergy: "发送的资源本身就是 Energy",
    side: "成交方向",
    buy: "从卖单买入资源",
    sell: "向买单卖出资源",
    price: "订单单价",
    energyPrice: "Energy 折算单价（Credits）",
    orderAmount: "订单总数量",
    orderPrice: "订单单价",
    distance: "房间线性距离",
    transaction: "交易消耗 Energy",
    totalRequired: "Terminal 总 Energy 需求",
    maxSend: "当前 Energy 最多可发送",
    gross: "Credits 总额",
    effective: "计入 Energy 后的实际单价",
    fee: "创建订单 5% 手续费",
    statusEnough: "当前 Terminal Energy 可以覆盖这次操作。",
    statusShort: "当前 Terminal Energy 不足，需要先补充 Energy。",
    invalidRoom: "请输入有效房间名，例如 W8N3 或 E2S7。",
    copyResult: "复制结果摘要",
    copyCode: "复制安全代码示例",
    copied: "已复制。",
    failed: "复制失败，请手动选择可见文本。",
    boundary: "本工具复现官方房间距离交易公式。执行前仍需在 Screeps 中核对房间、Terminal cooldown、库存、订单身份、数量和返回码。",
  },
} as const;

export function MarketTerminalCalculator({ locale }: Props) {
  const t = copy[locale];
  const [mode, setMode] = useState<Mode>("terminal");
  const [fromRoom, setFromRoom] = useState("W8N3");
  const [toRoom, setToRoom] = useState("E2S7");
  const [amount, setAmount] = useState(10000);
  const [terminalEnergy, setTerminalEnergy] = useState(50000);
  const [sendingEnergy, setSendingEnergy] = useState(false);
  const [dealSide, setDealSide] = useState<DealSide>("buy");
  const [price, setPrice] = useState(0.25);
  const [energyPrice, setEnergyPrice] = useState(0.02);
  const [orderAmount, setOrderAmount] = useState(100000);
  const [orderPrice, setOrderPrice] = useState(0.25);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextMode = params.get("mode");
    if (nextMode === "terminal" || nextMode === "deal" || nextMode === "order") setMode(nextMode);
    const nextSide = params.get("side");
    if (nextSide === "buy" || nextSide === "sell") setDealSide(nextSide);
    if (params.get("from")) setFromRoom(params.get("from") ?? "W8N3");
    if (params.get("to")) setToRoom(params.get("to") ?? "E2S7");
    if (params.get("resource") === "energy") setSendingEnergy(true);
    const numeric: Array<[string, (value: number) => void, number, number]> = [
      ["amount", setAmount, 0, 1000000],
      ["terminalEnergy", setTerminalEnergy, 0, 10000000],
      ["price", setPrice, 0, 1000000],
      ["energyPrice", setEnergyPrice, 0, 1000000],
      ["orderAmount", setOrderAmount, 0, 1000000000],
      ["orderPrice", setOrderPrice, 0, 1000000],
    ];
    for (const [key, setter, min, max] of numeric) {
      const parsed = Number(params.get(key));
      if (Number.isFinite(parsed)) setter(clampNumber(parsed, min, max));
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams();
    params.set("mode", mode);
    params.set("from", fromRoom);
    params.set("to", toRoom);
    params.set("amount", String(amount));
    params.set("terminalEnergy", String(terminalEnergy));
    if (sendingEnergy) params.set("resource", "energy");
    params.set("side", dealSide);
    params.set("price", String(price));
    params.set("energyPrice", String(energyPrice));
    params.set("orderAmount", String(orderAmount));
    params.set("orderPrice", String(orderPrice));
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [amount, dealSide, energyPrice, fromRoom, mode, orderAmount, orderPrice, price, ready, sendingEnergy, terminalEnergy, toRoom]);

  const distance = useMemo(() => roomLinearDistance(fromRoom, toRoom), [fromRoom, toRoom]);
  const cost = distance === null ? 0 : transactionCost(amount, distance);
  const requiredEnergy = sendingEnergy ? amount + cost : cost;
  const enoughEnergy = terminalEnergy >= requiredEnergy;
  const maximumEnergySend = distance === null ? 0 : maxEnergyPayload(terminalEnergy, distance);
  const grossCredits = amount * price;
  const energyCredits = cost * energyPrice;
  const effectivePrice = amount > 0
    ? dealSide === "buy"
      ? (grossCredits + energyCredits) / amount
      : (grossCredits - energyCredits) / amount
    : 0;
  const orderFee = orderAmount * orderPrice * 0.05;

  const code = mode === "terminal"
    ? `const result = Game.rooms['${fromRoom}']?.terminal?.send(${sendingEnergy ? "RESOURCE_ENERGY" : "RESOURCE_UTRIUM"}, ${Math.floor(amount)}, '${toRoom}', 'planned transfer');\nconsole.log({ result, expectedCost: Game.market.calcTransactionCost(${Math.floor(amount)}, '${fromRoom}', '${toRoom}') });`
    : mode === "deal"
      ? `const order = Game.market.getOrderById('ORDER_ID');\nif (order && order.roomName === '${toRoom}' && order.price === ${price}) {\n  const cost = Game.market.calcTransactionCost(${Math.floor(amount)}, '${fromRoom}', order.roomName);\n  console.log({ orderId: order.id, type: order.type, amount: ${Math.floor(amount)}, cost });\n  // Run Game.market.deal(order.id, ${Math.floor(amount)}, '${fromRoom}') only after reviewing this output.\n}`
      : `const fee = ${orderAmount} * ${orderPrice} * 0.05;\nconsole.log({ amount: ${Math.floor(orderAmount)}, price: ${orderPrice}, estimatedFee: fee });\n// Create the order only after checking Credits, roomName, resourceType, type, price, and totalAmount.`;

  const summary = mode === "terminal"
    ? `${t.tabs.terminal}\n${fromRoom} → ${toRoom}\n${t.distance}: ${distance ?? "invalid"}\n${t.transaction}: ${cost}\n${t.totalRequired}: ${requiredEnergy}\n${t.maxSend}: ${maximumEnergySend}\n${t.boundary}`
    : mode === "deal"
      ? `${t.tabs.deal}\n${dealSide === "buy" ? t.buy : t.sell}\n${fromRoom} ↔ ${toRoom}\n${t.transaction}: ${cost}\n${t.gross}: ${formatNumber(grossCredits)}\n${t.effective}: ${formatNumber(effectivePrice, 4)}\n${t.boundary}`
      : `${t.tabs.order}\n${t.orderAmount}: ${formatNumber(orderAmount)}\n${t.orderPrice}: ${formatNumber(orderPrice, 4)}\n${t.fee}: ${formatNumber(orderFee)} Credits\n${t.boundary}`;

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
        {(Object.keys(t.tabs) as Mode[]).map((tab) => (
          <button key={tab} type="button" role="tab" aria-selected={mode === tab} onClick={() => setMode(tab)}>{t.tabs[tab]}</button>
        ))}
      </div>

      <div className="planning-grid">
        <section className="planning-panel" aria-labelledby="market-input-title">
          <p className="eyebrow">INPUTS</p>
          <h2 id="market-input-title">{t.inputs}</h2>

          {mode !== "order" ? (
            <div className="planning-fields">
              <label><span>{t.from}</span><input value={fromRoom} maxLength={8} onChange={(event) => setFromRoom(event.target.value.toUpperCase())} /></label>
              <label><span>{t.to}</span><input value={toRoom} maxLength={8} onChange={(event) => setToRoom(event.target.value.toUpperCase())} /></label>
              <label><span>{t.amount}</span><input type="number" min="0" max="1000000" value={amount} onChange={(event) => setAmount(clampNumber(Number(event.target.value), 0, 1000000))} /></label>
              <label><span>{t.energy}</span><input type="number" min="0" max="10000000" value={terminalEnergy} onChange={(event) => setTerminalEnergy(clampNumber(Number(event.target.value), 0, 10000000))} /></label>
              {mode === "terminal" ? (
                <label className="planning-check"><input type="checkbox" checked={sendingEnergy} onChange={(event) => setSendingEnergy(event.target.checked)} /><span>{t.sendingEnergy}</span></label>
              ) : (
                <>
                  <label><span>{t.side}</span><select value={dealSide} onChange={(event) => setDealSide(event.target.value as DealSide)}><option value="buy">{t.buy}</option><option value="sell">{t.sell}</option></select></label>
                  <label><span>{t.price}</span><input type="number" min="0" step="0.001" value={price} onChange={(event) => setPrice(clampNumber(Number(event.target.value), 0, 1000000))} /></label>
                  <label><span>{t.energyPrice}</span><input type="number" min="0" step="0.001" value={energyPrice} onChange={(event) => setEnergyPrice(clampNumber(Number(event.target.value), 0, 1000000))} /></label>
                </>
              )}
            </div>
          ) : (
            <div className="planning-fields">
              <label><span>{t.orderAmount}</span><input type="number" min="0" max="1000000000" value={orderAmount} onChange={(event) => setOrderAmount(clampNumber(Number(event.target.value), 0, 1000000000))} /></label>
              <label><span>{t.orderPrice}</span><input type="number" min="0" step="0.001" value={orderPrice} onChange={(event) => setOrderPrice(clampNumber(Number(event.target.value), 0, 1000000))} /></label>
            </div>
          )}
        </section>

        <aside className="planning-panel planning-results" aria-labelledby="market-result-title">
          <p className="eyebrow">RESULT</p>
          <h2 id="market-result-title">{t.result}</h2>

          {mode === "terminal" && (
            <>
              {distance === null ? <p className="planning-alert planning-alert-warning">{t.invalidRoom}</p> : (
                <dl className="planning-metrics">
                  <div><dt>{t.distance}</dt><dd>{distance}</dd></div>
                  <div><dt>{t.transaction}</dt><dd>{formatNumber(cost)} Energy</dd></div>
                  <div><dt>{t.totalRequired}</dt><dd>{formatNumber(requiredEnergy)} Energy</dd></div>
                  <div><dt>{t.maxSend}</dt><dd>{formatNumber(maximumEnergySend)} Energy</dd></div>
                </dl>
              )}
              {distance !== null && <p className={`planning-alert ${enoughEnergy ? "planning-alert-ok" : "planning-alert-warning"}`}>{enoughEnergy ? t.statusEnough : t.statusShort}</p>}
            </>
          )}

          {mode === "deal" && (
            distance === null ? <p className="planning-alert planning-alert-warning">{t.invalidRoom}</p> : (
              <dl className="planning-metrics">
                <div><dt>{t.distance}</dt><dd>{distance}</dd></div>
                <div><dt>{t.transaction}</dt><dd>{formatNumber(cost)} Energy</dd></div>
                <div><dt>{t.gross}</dt><dd>{formatNumber(grossCredits)} Credits</dd></div>
                <div><dt>{t.effective}</dt><dd>{formatNumber(effectivePrice, 4)} Credits</dd></div>
              </dl>
            )
          )}

          {mode === "order" && (
            <dl className="planning-metrics">
              <div><dt>{t.orderAmount}</dt><dd>{formatNumber(orderAmount)}</dd></div>
              <div><dt>{t.orderPrice}</dt><dd>{formatNumber(orderPrice, 4)} Credits</dd></div>
              <div className="planning-metric-wide"><dt>{t.fee}</dt><dd>{formatNumber(orderFee)} Credits</dd></div>
            </dl>
          )}

          <p className="planning-boundary">{t.boundary}</p>
          <details className="planning-code"><summary>{locale === "en" ? "Safe code example" : "安全代码示例"}</summary><pre>{code}</pre></details>
          <div className="planning-actions"><button type="button" onClick={() => copyText(summary)}>{t.copyResult}</button><button type="button" onClick={() => copyText(code)}>{t.copyCode}</button></div>
          <p className="planning-status" role="status" aria-live="polite">{status}</p>
        </aside>
      </div>
    </div>
  );
}
