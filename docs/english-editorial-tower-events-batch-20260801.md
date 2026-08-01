# English editorial batch: Tower action event identity

Date: 2026-08-01  
Repository: `ubvsuid/linqingan-blog`  
Base branch: `clean-blog-v1`

## Scope

This batch substantively edits three existing English pages only:

1. `/en/blog/screeps-tower-auto-attack-hostiles`
2. `/en/blog/screeps-tower-heal-creeps`
3. `/en/blog/screeps-tower-repair-threshold`

No new article route, slug, Chinese source page, redirect, or source-directory page is created. Existing Chinese mappings, Canonical targets, hreflang relationships, author URL, and original publication dates remain unchanged.

No Search Console property or export was available. Selection is based on repository review, official Screeps documentation, action-identity risk, current code paths, and existing validation infrastructure. This batch makes no claim about impressions, clicks, CTR, rankings, traffic, field Core Web Vitals, live CPU savings, player results, or production combat performance.

## Why these pages were selected

The earlier Tower articles described safe target selection and saved return codes, but their later verification depended mainly on net `hits` changes. Net state cannot identify one Tower action:

- hostile healing, TOUGH damage reduction, other Towers, and Creeps can change attack outcomes;
- incoming damage and other healers can offset or add healing;
- decay, damage, Creeps, and other Towers can change repaired structure hits;
- several Tower modules can compete for the same structure in one tick.

`Room.getEventLog()` exposes the previous tick's actor ID, event type, target ID, and resolved event data. The revised workflows bind every accepted Tower intent to one event and explicitly fail closed when the one-tick verification window is missed.

## Technical changes

### Tower attack

- Keeps diplomacy and threat weights explicit as project policy.
- Stores the exact target ID and every Tower ID.
- Estimates range falloff through `TOWER_POWER_ATTACK`, `TOWER_OPTIMAL_RANGE`, `TOWER_FALLOFF_RANGE`, and `TOWER_FALLOFF`.
- Reads active `PWR_OPERATE_TOWER` and `PWR_DISRUPT_TOWER` factors from `POWER_INFO`.
- Treats the output estimate as allocation context, not settlement proof.
- Matches `EVENT_ATTACK` plus `EVENT_ATTACK_TYPE_RANGED` for each accepted Tower-target pair.
- Exposes missing, partial, missed-window, and fully verified volley states.

### Tower healing

- Includes both `FIND_MY_CREEPS` and `FIND_MY_POWER_CREEPS`.
- Preserves deterministic urgency ordering.
- Estimates range- and Power-adjusted healing to reduce obvious over-heal.
- Allocates Towers until estimated missing hits are covered.
- Matches `EVENT_HEAL` plus `EVENT_HEAL_TYPE_RANGED` by Tower and target IDs.
- Keeps final hits as net operational state rather than proof of one Tower's contribution.

### Tower repair

- Keeps attack, healing, reserve, ratio threshold, and fortification exclusions explicit.
- Estimates range- and Power-adjusted repair to reduce obvious over-repair.
- Saves exact Tower and structure IDs.
- Matches `EVENT_REPAIR` by actor and target.
- Requires the event's `energySpent` to equal `TOWER_ENERGY_COST`.
- Treats structure hits as supporting context because decay, damage, Creeps, or other Towers can change the same object.

## SEO and editorial changes

- Search intents are separated into attack-volley events, owned-unit heal events, and ordinary-structure repair events.
- Titles, descriptions, categories, reading times, keywords, registry records, search records, and BlogPosting inputs are synchronized.
- Repeated FAQ data and FAQPage output are removed.
- Original `datePublished` remains `2026-07-26`.
- `dateModified` is scoped to `2026-08-01` for these three substantively edited pages.
- Real environment evidence remains visibly Pending.

## Internal quality scores

These are project-internal editorial scores, not Google scores, ranking guarantees, certifications, or third-party assessments.

| Page | Before | Technical /24 | Intent /18 | Original /15 | English /12 | Structure /10 | Evidence /8 | SEO /8 | A11y /5 | Final |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Tower attack events | 92 | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| Tower heal events | 92 | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| Tower repair events | 92 | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |

One technical point remains withheld because Screeps Console execution remains Pending. One original-value point remains withheld because this is focused technical editorial analysis rather than controlled original research.

## Validation added

The dedicated gate validates:

- exactly three existing slugs and unchanged English/Chinese paths;
- unchanged publication dates and scoped modification dates;
- synchronized metadata and distinct search intent;
- fixed 98-point internal thresholds;
- 35 table-of-contents anchors;
- 18 JavaScript blocks through `node --check`;
- official Screeps sources;
- Tower falloff boundary values at ranges 5, 6, and 20;
- active operate/disrupt effect handling;
- exact attack, heal, and repair actor-target event matching;
- Power Creep inclusion in healing;
- repair `energySpent`;
- missed event windows and partial matches;
- no FAQ data or FAQPage output;
- explicit Pending Console and live multi-tick evidence;
- registry, publication aggregator, package, route, smoke, search, and Sitemap integration.

Existing repository thresholds are not lowered.

## Release boundary

Static and preview checks cannot replace:

- real Screeps Console execution;
- live verification at exactly `submittedAt + 1`;
- attack falloff and TOUGH observations;
- active `PWR_OPERATE_TOWER` and `PWR_DISRUPT_TOWER` observations;
- hostile healing and multi-Tower focus observations;
- regular Creep and Power Creep healing observations;
- incoming damage and over-heal observations;
- Road decay, incoming structure damage, Creep repair, and over-repair observations;
- genuine Console, Tower, Creep, Power Creep, structure, and event-log screenshots.

Until those tests exist, every live evidence field remains `Pending`.
