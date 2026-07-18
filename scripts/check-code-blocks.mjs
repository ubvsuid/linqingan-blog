import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "content", "posts");
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "linqingan-js-check-"));
const errors = [];
let articleCount = 0;
let blockCount = 0;
let loopArticleCount = 0;

try {
  for (const fileName of fs.readdirSync(postsDirectory).filter((name) => name.endsWith(".md")).sort()) {
    const source = fs.readFileSync(path.join(postsDirectory, fileName), "utf8");
    const { content } = matter(source);
    const blocks = [
      ...content.matchAll(/```(?:js|javascript)\s*\n([\s\S]*?)```/g),
    ].map((match) => match[1]);

    if (blocks.length === 0) continue;

    articleCount += 1;
    blockCount += blocks.length;
    if (blocks.some((block) => block.includes("module.exports.loop"))) {
      loopArticleCount += 1;
    }

    blocks.forEach((block, index) => {
      const temporaryPath = path.join(
        temporaryDirectory,
        `${fileName.replace(/\.md$/, "")}-${index + 1}.js`,
      );
      fs.writeFileSync(temporaryPath, block, "utf8");
      const result = spawnSync(process.execPath, ["--check", temporaryPath], {
        encoding: "utf8",
      });

      if (result.status !== 0) {
        errors.push(
          `${fileName} 第 ${index + 1} 个 JavaScript 代码块：${(result.stderr || result.stdout).trim()}`,
        );
      }
    });
  }
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  console.error(`\nJavaScript 代码块检查失败：${errors.length} 个错误。`);
  process.exit(1);
}

console.log(
  `JavaScript 语法检查通过：${articleCount} 篇文章、${blockCount} 个代码块；${loopArticleCount} 篇包含 module.exports.loop。`,
);
console.log("运行行为待 Screeps 环境验证。");

