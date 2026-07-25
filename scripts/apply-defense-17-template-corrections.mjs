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
      `Expected template snippet missing in ${replacement.file}`,
    );
  }

  source = source.replace(replacement.from, replacement.to);
  fs.writeFileSync(filePath, source);
  changed += 1;
}

console.log(
  changed > 0
    ? `Applied ${changed} defense batch template-string corrections.`
    : "Defense batch template-string corrections already applied.",
);
