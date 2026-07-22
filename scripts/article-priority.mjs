import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "content", "posts");
const moduleWeights = new Map([
  ["screeps-controller-activate-safe-mode", 10],
  ["screeps-controller-downgrade", 10],
  ["screeps-reserve-vs-claim-controller", 10],
  ["screeps-flags-config", 8],
  ["screeps-cpu-getused-bucket", 8],
  ["screeps-game-notify", 8],
  ["screeps-room-event-log", 8],
]);

function countInternalLinks(content) {
  return [...content.matchAll(/\[[^\]]+\]\(\/(?!\/)[^)]+\)/g)].length;
}

function estimateReadingMinutes(content) {
  const chinese = content.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const english = content
    .replace(/[\u3400-\u9fff]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(chinese / 400 + english / 220));
}

const rows = fs
  .readdirSync(postsDirectory)
  .filter((fileName) => fileName.endsWith(".md"))
  .map((fileName) => {
    const slug = fileName.replace(/\.md$/, "");
    const source = fs.readFileSync(path.join(postsDirectory, fileName), "utf8");
    const { data, content } = matter(source);
    const verification = data.verification ?? {};
    const internalLinks = countInternalLinks(content);
    const readingMinutes = estimateReadingMinutes(content);
    const lastDate = data.updatedAt ?? data.publishedAt;
    const daysSinceUpdate = Math.max(
      0,
      Math.floor((Date.now() - new Date(`${lastDate}T00:00:00Z`).getTime()) / 86400000),
    );

    let score = moduleWeights.get(slug) ?? 0;
    const reasons = [];
    if (!verification.docsChecked) { score += 20; reasons.push("文档未核对"); }
    if (!verification.syntaxChecked) { score += 15; reasons.push("语法未检查"); }
    if (!verification.consoleTested) { score += 8; reasons.push("Console 待验证"); }
    if (!verification.liveTested) { score += 12; reasons.push("主循环待验证"); }
    if (!verification.testEnvironment) { score += 6; reasons.push("缺少模拟或运行环境说明"); }
    if (internalLinks < 3) { score += 8; reasons.push(`内链仅 ${internalLinks} 条`); }
    if (readingMinutes <= 2) { score += 7; reasons.push("内容较短"); }
    if (daysSinceUpdate > 90) { score += 10; reasons.push("超过 90 天未更新"); }
    else if (daysSinceUpdate > 30) { score += 5; reasons.push("超过 30 天未更新"); }
    if (moduleWeights.has(slug)) reasons.push("内容较少模块");

    return {
      slug,
      title: data.title,
      score,
      internalLinks,
      readingMinutes,
      lastDate,
      reasons,
    };
  })
  .sort((left, right) => right.score - left.score || left.slug.localeCompare(right.slug));

console.log("文章维护优先级（分数越高越先处理）\n");
for (const [index, row] of rows.slice(0, 20).entries()) {
  console.log(
    `${String(index + 1).padStart(2, "0")}. ${row.score} 分 | ${row.title}\n` +
      `    ${row.slug} | ${row.readingMinutes} 分钟 | 更新 ${row.lastDate}\n` +
      `    ${row.reasons.join("；") || "当前无明显维护风险"}`,
  );
}
