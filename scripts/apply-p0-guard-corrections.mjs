import fs from "node:fs";

const constructionPath = "content/posts/screeps-construction-site-progress.md";
let construction = fs.readFileSync(constructionPath, "utf8");
const oldEnvironment = 'testEnvironment: "Node.js 24 离线模拟（普通对象模拟 ConstructionSite 数值）"';
const newEnvironment = 'testEnvironment: "Node.js 24 离线模拟（普通对象模拟 ConstructionSite 数值，不是 Screeps 官方服务器）"';

if (construction.includes(oldEnvironment)) {
  construction = construction.replace(oldEnvironment, newEnvironment);
} else if (!construction.includes(newEnvironment)) {
  throw new Error("Unable to add the ConstructionSite offline evidence disclosure");
}
fs.writeFileSync(constructionPath, construction);

const checkPath = "scripts/content-check.mjs";
let check = fs.readFileSync(checkPath, "utf8");
const oldRequirement = '      "0 到 99",';
const newRequirement = '      "`0` 到 `99`",';

if (check.includes(oldRequirement)) {
  check = check.replace(oldRequirement, newRequirement);
} else if (!check.includes(newRequirement)) {
  throw new Error("Unable to align the RawMemory segment range requirement");
}
fs.writeFileSync(checkPath, check);

console.log("P0 guard corrections applied.");
