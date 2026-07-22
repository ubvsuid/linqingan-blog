import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const fixes = [
  {
    file: "content/posts/screeps-storage-energy-usage.md",
    replacements: [
      [
        "## Storage与Container的职责差异",
        "## Storage 与 Container 的职责差异",
      ],
    ],
  },
  {
    file: "content/posts/screeps-mineral-extractor-harvest.md",
    replacements: [
      [
        "/blog/screeps-lab-reaction-basics",
        "/blog/screeps-lab-run-reaction",
      ],
      [
        "/blog/screeps-terminal-send-resource)",
        "/blog/screeps-terminal-send-resources)",
      ],
    ],
  },
];

let replacementCount = 0;

for (const fix of fixes) {
  const filePath = path.join(root, fix.file);
  let source = fs.readFileSync(filePath, "utf8");

  for (const [before, after] of fix.replacements) {
    if (!source.includes(before)) {
      throw new Error(
        `Expected text not found in ${fix.file}: ${before}`,
      );
    }

    source = source.replace(before, after);
    replacementCount += 1;
  }

  fs.writeFileSync(filePath, source, "utf8");
}

console.log(`Applied ${replacementCount} exact article fixes.`);
