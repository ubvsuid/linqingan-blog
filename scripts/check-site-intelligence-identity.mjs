import assert from 'node:assert/strict';
import { inferPathLanguage, makeActionId, makeSignalId } from './lib/site-intelligence-identity.mjs';

assert.equal(inferPathLanguage('/en/blog/a'), 'en');
assert.equal(inferPathLanguage('/blog/a'), 'zh-CN');

const left = makeSignalId({
  source: 'gsc', kind: 'gsc-owner-mismatch', assetId: 'zh-CN:article:a', relatedAssetId: 'zh-CN:article:b',
  semantic: { pagePath: '/blog/a', query: 'screeps moveTo', ownerStatus: 'owner-mismatch' },
});
const right = makeSignalId({
  relatedAssetId: 'zh-CN:article:b', assetId: 'zh-CN:article:a', kind: 'gsc-owner-mismatch', source: 'gsc',
  semantic: { ownerStatus: 'owner-mismatch', query: 'screeps moveTo', pagePath: '/blog/a' },
});
assert.equal(left, right);

const a1 = makeActionId({ category: 'keyword-ownership', assetId: 'zh-CN:article:a', relatedAssetId: 'zh-CN:article:b', issueKey: { query: 'screeps moveto' } });
const a2 = makeActionId({ relatedAssetId: 'zh-CN:article:b', issueKey: { query: 'screeps moveto' }, category: 'keyword-ownership', assetId: 'zh-CN:article:a' });
assert.equal(a1, a2);
console.log('Site Intelligence semantic identity validation passed.');
