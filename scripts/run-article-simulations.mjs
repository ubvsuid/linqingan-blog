import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

await import("./simulate-core-articles.mjs");

const simulationsDirectory = path.join(
  process.cwd(),
  "scripts",
  "article-simulations",
);

if (!fs.existsSync(simulationsDirectory)) {
  console.log("扩展文章模拟：当前没有额外批次文件。");
  process.exit(0);
}

const files = fs
  .readdirSync(simulationsDirectory)
  .filter((fileName) => fileName.endsWith(".mjs"))
  .sort();

for (const fileName of files) {
  const fileUrl = pathToFileURL(
    path.join(simulationsDirectory, fileName),
  ).href;
  await import(`${fileUrl}?v=${Date.now()}`);
}

console.log(`扩展文章模拟通过：${files.length} 个批次文件。`);
