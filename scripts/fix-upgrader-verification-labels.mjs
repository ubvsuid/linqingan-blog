import fs from "node:fs";

const path = "src/lib/english-beginner-upgrade-controller-override.ts";
let content = fs.readFileSync(path, "utf8");

const replacements = [
  ["[\"upgradeController() range and codes\", \"Checked\"]", "[\"API range and codes\", \"Checked\"]"],
  ["[\"Live multi-tick round trip\", \"Pending\"]", "[\"Live multi-tick test\", \"Pending — one full round trip\"]"],
];

for (const [before, after] of replacements) {
  const matches = content.split(before).length - 1;
  if (matches !== 1) {
    throw new Error(`Expected one occurrence of ${before}, found ${matches}.`);
  }
  content = content.replace(before, after);
}

fs.writeFileSync(path, content);
console.log("Updated Upgrader verification labels for smoke-test compatibility.");
