# Site Asset Master V2

The Site Asset Master is the read-only identity and composition layer for Linqingan's operational assets. Domain registries remain the source of truth; Asset Master gives downstream intelligence one stable identity model.

## Coverage

V2 composes:

- Chinese Knowledge / Beginner articles from generated metadata registries;
- English articles from the established English article registry chain, including their `chinesePath` pair;
- Knowledge modules and core hubs;
- Tools from `src/lib/tool-catalog.ts`;
- Diagnostic symptom fragments from `src/lib/screeps-diagnostic-symptoms.ts`;
- API object hubs from `src/lib/screeps-api-hubs.ts`;
- Error Code fragments from `src/lib/screeps-errors.ts`;
- Glossary Term fragments from `src/lib/screeps-glossary.ts`.

English article IDs use `en:article:*`; Chinese assets retain `zh-CN:*`. Error and Glossary items use fragment paths but canonicalize to their hub page, matching the Diagnostics model.

## Language pairs

Every registered English article retains:

- its own English Asset ID and `/en/blog/...` path;
- `languagePairPath` pointing to the Chinese source path;
- `languagePairAssetId` pointing to the Chinese Article Asset;
- its own English primary keyword and search intent.

This allows GSC Owner mapping to be language-scoped instead of comparing an English page directly against a Chinese Owner.

## Decision boundary

Asset Master does not calculate SEO scores or infer opportunity. Its decision hooks remain empty until real Signals are joined downstream.

Validate and report:

```bash
npm run knowledgegenerate
npm run roadmapgenerate
node scripts/check-english-article-mapping.mjs
node scripts/check-site-asset-master.mjs
node scripts/site-asset-master-report.mjs reports/site-assets.json reports/site-assets.md
```
