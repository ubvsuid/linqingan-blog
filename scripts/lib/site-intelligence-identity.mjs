import crypto from 'node:crypto';

function text(value) { return String(value ?? '').normalize('NFKC').trim(); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}
function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
}
export function normalizeIdentityText(value) {
  return text(value).toLowerCase().replace(/\s+/g, ' ');
}
export function inferPathLanguage(value) {
  const path = text(value).split(/[?#]/, 1)[0];
  return path === '/en' || path.startsWith('/en/') ? 'en' : 'zh-CN';
}
export function makeSignalId({ source, kind, assetId = null, relatedAssetId = null, semantic = {} }) {
  const src = normalizeIdentityText(source) || 'unknown';
  const type = normalizeIdentityText(kind) || 'unknown';
  const digest = hash({ source: src, kind: type, assetId: text(assetId) || null, relatedAssetId: text(relatedAssetId) || null, semantic });
  return `sig:${src}:${type}:${digest.slice(0, 24)}`;
}
export function makeActionId({ category, assetId = null, relatedAssetId = null, issueKey = {} }) {
  const cat = normalizeIdentityText(category) || 'research';
  const digest = hash({ category: cat, assetId: text(assetId) || null, relatedAssetId: text(relatedAssetId) || null, issueKey });
  return `act:${cat}:${digest.slice(0, 24)}`;
}
