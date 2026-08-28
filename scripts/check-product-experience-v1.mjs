import fs from "node:fs";

const checks = [
  ["package.json", '"nanoid": "3.3.18"', "nanoid security override"],
  ["package-lock.json", '"version": "3.3.18"', "nanoid 3.3.18 lock"],
  ["src/app/(zh)/verified/page.tsx", "RUNTIME EVIDENCE HUB", "Chinese Runtime Evidence Hub"],
  ["src/app/(en)/en/verified/page.tsx", "RUNTIME EVIDENCE HUB", "English Runtime Evidence Hub"],
  ["src/components/verified-content-explorer.tsx", "accepted Evidence", "accepted Evidence public boundary"],
  ["src/components/verified-content-explorer.tsx", "verifiedAt", "evidence verification time"],
  ["src/app/(zh)/search/page.tsx", "PROBLEM-SOLVING PATH", "Chinese problem-solving path"],
  ["src/app/(en)/en/search/page.tsx", "Problem-solving path", "English problem-solving path"],
  ["src/components/screeps-diagnostic-center.tsx", "Accepted Runtime Evidence", "diagnostics evidence bridge"],
  ["src/components/screeps-diagnostic-center.tsx", "symptomSearchHref", "diagnostics-to-search bridge"],
];

const failures = [];
for (const [file, needle, label] of checks) {
  const source = fs.readFileSync(file, "utf8");
  if (!source.includes(needle)) failures.push(`${label}: missing ${needle} in ${file}`);
}

const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
if (lock.packages?.["node_modules/nanoid"]?.version !== "3.3.18") {
  failures.push(`nanoid lock must be 3.3.18, found ${lock.packages?.["node_modules/nanoid"]?.version ?? "missing"}`);
}

if (failures.length > 0) {
  console.error("Product Experience V1 gate failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Product Experience V1 gate passed.");
