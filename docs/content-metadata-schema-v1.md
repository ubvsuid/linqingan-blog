# Content Metadata Schema V1

Content Metadata Schema V1 freezes the metadata contract for all published Chinese articles in `content/posts/` without forcing editorial rewrites solely for migration.

## Goals

- keep permanent identity independent from slug, URL, title, taxonomy, and SEO fields;
- keep exactly one classification source per published article;
- make Knowledge and Beginner metadata follow one shared schema contract;
- validate article frontmatter and verification metadata before registry generation;
- preserve migration sidecars until the next substantive article edit;
- fail builds on malformed or ambiguous metadata instead of repairing it implicitly.

## Source-of-Truth matrix

| Data | Source of Truth | Mutability |
| --- | --- | --- |
| Article body/title/description/tags/verification | `content/posts/<slug>.md` | Mutable through editorial changes |
| Knowledge classification + SEO | inline `knowledge + seo` **or** `content/knowledge-metadata/<slug>.json` | Mutable, one source only |
| Beginner classification + SEO | inline `roadmap + seo` **or** `content/roadmap-metadata/<slug>.json` | Mutable, one source only |
| Knowledge article identity | `content/knowledge-identities.json` | IDs immutable; slug locator mutable |
| Beginner article identity | `content/roadmap-identities.json` | IDs immutable; slug locator mutable |
| Generated registries | `src/generated/*.json` | Derived only, never editorial SoT |

## Article frontmatter V1

Required for published articles:

- `title`: non-empty string
- `description`: non-empty string
- `publishedAt`: valid `YYYY-MM-DD`
- `category`: non-empty string
- `tags`: 3 to 5 non-empty strings
- `verification`: Verification V1 object

Optional:

- `updatedAt`: valid `YYYY-MM-DD`, never before `publishedAt`
- `draft`: boolean
- `featured`: boolean
- `locale`: if explicitly present in `content/posts`, V1 requires `zh-CN`; absence resolves to `zh-CN`

Root frontmatter may continue to contain presentation/editorial fields outside this contract. Controlled namespaces below are closed: unknown fields fail Schema V1.

## Knowledge V1

```yaml
knowledge:
  module: movement-vision
  stage: common-errors
  order: 10
  difficulty: intermediate
```

Allowed keys only: `module`, `stage`, `order`, `difficulty`. `module` and `stage` are stable slugs, `order` is a positive integer, and `difficulty` is `beginner | intermediate | advanced`.

## Beginner Roadmap V1

```yaml
roadmap:
  id: beginner
  stage: understand-screeps
  order: 10
  difficulty: beginner
```

Allowed keys only: `id`, `stage`, `order`, `difficulty`. Domain checks remain stricter where needed; the current Beginner roadmap requires `id=beginner` and `difficulty=beginner`.

## SEO V1

```yaml
seo:
  primaryKeyword: Screeps ERR_NOT_IN_RANGE
  searchIntent: 排查动作距离不足并建立正确重试流程
  keywordRole: owner
```

Allowed keys only: `primaryKeyword`, `searchIntent`, `keywordRole`. `keywordRole` is `owner | supporting`. `seo` cannot exist independently; it must belong to exactly one `knowledge` or `roadmap` classification source.

## Verification V1

Allowed keys: `docsChecked`, `syntaxChecked`, `consoleTested`, `liveTested`, `checkedAt`, `testedAt`, `testEnvironment`, `testResult`.

The four status fields are booleans and `checkedAt` is a valid `YYYY-MM-DD`. When test evidence exists, `testedAt`, `testEnvironment`, and `testResult` must be complete. When `consoleTested` or `liveTested` is true, the environment must not still describe an offline simulation. When runtime flags are false but test evidence is recorded, the environment must explicitly say it is an offline simulation and not an official Screeps server.

Evidence freshness/lifecycle fields are intentionally not added to V1; they belong to the later Evidence Lifecycle phase and require an explicit schema version change.

## Classification invariant

Every published article must resolve to exactly one classification source:

```text
published article
  ├─ Knowledge: inline knowledge+seo OR Knowledge sidecar
  └─ Beginner: inline roadmap+seo OR Roadmap sidecar
```

Invalid states include simultaneous Knowledge/Beginner membership, sidecar plus the same inline namespace, standalone `seo`, zero classifications, or more than one classification.

## Identity invariant

`contentId` and `contentGroupId` do not live in article frontmatter. They are attached by the registry generators from the domain identity registries. A slug rename changes only the locator and must never regenerate either permanent ID.

## Build behavior

Both registry generators call the shared Schema V1 validator before generating output. `Knowledge health` also runs the standalone schema check explicitly, so malformed metadata fails before derived registries become authoritative inputs to downstream systems.

## Versioning

V1 is intentionally conservative. Adding or renaming controlled fields requires either a backward-compatible V1 validator change when semantics do not change, or `Content Metadata Schema V2` when meaning, ownership, or lifecycle changes. Do not silently reinterpret an existing V1 field.
