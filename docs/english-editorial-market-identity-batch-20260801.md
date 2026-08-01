# English editorial batch: market identity and coordinated settlement

Date: 2026-08-01  
Base branch: `clean-blog-v1`

## Scope

This batch deeply edits three existing English articles only:

1. `/en/blog/screeps-market-create-order`
2. `/en/blog/screeps-market-deal`
3. `/en/blog/screeps-terminal-send-resources`

No new article route, slug, Chinese source, redirect, or source-directory page is created.

No Search Console property or export was available. Selection is based on repository review, official Screeps documentation, code-path analysis, intent separation, and current validation infrastructure. This batch does not claim impressions, clicks, CTR, rankings, traffic, field Core Web Vitals, market profit, live CPU improvements, player feedback, or server-test results.

## Why these pages

### createOrder()

The previous verifier searched every current order for matching fields. An older equivalent order could therefore be reported as the new order created by this request.

The new workflow:

- requires a request ID;
- validates one ordinary Terminal-backed order;
- stores the complete pre-call order ID set;
- disables before `createOrder()`;
- compares current IDs against the pre-call set;
- applies field matching only to newly appeared IDs;
- returns explicit no-match and ambiguous-new-order states;
- stores the exact verified order ID for later maintenance.

### market.deal()

The previous article defined a ten-call coordinator but did not use it in the complete executor. Independent callers could still exceed the account-wide per-tick limit or lose track of which call consumed a slot.

The new workflow:

- separates planning requests from API calls;
- refreshes the exact order immediately before planning;
- requires a normal sell order with a room name;
- creates one in-memory coordinator per game tick;
- passes that coordinator to every deal caller;
- reserves a slot immediately before `Game.market.deal()`;
- leaves a request enabled only when no API call occurred;
- disables after any real call;
- stores pre-call incoming transaction IDs;
- verifies the exact new transaction by ID difference.

### Terminal.send()

The previous verifier matched timestamp and transfer fields. Another identical transfer could be mistaken for this request.

The new workflow:

- requires a request ID and exact source Terminal ID;
- rejects a same-room destination before the API call;
- keeps destination vision optional;
- preserves the Energy-versus-non-Energy budget distinction;
- stores all pre-call outgoing transaction IDs;
- disables before `send()`;
- filters later records to newly appeared IDs first;
- returns an ambiguous state instead of selecting the first identical transfer.

## Search-intent separation

- `screeps-market-create-order` owns order creation and exact new-order identity.
- `screeps-market-deal` owns coordinated execution of another player’s sell order.
- `screeps-terminal-send-resources` owns direct Terminal-to-Terminal transfer identity.

The URLs, Chinese mappings, original publication dates, Canonical targets, hreflang mappings, and author URL remain unchanged.

## Internal quality scores

These are project-internal editorial scores, not Google scores, ranking guarantees, certifications, or third-party assessments.

| Page | Before | Technical /24 | Intent /18 | Original /15 | English /12 | Structure /10 | Evidence /8 | SEO /8 | A11y /5 | Final |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Market create order | 92 | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| Market deal | 92 | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |
| Terminal send | 92 | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |

One technical point remains withheld because real Screeps Console execution and live multi-tick verification are Pending. One original-value point remains withheld because this is focused technical editorial analysis rather than controlled original research.

## Static validation

The dedicated gate validates:

- exactly three existing routes;
- unchanged Chinese mappings and publication dates;
- `dateModified=2026-08-01` only for these records;
- synchronized titles, descriptions, intent, keywords, reading time, and scores;
- 34 TOC anchors;
- 17 JavaScript blocks through `node --check`;
- official Screeps sources;
- new-order ID difference;
- one shared per-tick deal coordinator;
- pre-call incoming and outgoing transaction ID snapshots;
- explicit no-match and ambiguity states;
- no FAQ data or FAQPage output;
- explicit Pending live evidence;
- package and publication integration.

## Evidence still Pending

All three pages still require:

- real Screeps Console execution;
- live multi-tick verification;
- genuine Console, Market, Terminal, or transaction screenshots.

Create-order checks still required:

- accepted creation with one new ID;
- rejected creation;
- old equivalent order present;
- two matching new orders;
- delayed visibility of the new order;
- active and inactive order states;
- real `ERR_FULL` behavior.

Deal checks still required:

- ten coordinated calls in one tick;
- an eleventh deferred request;
- order consumed after preflight;
- missing order room;
- accepted and rejected calls;
- exact incoming transaction ID;
- two identical concurrent deals;
- Credits, Store, Energy, and cooldown settlement.

Terminal checks still required:

- ordinary-resource send;
- Energy send;
- same-room rejection;
- invisible destination;
- missing destination Terminal;
- active `PWR_OPERATE_TERMINAL`;
- exact outgoing transaction ID;
- two identical concurrent sends;
- receiving-room allocation.

## Release boundary

Do not merge while any required CI, Lighthouse, review, preview, or production check fails. Production metadata, Canonical, hreflang, structured data, internal links, response status, and visible Pending evidence must be checked after merge.
