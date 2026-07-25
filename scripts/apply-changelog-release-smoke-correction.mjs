import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const smokePath = path.join(root, "scripts", "smoke-test.mjs");
const oldLine = '  ["/changelog", ["更新日志", "新增独立更新日志", "合并资料中心与项目页面"]],';
const newLines = [
  '  ["/changelog", ["更新日志", "完成 64 篇 Screeps 英文文章库与来源覆盖", "新增独立更新日志"]],',
  '  ["/changelog/page/2", ["更新日志", "合并资料中心与项目页面"]],',
].join("\n");

let source = fs.readFileSync(smokePath, "utf8");

if (source.includes(newLines)) {
  console.log("Changelog release smoke correction already applied.");
  process.exit(0);
}

if (!source.includes(oldLine)) {
  throw new Error("Expected Changelog smoke assertion was not found.");
}

source = source.replace(oldLine, newLines);
fs.writeFileSync(smokePath, source);

console.log("Applied Changelog release pagination smoke correction.");
