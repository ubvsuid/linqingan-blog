import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { validateContentMetadataSchemaV1 } from "./lib/content-metadata-schema.mjs";

function write(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function validFrontmatter(extra = "") {
  return `---\ntitle: "Fixture"\ndescription: "A sufficiently complete fixture description for schema validation."\npublishedAt: "2026-08-01"\nupdatedAt: "2026-08-02"\ncategory: "Fixture"\ntags:\n  - "Screeps"\n  - "Fixture"\n  - "Schema"\ndraft: false\nverification:\n  docsChecked: true\n  syntaxChecked: true\n  consoleTested: false\n  liveTested: false\n  checkedAt: "2026-08-02"\n  testedAt: "2026-08-02"\n  testEnvironment: "Node.js 22 离线模拟环境（不是 Screeps 官方服务器）"\n  testResult: "Fixture syntax validation passed."\n${extra}---\n\nFixture body.\n`;
}

function knowledgeSidecar(extraKnowledge = "", extraSeo = "") {
  return `{
  "knowledge": {
    "module": "fixture-module",
    "stage": "fixture-stage",
    "order": 10,
    "difficulty": "beginner"${extraKnowledge}
  },
  "seo": {
    "primaryKeyword": "Fixture keyword",
    "searchIntent": "Fixture search intent",
    "keywordRole": "owner"${extraSeo}
  }
}\n`;
}

function runFixture(name, setup) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `linqingan-metadata-${name}-`));
  try {
    write(root, "content/posts/fixture.md", validFrontmatter());
    write(root, "content/knowledge-metadata/fixture.json", knowledgeSidecar());
    fs.mkdirSync(path.join(root, "content/roadmap-metadata"), { recursive: true });
    setup?.(root);
    return validateContentMetadataSchemaV1(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const valid = runFixture("valid");
assert.deepEqual(valid.errors, [], `valid fixture failed: ${valid.errors.join(" | ")}`);
assert.equal(valid.publishedCount, 1);
assert.equal(valid.knowledgeCount, 1);
assert.equal(valid.roadmapCount, 0);

const standaloneSeo = runFixture("standalone-seo", (root) => {
  fs.unlinkSync(path.join(root, "content/knowledge-metadata/fixture.json"));
  write(root, "content/posts/fixture.md", validFrontmatter(`seo:\n  primaryKeyword: "Fixture keyword"\n  searchIntent: "Fixture intent"\n  keywordRole: owner\n`));
});
assert(standaloneSeo.errors.some((error) => error.includes("seo 不能脱离 knowledge/roadmap 单独声明")));

const dualClassification = runFixture("dual-classification", (root) => {
  write(root, "content/roadmap-metadata/fixture.json", `{
  "roadmap": {"id":"beginner","stage":"fixture-stage","order":10,"difficulty":"beginner"},
  "seo": {"primaryKeyword":"Fixture roadmap","searchIntent":"Fixture roadmap intent","keywordRole":"owner"}
}\n`);
});
assert(dualClassification.errors.some((error) => error.includes("不能同时拥有 Knowledge 与 Roadmap sidecar")));
assert(dualClassification.errors.some((error) => error.includes("必须且只能属于一个 Knowledge Module 或 Beginner Roadmap")));

const unknownControlledField = runFixture("unknown-field", (root) => {
  write(root, "content/knowledge-metadata/fixture.json", knowledgeSidecar(',\n    "futureField": true'));
});
assert(unknownControlledField.errors.some((error) => error.includes("Metadata Schema V1 不允许字段 futureField")));

const invalidRuntimeEnvironment = runFixture("runtime-environment", (root) => {
  write(root, "content/posts/fixture.md", validFrontmatter().replace("consoleTested: false", "consoleTested: true"));
});
assert(invalidRuntimeEnvironment.errors.some((error) => error.includes("不能仍声明离线模拟")));

const unclassifiedPublished = runFixture("unclassified", (root) => {
  fs.unlinkSync(path.join(root, "content/knowledge-metadata/fixture.json"));
});
assert(unclassifiedPublished.errors.some((error) => error.includes("必须且只能属于一个 Knowledge Module 或 Beginner Roadmap")));

console.log("Content Metadata Schema V1 contract tests passed: valid fixture accepted; invalid ownership, unknown-field, verification, and classification fixtures rejected.");
