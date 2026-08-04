# English editorial batch: fortification, Mineral, and Power evidence

Date: 2026-08-03  
Branch: `content/english-editorial-defense-mineral-power-20260803`  
Stacked base: `content/english-editorial-recovery-storage-build-20260803` at `91640f659606784586d204dc3ffea35b88093ce9`

## Access and publication boundary

This batch was selected from repository and pull-request history. No Google Search Console property, Screeps account, live room, Console history, shard telemetry, or genuine screenshots were available. No impressions, clicks, rankings, room outcomes, CPU measurements, or live success claims are inferred.

PR #91 and PR #92 remain open. This branch is therefore stacked on PR #92 and must not merge first. After the dependencies merge, retarget or rebase this branch onto the updated default branch and rerun every gate.

## Selected existing articles

| Article | Main gap before editing | New evidence model |
|---|---|---|
| `/en/blog/screeps-wall-rampart-repair-limit` | Staged hits policy existed, but several Repairers could silently duplicate one target and later hits deltas could not identify one action | One room coordinator, target reservation, pending Repairer/structure identity, exact next-tick `EVENT_REPAIR` |
| `/en/blog/screeps-mineral-extractor-harvest` | Same-tile Extractor checks existed, but later Store, Mineral and cooldown deltas did not identify one Miner action | Exact Miner/Mineral pending record and next-tick `EVENT_HARVEST`; event amount separated from depletion and overflow |
| `/en/blog/screeps-power-spawn-process-power` | GPL and Store snapshots were useful but could be overread as exclusive attribution | Single dispatcher, exact Power Spawn ID, planned local resource signature, transfer-confound detection, and explicit disclosure that no process event exists |

The initial next-batch list was reviewed against prior PR history. These three had not received a dedicated recent deep-edit PR. No route, slug, Canonical URL, hreflang pair, Chinese source path, or `datePublished` value changes.

## Official engine findings

### Creep repair

The official engine records `EVENT_REPAIR` with the Repairer as `objectId`, the repaired structure as `data.targetId`, repaired hits as `data.amount`, and consumed Energy as `data.energySpent`. Net structure hits can still be affected by other repairs or damage, so the event is used for identity and its amount is not replaced with a net-delta guess.

### Mineral harvest

The official engine records `EVENT_HARVEST` with the Miner as `objectId` and Mineral as `data.targetId`. In the Mineral branch, the event amount is based on harvest power, while remaining Mineral can cap the amount removed and Store overflow can be dropped. The article therefore separates actor-target identity, Mineral depletion, and retained Store gain.

### Power processing

The official `processPower` processor consumes local Power and Energy and increments account Power progress, but it does not push a Room event. The article explicitly rejects a fabricated event. A matching exact-structure Store signature is supporting evidence only; GPL remains account-wide and transfers can confound local deltas.

## Editorial changes

### Fortification repair

- separated Wall and Rampart stages;
- added one coordinator with duplicate-Creep protection and target reservation;
- records pending state only after `repair()` returns `OK`;
- matches exact Repairer and target IDs on the next tick;
- reports missing, ambiguous, invisible-room, and missed-window states;
- keeps stage promotion, emergency Tower logic, supply, and threat response separate;
- removed repeated Quick Answer, checklist, FAQ, and unsupported FAQ schema.

### Mineral harvesting

- binds one Miner, one Mineral, and the same-tile active Extractor;
- distinguishes movement from an accepted harvest action;
- records exact IDs and before values only after `OK`;
- verifies exact `EVENT_HARVEST` identity on the next tick;
- documents the official event-amount/depletion/overflow boundary;
- treats regeneration as live object state rather than a copied countdown;
- removed repeated checklist and FAQ material.

### Power processing

- starts with the absence of a processPower Room event;
- adds one dispatcher and a per-tick exact-structure guard;
- snapshots planned Power, Energy, effect level, local Stores, room stock, and GPL;
- verifies the exact Power Spawn resource signature on the next tick;
- detects Energy or Power `EVENT_TRANSFER` records involving that structure;
- treats GPL only as corroborating account context;
- reports mismatched, confounded, missing, and missed-window samples without claiming failure or success beyond evidence;
- removed FAQ and generic summary material.

## Human editorial pass

The three pages use different structures suited to their problems: policy/coordination/event proof, station/action/event identity, and explicit evidence limitation/resource signature. Generic openings, repeated quick-answer sections, mechanical checklists, empty conclusions, and AI-marketing phrases were removed.

## Internal scoring

These are project-internal editorial scores, not Google scores, ranking promises, or third-party certifications.

| Article | Before | Final |
|---|---:|---:|
| Fortification repair | 91 | **98** |
| Mineral harvesting | 91 | **98** |
| Power processing | 90 | **98** |

Final dimensions for each article: technical 23/24, intent 18/18, original value 14/15, English 12/12, structure 10/10, evidence 8/8, SEO 8/8, accessibility 5/5.

One technical point remains withheld because no live Screeps execution exists. One original-value point remains withheld because there is no genuine room case study or measured outcome.

## Files changed

- `src/lib/english-editorial-defense-mineral-power-20260803.ts`
- `src/lib/english-editorial-published-20260731.ts`
- `src/lib/english-defense-operations-registry-17.ts`
- `src/lib/english-mineral-storage-power-registry-12.ts`
- `scripts/check-english-editorial-defense-mineral-power-20260803.mjs`
- `scripts/smoke-english-defense-17.mjs`
- `scripts/smoke-english-resources-12.mjs`
- `package.json`
- `docs/english-editorial-defense-mineral-power-20260803.md`

## Publication gate

Required before merge:

- dependency PRs #91 and #92 merged;
- branch retargeted or rebased to the updated default branch;
- dedicated editorial gate, existing batch gates, TypeScript, ESLint, accessibility, production build, smoke and Lighthouse all pass again;
- Vercel Preview reviewed;
- no unresolved valid review comments.

Pending evidence remains visible on-page:

- Screeps Console test: Pending
- live multi-tick verification: Pending
- genuine room or Console screenshots: Pending
- Search Console data: unavailable
- production verification: pending until merge

## Recommended next batch

1. `/en/blog/screeps-reserve-vs-claim-controller`
2. `/en/blog/screeps-renew-creep`
3. `/en/blog/screeps-nuker-launch`
4. `/en/blog/screeps-terminal-send-resources`
5. `/en/blog/screeps-lab-boost-creep`
