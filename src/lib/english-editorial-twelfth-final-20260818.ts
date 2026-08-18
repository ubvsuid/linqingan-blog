import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

function upsertVerification(
  verification: Array<[string, string]>,
  row: [string, string],
): Array<[string, string]> {
  return [
    ...verification.filter(([term]) => term !== row[0]),
    row,
  ];
}

function finalizeTickExample(article: EnglishBeginnerArticle): string {
  const search = `<pre><code class="language-javascript">const first = creep.moveTo(source);\nconst second = creep.moveTo(spawn);\n\nconsole.log(JSON.stringify({\n  tick: Game.time,\n  first,\n  second,\n  positionNow: [\n    creep.pos.roomName,\n    creep.pos.x,\n    creep.pos.y\n  ]\n}));</code></pre>`;
  const replacement = `<pre><code class="language-javascript">const creepName = Object.keys(Game.creeps)[0];\nconst creep = creepName ? Game.creeps[creepName] : null;\nconst spawnName = Object.keys(Game.spawns)[0];\nconst spawn = spawnName ? Game.spawns[spawnName] : null;\nconst source = creep?.room.find(FIND_SOURCES)[0] ?? null;\n\nif (!creep || !source || !spawn) {\n  console.log(JSON.stringify({\n    tick: Game.time,\n    reason: 'missing-diagnostic-input',\n    creepName,\n    spawnName,\n    sourceFound: Boolean(source)\n  }));\n} else {\n  const first = creep.moveTo(source);\n  const second = creep.moveTo(spawn);\n\n  console.log(JSON.stringify({\n    tick: Game.time,\n    first,\n    second,\n    positionNow: [\n      creep.pos.roomName,\n      creep.pos.x,\n      creep.pos.y\n    ]\n  }));\n}</code></pre>`;

  if (!article.articleHtml.includes(search)) {
    throw new Error("Twelfth English editorial finalizer could not find the competing movement example");
  }

  return article.articleHtml.replace(search, replacement);
}

export function applyEnglishEditorialTwelfthFinal20260818(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article) return article;

  if (article.slug === "screeps-introduction") {
    return {
      ...article,
      verification: upsertVerification(
        article.verification,
        ["Publication status", "Ready"],
      ),
    };
  }

  if (article.slug === "screeps-tick-game-loop") {
    return {
      ...article,
      verification: upsertVerification(
        article.verification,
        ["Game-loop model", "Checked"],
      ),
      articleHtml: finalizeTickExample(article),
    };
  }

  return article;
}
