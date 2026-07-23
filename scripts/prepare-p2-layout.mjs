import fs from "node:fs";

const filePath = "src/components/creep-body-calculator.tsx";
let source = fs.readFileSync(filePath, "utf8");
const marker = "@media (max-width: 560px) { .body-presets { grid-template-columns: 1fr; } }";

if (!source.includes(marker)) {
  const anchor = "        @media (max-width: 900px) { .body-calculator { grid-template-columns: 1fr; } .body-results { position: static; } }";
  if (!source.includes(anchor)) {
    throw new Error("Unable to prepare P2 calculator mobile layout");
  }
  source = source.replace(anchor, `${anchor}\n        ${marker}`);
  fs.writeFileSync(filePath, source);
}

console.log("P2 calculator mobile layout prepared.");
