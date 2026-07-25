import fs from "node:fs";
import path from "node:path";

const filePath = path.join(
  process.cwd(),
  "src",
  "lib",
  "english-terminal-send-10.ts",
);

const source = fs.readFileSync(filePath, "utf8");
const corrections = [
  [
    "/en/blog/screeps-storage-energy-usage",
    "/en/blog/screeps-link-transfer-energy",
  ],
  [
    "Use Storage Energy Safely",
    "Transfer Energy Between Links",
  ],
];

let next = source;
for (const [from, to] of corrections) {
  next = next.replaceAll(from, to);
}

if (next === source) {
  if (
    source.includes("/en/blog/screeps-link-transfer-energy")
    && source.includes("Transfer Energy Between Links")
  ) {
    console.log("Market batch ten link correction already applied.");
    process.exit(0);
  }

  throw new Error("Market batch ten link correction target not found.");
}

fs.writeFileSync(filePath, next);
console.log("Applied market batch ten related-guide correction.");
