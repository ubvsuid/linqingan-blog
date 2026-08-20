import { parseGscCtr } from "./site-intelligence-gsc.mjs";

function text(value) { return String(value ?? "").trim(); }
function metricNumber(value) {
  const parsed = Number.parseFloat(text(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}
function normalizeHeader(value) {
  return text(value).normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

export function parseCsv(textValue) {
  const textInput = String(textValue ?? "");
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let index = 0; index < textInput.length; index += 1) {
    const char = textInput[index], next = textInput[index + 1];
    if (char === '"' && quoted && next === '"') { field += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field); if (row.some((value) => text(value))) rows.push(row); row = []; field = "";
    } else field += char;
  }
  row.push(field); if (row.some((value) => text(value))) rows.push(row);
  return rows;
}

export function parseGscCsv(textValue, { requirePageQuery = false } = {}) {
  const rows = parseCsv(textValue);
  if (rows.length < 2) throw new Error("The Search Console CSV does not contain data rows.");
  const headers = rows[0].map(normalizeHeader);
  const indexOf = (...names) => names.map(normalizeHeader).map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;
  const queryIndex = indexOf("Top queries", "Query", "热门查询", "查询", "查询词");
  const pageIndex = indexOf("Top pages", "Page", "Landing page", "热门网页", "网页", "页面", "着陆页");
  const clicksIndex = indexOf("Clicks", "点击次数", "点击");
  const impressionsIndex = indexOf("Impressions", "展示次数", "展现次数", "展示", "展现");
  const ctrIndex = indexOf("CTR", "点击率");
  const positionIndex = indexOf("Position", "Average position", "排名", "平均排名", "平均位置");
  if (requirePageQuery && (pageIndex < 0 || queryIndex < 0)) throw new Error("GSC warehouse V1 requires both Page and Query columns.");
  if (queryIndex < 0 && pageIndex < 0) throw new Error("Neither a Page nor Query column was found in the Search Console export.");
  if ([clicksIndex, impressionsIndex, ctrIndex, positionIndex].some((index) => index < 0)) throw new Error("Required GSC metric columns are missing.");
  return rows.slice(1).map((row, index) => ({
    rowNumber: index + 2,
    page: pageIndex >= 0 ? text(row[pageIndex]) : "",
    query: queryIndex >= 0 ? text(row[queryIndex]) : "",
    clicks: Math.trunc(metricNumber(row[clicksIndex])),
    impressions: Math.trunc(metricNumber(row[impressionsIndex])),
    ctr: (() => { try { return parseGscCtr(row[ctrIndex], { unit: "auto" }); } catch { return Number.NaN; } })(),
    position: text(row[positionIndex]) ? metricNumber(row[positionIndex]) : null,
  }));
}
