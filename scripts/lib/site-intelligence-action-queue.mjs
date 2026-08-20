function num(v) { const n = Number.parseFloat(String(v ?? 0)); return Number.isFinite(n) ? n : 0; }
function text(v) { return String(v ?? "").trim(); }
function uniq(v) { return [...new Set(v.filter(Boolean))]; }
const PRIO = { P0: 0, P1: 1, P2: 2 };
const CATS = ["keyword-ownership","serp-snippet","ranking-opportunity","evidence-conflict","content-intent","internal-search","feedback","tool-activation","protect-expand","research"];
function priority(v, fallback = "P2") { return ["P0","P1","P2"].includes(text(v)) ? text(v) : fallback; }
function base(asset) { return { assetId: asset.assetId, path: asset.path, title: asset.title }; }
function push(rows, row) {
  rows.push({ ...row, priority: priority(row.priority), assetId: row.assetId ?? null, relatedAssetId: row.relatedAssetId ?? null, path: row.path ?? null, title: row.title ?? null, sources: uniq(row.sources ?? []), sourceSignalIds: uniq(row.sourceSignalIds ?? []), metrics: row.metrics ?? {}, sampleBoundary: row.sampleBoundary ?? null, corroboratedBy: uniq(row.corroboratedBy ?? []) });
}
function gscMetrics(p) { return { query: p.query ?? null, clicks: num(p.clicks), impressions: num(p.impressions), ctr: num(p.ctr), position: num(p.position) }; }

const GSC_RULES = {
  "gsc-low-ctr": ["serp-snippet", "Review title, description, and SERP intent match", "The GSC classifier found meaningful visibility with weaker-than-expected CTR. Improve the search snippet and intent match without changing the URL by default."],
  "gsc-ranking-opportunity": ["ranking-opportunity", "Strengthen content, internal links, and supporting evidence", "The page is within an actionable ranking range. Review coverage gaps, task-path links, and evidence before considering new competing content."],
  "gsc-intent-review": ["content-intent", "Reassess search intent and consolidation need", "The GSC classifier indicates weak ranking despite some visibility. Confirm query intent, overlap, and whether this asset should be strengthened, repositioned, or consolidated."],
  "gsc-protect-expand": ["protect-expand", "Protect the winning page and expand supporting paths", "This page is already performing. Preserve its Owner role, freshness, internal links, and evidence before making structural changes."],
};

function addGsc(asset, rows) {
  for (const s of asset.signals.filter((x) => x.source === "gsc")) {
    const p = s.payload ?? {};
    if (s.kind === "gsc-owner-mismatch") {
      push(rows, { ...base(asset), priority: "P0", category: "keyword-ownership", relatedAssetId: s.relatedAssetId, actionId: `keyword-ownership:${asset.assetId}:${s.signalId}`, action: "Review keyword ownership / cannibalization", rationale: `Google is surfacing ${p.pagePath || asset.path} for a query owned by ${p.expectedOwnerHref || s.relatedAssetId || "another asset"}. Review intent, internal links, overlap, and canonical ownership before changing URLs.`, sources: ["gsc"], sourceSignalIds: [s.signalId], metrics: gscMetrics(p), sampleBoundary: "GSC priority is preserved from the upstream Search Console opportunity classifier." });
      continue;
    }
    const rule = GSC_RULES[s.kind]; if (!rule) continue;
    let pr = priority(p.priority); if (s.kind === "gsc-protect-expand" && pr === "P0") pr = "P1";
    push(rows, { ...base(asset), priority: pr, category: rule[0], actionId: `${rule[0]}:${asset.assetId}:${s.signalId}`, action: rule[1], rationale: rule[2], sources: ["gsc"], sourceSignalIds: [s.signalId], metrics: gscMetrics(p), sampleBoundary: "GSC priority is preserved from the upstream Search Console opportunity classifier." });
  }
}

function addSearch(asset, rows) {
  for (const s of asset.signals.filter((x) => x.source === "internal-search" && x.rankingEligible)) {
    const p = s.payload ?? {};
    if (s.kind === "internal-search-zero-result") push(rows, { ...base(asset), priority: "P1", category: "internal-search", actionId: `internal-search-zero:${asset.assetId}:${s.signalId}`, action: "Fix owned internal-search vocabulary or indexing", rationale: "A mature internal-search sample returned zero results for a concept already owned by this asset. Check aliases, search-document coverage, and result labeling before creating new content.", sources: ["internal-search"], sourceSignalIds: [s.signalId], metrics: { query: p.query ?? null, searches: num(p.searches), zeroResults: num(p.zeroResults), clicks: num(p.clicks) }, sampleBoundary: `Eligible only because the source passed its ${s.sampleGate} gate.` });
    if (s.kind === "internal-search-no-click") push(rows, { ...base(asset), priority: "P2", category: "internal-search", actionId: `internal-search-no-click:${asset.assetId}:${s.signalId}`, action: "Review owned internal-search ranking and result snippet", rationale: "Internal search returned results but users did not click. Check result ordering and description before changing content architecture.", sources: ["internal-search"], sourceSignalIds: [s.signalId], metrics: { query: p.query ?? null, searches: num(p.searches), clicks: num(p.clicks) }, sampleBoundary: `Eligible only because the source passed its ${s.sampleGate} gate.` });
  }
}

function addFeedback(asset, rows) {
  for (const s of asset.signals.filter((x) => x.source === "article-feedback" && x.rankingEligible)) {
    const p = s.payload ?? {}, votes = num(p.votes), bad = num(p.notHelpful), rate = votes ? bad / votes : 0;
    if (votes < 20 || rate < .3) continue;
    push(rows, { ...base(asset), priority: rate >= .5 ? "P1" : "P2", category: "feedback", actionId: `feedback:${asset.assetId}:${s.signalId}`, action: "Review article usefulness and unresolved reader questions", rationale: "A mature feedback sample has a meaningful not-helpful share. Inspect missing steps, evidence boundaries, and intent match before rewriting broadly.", sources: ["article-feedback"], sourceSignalIds: [s.signalId], metrics: { votes, helpful: num(p.helpful), notHelpful: bad, negativeRate: rate }, sampleBoundary: `Eligible only because feedback passed its ${s.sampleGate} gate.` });
  }
}

function addTool(asset, rows) {
  const ss = asset.signals.filter((x) => x.source === "tool-usage" && x.rankingEligible); if (!ss.length) return;
  const totals = new Map(); for (const s of ss) { const a = text(s.payload?.action || s.kind.replace(/^tool-/, "")); totals.set(a, (totals.get(a) ?? 0) + num(s.payload?.events)); }
  const views = totals.get("view") ?? 0, uses = totals.get("use") ?? 0, rate = views ? uses / views : 0;
  if (views < 20 || (uses > 0 && rate >= .1)) return;
  push(rows, { ...base(asset), priority: "P2", category: "tool-activation", actionId: `tool-activation:${asset.assetId}`, action: "Review tool activation path and task clarity", rationale: "The tool has a mature usage sample with many views but little tracked use. Check inputs, CTA, examples, and event instrumentation before adding another tool.", sources: ["tool-usage"], sourceSignalIds: ss.map((s) => s.signalId), metrics: { views, uses, activationRate: rate }, sampleBoundary: `Eligible only because tool usage passed the ${ss[0].sampleGate} gate.` });
}

function addEvidence(asset, rows) {
  const ss = asset.signals.filter((x) => x.source === "runtime-evidence"); if (!ss.length) return;
  const c = {}; for (const s of ss) { const st = text(s.payload?.status || s.kind.replace("runtime-evidence-", "")); c[st] = (c[st] ?? 0) + num(s.payload?.evidence || 1); }
  const a=c.accepted??0, r=c.rejected??0, v=c.revoked??0, p=(c.captured??0)+(c.reviewed??0); let cfg=null;
  if (v) cfg=["P1","Re-verify revoked Runtime Evidence","Revoked evidence should no longer support the article. Re-run the relevant validation and review the article's evidence claims."];
  else if (r && a) cfg=["P1","Resolve conflicting Runtime Evidence","This asset has both accepted and rejected evidence. Confirm whether they cover different scenarios or whether the technical claim needs narrower wording."];
  else if (r) cfg=["P1","Review rejected Runtime Evidence","Rejected technical evidence should be investigated before this article is treated as strongly verified."];
  else if (p && !a) cfg=["P2","Complete Runtime Evidence review","Evidence exists but none is accepted yet. Complete review before presenting the asset as runtime-verified."];
  if (!cfg) return;
  push(rows, { ...base(asset), priority: cfg[0], category: "evidence-conflict", actionId: `evidence:${asset.assetId}:${cfg[1].replace(/\s+/g,"-").toLowerCase()}`, action: cfg[1], rationale: cfg[2], sources: ["runtime-evidence"], sourceSignalIds: ss.map((s) => s.signalId), metrics: { accepted:a, rejected:r, revoked:v, pending:p }, sampleBoundary: "Runtime Evidence is direct technical evidence; this is maintenance/technical review, not a popularity score." });
}

function addUnmapped(snapshot, rows) {
  for (const s of snapshot.unmappedSignals ?? []) {
    const p=s.payload??{};
    if (s.source === "gsc" && s.kind === "gsc-unmapped-article") push(rows,{ priority:priority(p.priority,"P1"), category:"research", actionId:`unmapped-gsc:${s.signalId}`, action:"Review unmapped GSC article URL", rationale:"Search Console references a /blog/ URL not represented in the current Asset Master. Confirm whether it is stale, redirected, excluded from metadata, or an indexing artifact.", sources:["gsc"], sourceSignalIds:[s.signalId], metrics:{pagePath:p.pagePath??null,query:p.query??null}, sampleBoundary:"This is a mapping/inventory review, not a recommendation to create a new page." });
    if (s.source === "internal-search" && s.kind === "internal-search-zero-result" && s.sampleGate === "eligible-for-ranking" && num(p.searches) >= 20) push(rows,{ priority:"P1", category:"research", actionId:`unmapped-search:${s.signalId}`, action:"Research an unowned internal-search vocabulary or content gap", rationale:"A mature zero-result query has no exact Owner mapping. Research intent and vocabulary before deciding whether to add aliases, improve navigation, or create content.", sources:["internal-search"], sourceSignalIds:[s.signalId], metrics:{query:p.query??null,searches:num(p.searches)}, sampleBoundary:"No new article should be created automatically from this signal." });
  }
}

function corroborate(rows) {
  const map=new Map(); for(const r of rows){if(!r.assetId)continue; const a=map.get(r.assetId)??[];a.push(r);map.set(r.assetId,a);}
  for(const group of map.values()){const sources=uniq(group.flatMap((r)=>r.sources));if(sources.length<2)continue;for(const r of group){r.corroboratedBy=uniq([...r.corroboratedBy,...sources.filter((s)=>!r.sources.includes(s))]);if(r.priority==="P2"&&r.corroboratedBy.length)r.priority="P1";}}
}
function sortRows(a,b){return (PRIO[a.priority]??99)-(PRIO[b.priority]??99)||(CATS.indexOf(a.category)<0?99:CATS.indexOf(a.category))-(CATS.indexOf(b.category)<0?99:CATS.indexOf(b.category))||b.sources.length-a.sources.length||text(a.path||a.actionId).localeCompare(text(b.path||b.actionId));}

export function buildSiteIntelligenceActionQueue(snapshot,{limit=50}={}){
  if(!snapshot?.assets||!snapshot?.policy)throw new Error("A Site Intelligence Signals snapshot is required.");
  const rows=[];for(const asset of snapshot.assets){addGsc(asset,rows);addSearch(asset,rows);addFeedback(asset,rows);addTool(asset,rows);addEvidence(asset,rows);}addUnmapped(snapshot,rows);corroborate(rows);
  const seen=new Set(),actions=rows.filter((r)=>!seen.has(r.actionId)&&seen.add(r.actionId)).sort(sortRows).slice(0,Math.max(1,Number(limit)||50));
  return {schemaVersion:1,generatedAt:new Date().toISOString(),sourceGeneratedAt:snapshot.generatedAt??null,policy:{mode:"rule-based-no-composite-score",p0Rule:"P0 is reserved for explicit high-value GSC issues such as Owner mismatch or upstream P0 opportunities. Behavioral signals cannot independently create P0.",behavioralRule:snapshot.policy.behavioralRule,evidenceRule:"Rejected/revoked/conflicting Runtime Evidence creates technical review work, normally P1/P2, not automatic SEO P0.",corroborationRule:"Multiple mature source families may promote P2 to P1, but cannot manufacture P0 without an explicit P0 rule.",automationRule:"Actions are recommendations only; no content, URL, metadata, database, or deployment change is automatic."},summary:{actions:actions.length,P0:actions.filter((r)=>r.priority==="P0").length,P1:actions.filter((r)=>r.priority==="P1").length,P2:actions.filter((r)=>r.priority==="P2").length,assetsRepresented:new Set(actions.map((r)=>r.assetId).filter(Boolean)).size,unmappedActions:actions.filter((r)=>!r.assetId).length},actions};
}

function esc(v){return String(v??"").replaceAll("|","\\|").replaceAll("\n"," ");}
function metric(m={}){const p=[];if(m.query)p.push(`query=${m.query}`);if(num(m.impressions))p.push(`impr=${num(m.impressions)}`);if(num(m.position))p.push(`pos=${num(m.position).toFixed(1)}`);if(num(m.ctr))p.push(`ctr=${num(m.ctr).toFixed(2)}%`);if(num(m.searches))p.push(`searches=${num(m.searches)}`);if(num(m.votes))p.push(`votes=${num(m.votes)}`);if(num(m.views))p.push(`views=${num(m.views)}`);if(num(m.rejected))p.push(`rejected=${num(m.rejected)}`);if(num(m.revoked))p.push(`revoked=${num(m.revoked)}`);return p.join(", ")||"—";}
export function renderSiteIntelligenceActionQueueMarkdown(q){return ["# Site Intelligence Action Queue","",`Generated: ${q.generatedAt}`,`Signals snapshot: ${q.sourceGeneratedAt??"unknown"}`,"","## Policy","",`- Mode: ${q.policy.mode}`,`- P0: ${q.policy.p0Rule}`,`- Behavioral: ${q.policy.behavioralRule}`,`- Evidence: ${q.policy.evidenceRule}`,`- Corroboration: ${q.policy.corroborationRule}`,`- Automation: ${q.policy.automationRule}`,"","## Summary","",`- Actions: ${q.summary.actions}`,`- P0: ${q.summary.P0}`,`- P1: ${q.summary.P1}`,`- P2: ${q.summary.P2}`,`- Assets represented: ${q.summary.assetsRepresented}`,`- Unmapped/research actions: ${q.summary.unmappedActions}`,"","## Prioritized actions","","| Priority | Asset | Category | Recommended action | Sources | Evidence / metric |","|---|---|---|---|---|---|",...q.actions.map((r)=>`| ${r.priority} | ${esc(r.path||r.assetId||"unmapped")} | ${esc(r.category)} | ${esc(r.action)} | ${esc(r.sources.join(", "))} | ${esc(metric(r.metrics))} |`),"","## Interpretation boundary","","This is a rule-based operating queue, not a Google score or an automated publishing system. Every action retains source signal IDs and rationale. Low-volume behavior remains excluded by the Signals Layer gate. Review the cited evidence before changing content, URLs, redirects, or site architecture.",""].join("\n");}
