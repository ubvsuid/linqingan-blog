# Site Asset Master V2

The Site Asset Master is the read-only identity and composition layer for Linqingan's operational assets. Domain registries remain the source of truth; Asset Master gives downstream intelligence one stable identity model.

## Coverage

V2 composes:

- Chinese Knowledge / Beginner articles from generated metadata registries;
- English articles from the established English article registry chain, including their `chinesePath` pair;
- canonical Chinese and English site/library/core hub pages;
- Knowledge modules;
- Chinese and English Tools from `src/lib/tool-catalog.ts`;
- Diagnostic symptom fragments from `src/lib/screeps-diagnostic-symptoms.ts`;
- API object hubs from `src/lib/screeps-api-hubs.ts`;
- Error Code fragments from `src/lib/screeps-errors.ts`;
- Glossary Term fragments from `src/lib/screeps-glossary.ts`.

English article IDs use `en:article:*`; English Tool IDs use `en:tool:*`; Chinese assets retain `zh-CN:*`. Core hub pages use the same language-prefixed identity rule. Error and Glossary items use fragment paths but canonicalize to their hub page, matching the Diagnostics model.

Navigation/archive URLs such as `/tags/*` are not automatically promoted into operational assets. They remain unmapped until there is an explicit product or operational reason to model them.

## Language pairs

Every registered English article retains:

- its own English Asset ID and `/en/blog/...` path;
- `languagePairPath` pointing to the Chinese source path;
- `languagePairAssetId` pointing to the Chinese Article Asset;
- its own English primary keyword and search intent.

Core hubs and Tools are represented independently in both languages so page-path mapping remains language-safe. This allows GSC Owner mapping to resolve the actual page asset first, then compare a query only with a same-language canonical Owner.

## Owner boundary

Asset coverage and keyword ownership are separate concerns. Adding a page or Tool to the Asset Master does not make it a keyword Owner.

Owner lookup remains limited to same-language article assets whose authoritative metadata declares `keywordRole=owner` plus a canonical `primaryKeyword`. Secondary keywords and observed GSC long-tail queries are not silently promoted into Owners, and fuzzy/LLM matching is not used.

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
