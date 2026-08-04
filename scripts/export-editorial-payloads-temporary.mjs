import fs from "node:fs";
import { gunzipSync } from "node:zlib";

const targets = [
  [
    "ENERGY_CONTROL",
    "src/lib/english-editorial-energy-control-20260803.ts",
  ],
  [
    "RECOVERY_STORAGE_BUILD",
    "src/lib/english-editorial-recovery-storage-build-20260803.ts",
  ],
];

for (const [label, filePath] of targets) {
  const source = fs.readFileSync(filePath, "utf8");
  const start = source.indexOf("const encodedArticleChunks = [");
  const end = source.indexOf("\n];", start);

  if (start === -1 || end === -1) {
    throw new Error(`Encoded payload not found in ${filePath}`);
  }

  const arraySource = source.slice(start, end);
  const chunks = [...arraySource.matchAll(/^\s*"([A-Za-z0-9+/=]+)",?$/gm)].map(
    (match) => match[1],
  );

  if (chunks.length === 0) {
    throw new Error(`Encoded chunks not found in ${filePath}`);
  }

  const decoded = gunzipSync(
    Buffer.from(chunks.join(""), "base64"),
  ).toString("utf8");

  JSON.parse(decoded);

  console.log(`BEGIN_${label}_PAYLOAD_BASE64`);
  console.log(Buffer.from(decoded, "utf8").toString("base64"));
  console.log(`END_${label}_PAYLOAD_BASE64`);
}
