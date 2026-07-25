import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const replacements = [
  {
    file: "src/lib/english-nuker-launch-17.ts",
    from: "  return `LAUNCH_NUKE_${roomName}_${x}_${y}`;",
    to: "  return 'LAUNCH_NUKE_' + roomName + '_' + x + '_' + y;",
  },
  {
    file: "src/lib/english-rampart-public-17.ts",
    from: "  return `SET_RAMPART_${state}_${roomName}_${x}_${y}`;",
    to: "  return 'SET_RAMPART_' + state + '_' + roomName + '_' + x + '_' + y;",
  },
  {
    file: "scripts/smoke-english-defense-17.mjs",
    from: "  !rampartBody.includes(\"SET_RAMPART_${state}_${roomName}_${x}_${y}\")",
    to: "  !rampartBody.includes(\"'SET_RAMPART_' + state + '_' + roomName + '_' + x + '_' + y\")",
  },
  {
    file: "src/lib/english-nuker-launch-17.ts",
    from: "/en/blog/screeps-memory-write-safety",
    to: "/en/blog/screeps-memory-basics",
  },
];

let changed = 0;
for (const replacement of replacements) {
  const filePath = path.join(root, replacement.file);
  let source = fs.readFileSync(filePath, "utf8");

  if (source.includes(replacement.to)) {
    continue;
  }

  if (!source.includes(replacement.from)) {
    throw new Error(
      `Expected correction source missing in ${replacement.file}: ${replacement.from}`,
    );
  }

  source = source.replace(replacement.from, replacement.to);
  fs.writeFileSync(filePath, source);
  changed += 1;
}

console.log(
  changed > 0
    ? `Applied ${changed} defense batch source corrections.`
    : "Defense batch source corrections already applied.",
);
