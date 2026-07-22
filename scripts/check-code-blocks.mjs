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
let contextualSnippetCount = 0;

function getSyntaxCandidates(block) {
  const trimmed = block.trim();
  const candidates = [{ source: block, context: "standalone" }];

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    candidates.push({
      source: `const __snippetValue = (${block});\n`,
      context: "object-expression",
    });
  }

  if (/^[A-Za-z_$][\w$]*\s*:/.test(trimmed)) {
    candidates.push({
      source: `const __snippetValue = {\n${block}\n};\n`,
      context: "object-properties",
    });
  }

  if (/\b(?:continue|break)\s*;/.test(block)) {
    candidates.push({
      source: `for (const __snippetItem of []) {\n${block}\n}\n`,
      context: "loop-body",
    });
  }

  return candidates;
}

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
      const candidates = getSyntaxCandidates(block);
      let firstFailure = null;
      let passedContext = null;

      for (const candidate of candidates) {
        const temporaryPath = path.join(
          temporaryDirectory,
          `${fileName.replace(/\.md$/, "")}-${index + 1}-${candidate.context}.js`,
        );
        fs.writeFileSync(temporaryPath, candidate.source, "utf8");
        const result = spawnSync(process.execPath, ["--check", temporaryPath], {
          encoding: "utf8",
        });

        if (result.status === 0) {
          passedContext = candidate.context;
          break;
        }

        if (!firstFailure) {
          firstFailure = (result.stderr || result.stdout).trim();
        }
      }

      if (!passedContext) {
        errors.push(
          `${fileName} 第 ${index + 1} 个 JavaScript 代码块：${firstFailure}`,
        );
      } else if (passedContext !== "standalone") {
        contextualSnippetCount += 1;
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
  `JavaScript 语法检查通过：${articleCount} 篇文章、${blockCount} 个代码块；${loopArticleCount} 篇包含 module.exports.loop；${contextualSnippetCount} 个片段按对象或循环上下文验证。`,
);
console.log("运行行为待 Screeps 环境验证。");
