export function normalizeKeyword(value) { return String(value ?? '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' '); }
export function normalizeKeywordLoose(value) { return normalizeKeyword(value).replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' '); }
export function normalizePagePath(value) {
  const raw=String(value??'').trim(); if(!raw)return '';
  try { const url=new URL(raw,'https://www.linqingan.com'); let p=decodeURI(url.pathname||'/').replace(/\/{2,}/g,'/'); if(p.length>1)p=p.replace(/\/+$/,''); return p||'/'; }
  catch { const p=raw.split(/[?#]/,1)[0].trim(); if(!p)return ''; const s=p.startsWith('/')?p:`/${p}`; return s.length>1?s.replace(/\/+$/,''):s; }
}
