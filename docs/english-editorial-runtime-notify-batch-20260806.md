# English editorial batch — 2026-08-06

## Scope and evidence

This batch changes three existing English URLs only. It creates no article, changes no slug, and does not modify the Chinese source pages.

Search Console data was not available through the connected repository. Selection therefore came from a static audit of the published article registry, the final editorial override chain, official Screeps API boundaries, current code examples, intent overlap, and visible verification labels.

Validation available in this batch:

- official Screeps documentation review;
- repository and publication-chain review;
- TypeScript-oriented static review;
- JavaScript syntax review of the five revised examples;
- 16 offline boundary assertions covering CPU samples, Segment coordination, and notification payload drift.

Validation not available in this batch:

- genuine Screeps Console output;
- live shard CPU samples;
- live Segment activation and persistence across ticks;
- live notification grouping, inbox delivery, or screenshots;
- Search Console, Vercel production, or real-user Core Web Vitals evidence.

## Selected existing pages

| Existing URL | Why selected | Main pre-edit problem | Expected improvement |
| --- | --- | --- | --- |
| `/en/blog/screeps-cpu-getused-bucket` | CPU profiling is a core, high-frequency debugging task | The current page correctly stated that Simulation returns zero, but its minimal probe returned a bare delta and did not explicitly prevent the invalid reverse inference that two zero samples identify the Simulation | Return an explicit inconclusive state for zero samples, align title and H1, and separate section profiling from bucket-degradation recovery |
| `/en/blog/screeps-rawmemory-segments` | Segments require exact multi-tick reasoning and affect persistent data safety | A second same-tick finalizer could replace the first activation plan; late requests were silently accepted by module order | Make finalization idempotent, reject late requests visibly, preserve deferred IDs, and move finalization to one end-of-tick boundary |
| `/en/blog/screeps-game-notify` | Alerts are a high-value observability feature with evidence and trust boundaries | The payload digest could be read as authorization or human approval, and the sample contained a non-executable placeholder | Label the digest as a non-cryptographic integrity fingerprint and provide an executable payload-binding example |

## Search-intent overlap review

- CPU profiling now owns section measurement, comparable samples, and hard-tick headroom. `/en/blog/screeps-cpu-bucket-degradation` owns colony-wide bucket decline and recovery policy.
- RawMemory Segments owns activation, later-tick availability, schema validation, and coordinated writes. `/en/blog/screeps-memory-basics` owns ordinary durable state; `/en/blog/screeps-global-cache` owns disposable derived data.
- Game.notify owns immutable notification revision identity and local submission evidence. It does not claim external email delivery.

No URL merge, redirect, canonical change, or deletion is required.

## Editorial changes

### Screeps CPU profiling

Removed or replaced:

- the throw-only invalid-callback path, which did not return a diagnostic state;
- wording that explained the known Simulation behavior without explicitly rejecting the reverse inference from a zero sample;
- the previous alternative-guide paragraph, which did not distinguish section profiling from colony-wide bucket recovery.

Preserved:

- the existing `Use this guide when` boundary;
- bounded `global.cpuProbe` samples outside Memory;
- the `minimumBucket = 2000` example as clearly labeled player policy;
- essential work before optional analytics;
- hard-tick headroom through `remaining > reserveCpu`;
- official sources and Pending live evidence.

Added:

- `function-required`, `zero-sample-inconclusive`, and `sample-recorded` states;
- start, end, non-negative delta, tick, callback result, and label in one observable result;
- a natural internal-link boundary to the bucket-degradation guide;
- title, H1, description, and search-intent alignment.

### RawMemory Segments

Removed or replaced:

- an unguarded finalizer whose second call could overwrite the next active set;
- feature-local finalization that encouraged multiple modules to call the final API boundary.

Added:

- a shared coordinator with `finalizedAt` and a stable plan;
- visible `activation-already-finalized` and `segment-request-invalid` states;
- an idempotent repeated-finalize path;
- late-request rejection after the activation boundary;
- a minimal feature step followed by one end-of-tick finalizer;
- explicit warning that direct `RawMemory.setActiveSegments()` calls bypass the coordinator.

### Game.notify payload identity

Removed or replaced:

- the `replace-with-current-payload-digest` placeholder;
- wording that could let a deterministic checksum sound like approval or authorization.

Added:

- a direct statement that the FNV-style digest is not cryptographic, secret, collision-resistant, or proof of human review;
- an executable example that calculates the stored confirmation from the exact request;
- a trust-boundary note for privileged or externally supplied alerts;
- continued separation between local API return evidence and external inbox delivery.

## Internal quality scores

### Before this batch

| Page | Technical /24 | Intent /18 | Original /15 | English /12 | Structure /10 | Evidence /8 | SEO /8 | Accessibility /5 | Total | Publication state |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| CPU profiling | 21 | 17 | 14 | 12 | 10 | 7 | 8 | 5 | **94** | Blocked: zero-sample ambiguity and no explicit diagnostic state |
| RawMemory Segments | 21 | 18 | 14 | 12 | 10 | 7 | 8 | 5 | **95** | Blocked: activation plan could be overwritten |
| Game.notify | 21 | 18 | 14 | 12 | 10 | 7 | 8 | 5 | **95** | Blocked: trust boundary and executable-example gap |

### Final static score

| Page | Technical /24 | Intent /18 | Original /15 | English /12 | Structure /10 | Evidence /8 | SEO /8 | Accessibility /5 | Total | Static publication decision |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| CPU profiling | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** | Eligible only after repository CI passes |
| RawMemory Segments | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** | Eligible only after repository CI passes |
| Game.notify | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** | Eligible only after repository CI passes |

### Score rationale

- **Technical accuracy and code safety — 23/24:** official boundaries are represented, ambiguous or unsafe state handling is replaced, and offline edge cases pass. One point remains reserved because live Screeps execution is pending.
- **Search intent — 18/18:** each page owns one task and links to the nearest alternative when the user's problem is different.
- **Original value — 14/15:** the pages add practical state models and failure boundaries rather than restating the API. One point remains reserved for genuine live evidence.
- **English quality — 12/12:** placeholder copy and ambiguous trust language were removed; wording remains concrete and engineering-focused.
- **Structure — 10/10:** replacement sections preserve stable heading IDs and add decision boundaries only where needed.
- **Evidence transparency — 8/8:** official review, static analysis, offline checks, and pending live evidence are separated.
- **SEO — 8/8:** existing URLs and canonicals remain stable; CPU title/H1/description are aligned; internal links distinguish overlapping intents; modified date is scoped to these three substantive revisions.
- **Accessibility — 5/5:** heading hierarchy and table semantics are preserved; no image or interaction regression is introduced by the content override.

The numeric scores are internal editorial scores. They are not Google scores, ranking guarantees, or third-party certification.

## Offline assertions

The repository gate executes 16 offline assertions after syntax-checking all five revised JavaScript blocks:

- CPU: invalid callback state, two-zero inconclusive state, positive sample state, and non-negative delta;
- Segments: invalid ID rejection, priority ordering, ten-ID active cap, deferred IDs, one API call, idempotent repeated finalization, late-request rejection, and next-tick reuse;
- notifications: executable confirmation identity, deterministic digest, and fingerprint mismatch after message mutation.

## Release gate

Do not merge this batch unless the repository's actual content checks, English checks, internal-link checks, TypeScript, ESLint, production build, structured-data checks, accessibility checks, smoke tests, and available performance gates pass in CI.

Even after CI passes, the pages must continue to display these evidence boundaries:

- `Screeps Console test — Pending`;
- `Live multi-tick verification — Pending`;
- page-specific live CPU, Segment, notification, and screenshot evidence — Pending.
