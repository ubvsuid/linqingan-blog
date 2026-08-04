import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sources = {
  "screeps-rampart-set-public": fs.readFileSync(
    path.join(root, "src/lib/english-editorial-rampart-access-20260804.ts"),
    "utf8",
  ),
  "screeps-recycle-creep": fs.readFileSync(
    path.join(root, "src/lib/english-editorial-recycle-20260804.ts"),
    "utf8",
  ),
  "screeps-structure-destroy": fs.readFileSync(
    path.join(root, "src/lib/english-editorial-structure-destroy-20260804.ts"),
    "utf8",
  ),
};

const failures = [];

for (const [slug, source] of Object.entries(sources)) {
  for (const required of [
    'updatedAt: "2026-08-04"',
    "finalScore: 98",
    '"Screeps Console test", "Pending"',
  ]) {
    if (!source.includes(required)) {
      failures.push(`${slug}: missing source-owned signal ${required}`);
    }
  }

  const tocPairs = [
    ...source.matchAll(
      /\["([a-z0-9]+(?:-[a-z0-9]+)*)", "([^"]+)"\],/g,
    ),
  ].map((match) => ({ id: match[1], label: match[2] }));

  if (tocPairs.length !== 10) {
    failures.push(`${slug}: TOC count ${tocPairs.length}; expected 10.`);
  }

  const seen = new Set();
  for (const { id, label } of tocPairs) {
    if (seen.has(id)) {
      failures.push(`${slug}: duplicate TOC id ${id}.`);
    }
    seen.add(id);

    if (
      !source.includes(`<h2 id="${id}">`)
      && !source.includes(`<h3 id="${id}">`)
    ) {
      failures.push(
        `${slug}: source-owned anchor missing for ${label} (${id}).`,
      );
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(
    `\nPer-article source-scope validation failed: ${failures.length} issue(s).`,
  );
  process.exit(1);
}

console.log(
  "Per-article source-scope validation passed: 3 articles, 10 source-owned anchors each, unique TOC IDs, article-local modified dates, Pending evidence, and 98/100 internal scores.",
);
