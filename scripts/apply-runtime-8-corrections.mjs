import fs from "node:fs";
import path from "node:path";

const filePath = path.join(
  process.cwd(),
  "src",
  "lib",
  "english-runtime-global-cache-8.ts",
);

const source = fs.readFileSync(filePath, "utf8");
const invalid = "    `source-ids:${room.name}`,";
const corrected = "    'source-ids:' + room.name,";

if (!source.includes(invalid)) {
  if (source.includes(corrected)) {
    console.log("Runtime batch eight template correction already applied.");
    process.exit(0);
  }

  throw new Error("Runtime batch eight template correction target not found.");
}

fs.writeFileSync(filePath, source.replace(invalid, corrected));
console.log("Applied runtime batch eight template correction.");
