import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishFactoryProduceArticle = {
  slug: "screeps-factory-produce",
  path: "/en/blog/screeps-factory-produce",
  chinesePath: "/blog/screeps-factory-produce",
  title: "Screeps Factory.produce(): Components, Levels, and Power",
  headline: "How to Produce Factory Commodities Safely in Screeps",
  description:
    "Validate an owned active Factory, resolve the COMMODITIES recipe, check all components and output capacity, respect cooldown, match commodity level to the Factory level and PWR_OPERATE_FACTORY effect, submit one reviewed production request, and verify Store deltas afterward.",
  category: "RESOURCES · FACTORY PRODUCTION WORKFLOW",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "19 min read",
  breadcrumbLabel: "Factory Production",
  tags: ["Screeps", "Factory", "Commodities", "Power", "Production"],
  keywords: [
    "Screeps StructureFactory produce",
    "Screeps COMMODITIES components",
    "Screeps PWR_OPERATE_FACTORY",
    "Screeps factory level",
    "Screeps factory cooldown",
  ],
  primaryKeyword: "Screeps StructureFactory produce",
  searchIntent: "Produce one commodity with complete component, capacity, cooldown, level, and Power checks",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — produce(), COMMODITIES, cooldown, level, PWR_OPERATE_FACTORY, Store constraints and return codes"],
    ["Level boundary", "Level commodities require a Factory set to the same level by PWR_OPERATE_FACTORY; a Factory level cannot later be changed"],
    ["Execution boundary", "OK means production was scheduled; output and component Store deltas require later verification"],
    ["JavaScript syntax", "Passed"],
    ["Offline production review", "Passed — recipe, components, capacity, cooldown, level, Power effect and one-time request states"],
    ["Screeps Console test", "Pending"],
    ["Live Factory, Power effect, Store delta and cooldown test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["recipe", "Read the recipe from COMMODITIES"],
    ["components", "Check every component"],
    ["capacity", "Check output capacity"],
    ["level-power", "Match Factory level and Power effect"],
    ["pure-plan", "Build a testable production plan"],
    ["complete-example", "Complete one-time produce example"],
    ["verify", "Verify Store and cooldown afterward"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Where should Factory recipes come from?",
      "Use the official COMMODITIES constant. Do not maintain a separate hard-coded component table unless it is versioned and tested against the current game data.",
    ],
    [
      "Can every Factory produce every commodity?",
      "No. Level commodities require a Factory with the same level, and that level is assigned through PWR_OPERATE_FACTORY.",
    ],
    [
      "Can a Factory level change later?",
      "The official API states that once a Factory level is set by power, it cannot be changed.",
    ],
    [
      "Does OK prove the commodity is already stored?",
      "No. Save component and output snapshots, then compare Store and cooldown on the next tick.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-lab-boost-creep",
    label: "Previous Lab guide",
    title: "Boost Creep Body Parts",
  },
  next: {
    href: "/en/blog",
    label: "Continue reading",
    title: "Return to English Articles",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Recover one owned active Factory, resolve the requested product through <code>COMMODITIES</code>, require every component amount, enough output capacity, zero cooldown, the correct Factory level, and the required active <code>PWR_OPERATE_FACTORY</code> effect for level commodities. Disable the one-time request before <code>factory.produce(resourceType)</code>, then compare output, component Stores, and cooldown afterward.</p>

<h2 id="recipe">Read the recipe from COMMODITIES</h2>
<pre><code class="language-javascript">function getCommodityRecipe(resourceType) {
  if (typeof resourceType !== 'string') {
    return null;
  }

  const recipe = COMMODITIES[resourceType];

  return recipe
    && Number.isInteger(recipe.amount)
    && recipe.amount > 0
    && recipe.components
      ? recipe
      : null;
}</code></pre>
<p>The recipe may include <code>level</code> and <code>cooldown</code>. Use the current constant rather than copying a static table into Memory.</p>

<h2 id="components">Check every component</h2>
<pre><code class="language-javascript">function getMissingComponents(factory, recipe) {
  return Object.entries(recipe.components)
    .map(([resourceType, required]) => ({
      resourceType,
      required,
      available:
        factory.store.getUsedCapacity(resourceType)
    }))
    .filter(item => item.available < item.required);
}</code></pre>
<p>The Factory Store is shared by components and products. Component logistics must not remove required inputs after the preflight snapshot.</p>

<h2 id="capacity">Check output capacity</h2>
<pre><code class="language-javascript">function canStoreCommodity(
  factory,
  resourceType,
  amount
) {
  return factory.store.getFreeCapacity(resourceType)
    >= amount;
}</code></pre>
<p>Even with every component present, production fails when the Store cannot receive the recipe output amount.</p>

<h2 id="level-power">Match Factory level and Power effect</h2>
<pre><code class="language-javascript">function getOperateFactoryEffect(factory) {
  return factory.effects?.find(effect =>
    effect.effect === PWR_OPERATE_FACTORY
    && effect.ticksRemaining > 0
  ) ?? null;
}

function hasRequiredFactoryLevel(factory, recipe) {
  if (!Number.isInteger(recipe.level)) {
    return true;
  }

  const effect = getOperateFactoryEffect(factory);

  return factory.level === recipe.level
    && effect?.level === recipe.level;
}</code></pre>
<p>Level-less commodities do not require an operated Factory. Level commodities require both the Factory level and the matching active effect.</p>

<h2 id="pure-plan">Build a testable production plan</h2>
<pre><code class="language-javascript">function evaluateProduction(factory, resourceType) {
  if (!factory) {
    return { ready: false, reason: 'factory-missing' };
  }

  const recipe = getCommodityRecipe(resourceType);

  if (!recipe) {
    return { ready: false, reason: 'recipe-invalid' };
  }

  if (factory.cooldown > 0) {
    return { ready: false, reason: 'factory-cooling-down', recipe };
  }

  if (!hasRequiredFactoryLevel(factory, recipe)) {
    return { ready: false, reason: 'factory-level-mismatch', recipe };
  }

  const missing = getMissingComponents(factory, recipe);

  if (missing.length > 0) {
    return {
      ready: false,
      reason: 'components-insufficient',
      recipe,
      missing
    };
  }

  if (!canStoreCommodity(
    factory,
    resourceType,
    recipe.amount
  )) {
    return { ready: false, reason: 'output-full', recipe };
  }

  return {
    ready: true,
    reason: 'ready',
    recipe,
    missing: []
  };
}</code></pre>

<h2 id="complete-example">Complete one-time produce example</h2>
<p><strong>State impact:</strong> this code may schedule one real Factory production action and writes a request snapshot. It never retries automatically.</p>
<pre><code class="language-javascript">function getOwnedActiveFactory(id) {
  const factory = typeof id === 'string'
    ? Game.getObjectById(id)
    : null;

  return factory
    && factory.structureType === STRUCTURE_FACTORY
    && factory.my === true
    && factory.isActive() === true
      ? factory
      : null;
}

module.exports.loop = function () {
  const request = Memory.factoryProduceRequest;

  if (!request || request.enabled !== true) {
    return;
  }

  const factory = getOwnedActiveFactory(request.factoryId);
  const plan = evaluateProduction(
    factory,
    request.resourceType
  );

  request.lastCheckedAt = Game.time;
  request.lastStatus = plan.reason;

  if (!plan.ready) {
    request.preview = {
      missing: plan.missing ?? [],
      recipeLevel: plan.recipe?.level ?? null,
      factoryLevel: factory?.level ?? null,
      cooldown: factory?.cooldown ?? null
    };
    return;
  }

  request.enabled = false;
  request.submittedAt = Game.time;
  request.snapshot = {
    factoryId: factory.id,
    resourceType: request.resourceType,
    outputAmount: plan.recipe.amount,
    outputBefore:
      factory.store.getUsedCapacity(request.resourceType),
    componentsBefore: Object.fromEntries(
      Object.keys(plan.recipe.components).map(type => [
        type,
        factory.store.getUsedCapacity(type)
      ])
    ),
    cooldownBefore: factory.cooldown,
    factoryLevel: factory.level,
    effect: getOperateFactoryEffect(factory)
  };

  const result = factory.produce(request.resourceType);

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted-pending-verification'
    : 'failed-review-required';
};</code></pre>

<h2 id="verify">Verify Store and cooldown afterward</h2>
<pre><code class="language-javascript">function verifyProduction(request) {
  const snapshot = request?.snapshot;
  const factory = getOwnedActiveFactory(
    snapshot?.factoryId
  );

  if (!snapshot || !factory) {
    return { verified: false, reason: 'snapshot-or-factory-missing' };
  }

  const outputNow = factory.store.getUsedCapacity(
    snapshot.resourceType
  );

  return {
    verified:
      request.result === OK
      && outputNow >= snapshot.outputBefore
        + snapshot.outputAmount,
    outputDelta: outputNow - snapshot.outputBefore,
    cooldownNow: factory.cooldown
  };
}</code></pre>
<p>Haulers or another production module can change the Store before verification. Coordinate ownership of Factory actions and component logistics.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Production scheduled</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>A required component is missing</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>The Factory cannot produce that level commodity</td></tr>
<tr><td><code>ERR_FULL</code></td><td>The Store cannot receive the product</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>The resource is not a valid commodity</td></tr>
<tr><td><code>ERR_TIRED</code></td><td>The Factory is cooling down</td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>The Factory is inactive at the current RCL</td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Recover an owned active Factory.</li>
<li>Read the current recipe from <code>COMMODITIES</code>.</li>
<li>Check every component.</li>
<li>Check product capacity.</li>
<li>Check cooldown.</li>
<li>Match recipe level, Factory level, and active Power effect.</li>
<li>Disable before calling.</li>
<li>Save component and output snapshots.</li>
<li>Record the exact return code.</li>
<li>Verify Store delta and cooldown later.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not implement commodity chains, component hauling, Power Creep scheduling, market profitability, multi-Factory allocation, or production forecasting.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Can a level-zero Factory produce level commodities?</h3>
<p>No. It needs the matching Factory level and active Power effect.</p>
<h3>Can a Factory level be changed?</h3>
<p>The official API says it cannot be changed after it is set.</p>
<h3>Should a failed production request retry every tick?</h3>
<p>No. Review current components, capacity, cooldown, and Power state first.</p>
<h3>Does recipe cooldown prove success?</h3>
<p>It supports verification, but compare Store deltas as well.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureFactory.produce" rel="nofollow">API Reference: StructureFactory.produce()</a></li>
<li><a href="https://docs.screeps.com/api/#COMMODITIES" rel="nofollow">API Reference: COMMODITIES</a></li>
<li><a href="https://docs.screeps.com/resources.html#Commodities" rel="nofollow">Screeps Documentation: Commodities</a></li>
<li><a href="https://docs.screeps.com/power.html" rel="nofollow">Screeps Documentation: PWR_OPERATE_FACTORY</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
