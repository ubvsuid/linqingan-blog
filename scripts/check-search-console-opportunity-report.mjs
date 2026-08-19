import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "linqingan-gsc-report-"));
const inputPath = path.join(tempDirectory, "sample.csv");
const markdownPath = path.join(tempDirectory, "report.md");
const jsonPath = path.join(tempDirectory, "report.json");

const csv = [
  "热门网页,热门查询,点击次数,展示次数,点击率,排名",
  "https://www.linqingan.com/blog/screeps-memory-basics,Screeps Memory,12,300,1.50%,8",
  "https://www.linqingan.com/blog/screeps-memory-basics,Screeps spawnCreep return codes,1,50,2.00%,16",
  "https://www.linqingan.com/blog/screeps-introduction,,5,90,2.50%,11",
  ",Screeps Memory,3,70,1.20%,18",
].join("\n");
fs.writeFileSync(inputPath, `${csv}\n`, "utf8");

try {
  execFileSync(
    process.execPath,
    [path.join(root, "scripts", "search-console-opportunity-report.mjs"), inputPath, markdownPath, jsonPath],
    { cwd: root, stdio: "pipe" },
  );

  const payload = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const records = payload.records;
  if (!Array.isArray(records) || records.length !== 4) {
    throw new Error(`Expected 4 report rows, received ${Array.isArray(records) ? records.length : "non-array"}`);
  }

  const memory = records.find((record) => record.pagePath === "/blog/screeps-memory-basics" && record.query === "Screeps Memory");
  if (!memory || memory.system !== "knowledge" || memory.module !== "memory-engineering" || memory.ownerStatus !== "owner-match") {
    throw new Error("Knowledge page mapping or exact Owner mapping failed");
  }
  if (memory.priority !== "P0" || memory.action !== "Improve title and description") {
    throw new Error("GSC opportunity classification failed for high-impression low-CTR row");
  }

  const mismatch = records.find((record) => record.query === "Screeps spawnCreep return codes");
  if (!mismatch || mismatch.ownerStatus !== "owner-mismatch" || mismatch.action !== "Review keyword ownership / cannibalization") {
    throw new Error("Known Owner mismatch was not promoted to a cannibalization review");
  }
  if (mismatch.expectedOwnerHref !== "/blog/screeps-spawncreep-return-codes") {
    throw new Error(`Unexpected expected Owner URL: ${mismatch.expectedOwnerHref}`);
  }

  const beginner = records.find((record) => record.pagePath === "/blog/screeps-introduction");
  if (!beginner || beginner.system !== "roadmap" || beginner.module !== "beginner" || beginner.stage !== "understand-screeps") {
    throw new Error("Beginner Roadmap page mapping failed");
  }

  const queryOnly = records.find((record) => !record.page && record.query === "Screeps Memory");
  if (!queryOnly || queryOnly.system !== "knowledge" || !queryOnly.mappingSource.startsWith("owner-keyword")) {
    throw new Error("Query-only Owner mapping failed");
  }

  const markdown = fs.readFileSync(markdownPath, "utf8");
  for (const expectedText of ["memory-engineering", "Review keyword ownership / cannibalization", "beginner"]) {
    if (!markdown.includes(expectedText)) throw new Error(`Markdown report is missing ${expectedText}`);
  }

  console.log("Search Console opportunity report check passed: Chinese headers, Knowledge/Roadmap mapping, Owner mismatch and query-only mapping verified.");
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}
