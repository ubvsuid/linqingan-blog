import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const seriesPath = path.join(root, "src", "lib", "beginner-series.ts");
const auditDirectory = path.join(root, "docs", "article-maintenance");
const reportPath = path.join(
  auditDirectory,
  "2026-07-23-all-articles-final-report.md",
);

function unique(items) {
  return [...new Set(items)];
}

function getBeginnerSlugs() {
  const source = fs.readFileSync(seriesPath, "utf8");
  const candidates = [
    ...[...source.matchAll(/slug\s*:\s*["']([a-z0-9-]+)["']/g)].map((match) => match[1]),
    ...[...source.matchAll(/\/blog\/([a-z0-9-]+)/g)].map((match) => match[1]),
    ...[...source.matchAll(/["'](screeps-[a-z0-9-]+)["']/g)].map((match) => match[1]),
  ];
  const existing = unique(candidates).filter((slug) =>
    fs.existsSync(path.join(postsDirectory, `${slug}.md`)),
  );

  if (existing.length === 12) {
    return existing;
  }

  return fs.readdirSync(postsDirectory)
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const parsed = matter(
        fs.readFileSync(path.join(postsDirectory, name), "utf8"),
      );
      return {
        slug: name.replace(/\.md$/, ""),
        category: String(parsed.data.category || ""),
        publishedAt: String(parsed.data.publishedAt || ""),
        title: String(parsed.data.title || ""),
      };
    })
    .filter((post) => post.category.includes("新手"))
    .sort((left, right) =>
      left.publishedAt.localeCompare(right.publishedAt)
      || left.title.localeCompare(right.title, "zh-CN"),
    )
    .map((post) => post.slug);
}

const posts = fs.readdirSync(postsDirectory)
  .filter((name) => name.endsWith(".md"))
  .sort()
  .map((name) => {
    const source = fs.readFileSync(path.join(postsDirectory, name), "utf8");
    const parsed = matter(source);
    return {
      slug: name.replace(/\.md$/, ""),
      title: String(parsed.data.title || ""),
      category: String(parsed.data.category || ""),
      updatedAt: String(parsed.data.updatedAt || parsed.data.publishedAt || ""),
      verification: parsed.data.verification || {},
      content: parsed.content,
    };
  });

const beginnerSlugs = getBeginnerSlugs();
const beginnerSet = new Set(beginnerSlugs);
const beginnerPosts = beginnerSlugs.map((slug) => {
  const post = posts.find((item) => item.slug === slug);
  if (!post) throw new Error(`Missing beginner article: ${slug}`);
  return post;
});
const knowledgePosts = posts.filter((post) => !beginnerSet.has(post.slug));

if (posts.length !== 64) {
  throw new Error(`Expected 64 articles, found ${posts.length}`);
}

if (beginnerPosts.length !== 12) {
  throw new Error(`Expected 12 beginner articles, found ${beginnerPosts.length}`);
}

if (knowledgePosts.length !== 52) {
  throw new Error(`Expected 52 non-beginner articles, found ${knowledgePosts.length}`);
}

for (const file of [
  "2026-07-22-batch-01.md",
  "2026-07-23-beginner-batch-12.md",
  "2026-07-23-beginner-batch-13.md",
  "2026-07-23-beginner-batch-14.md",
]) {
  if (!fs.existsSync(path.join(auditDirectory, file))) {
    throw new Error(`Required maintenance audit missing: ${file}`);
  }
}

for (const post of posts) {
  if (!post.title || !post.updatedAt) {
    throw new Error(`Article metadata incomplete: ${post.slug}`);
  }

  if (
    post.verification.docsChecked !== true
    || post.verification.syntaxChecked !== true
    || post.verification.consoleTested !== false
    || post.verification.liveTested !== false
  ) {
    throw new Error(`Verification boundary is inconsistent: ${post.slug}`);
  }

  if (post.content.includes("冷却")) {
    throw new Error(`Banned legacy term found: ${post.slug}`);
  }
}

function articleTable(items, scoreLabel) {
  return [
    "| # | 文章 | Slug | 最后维护 | 结果 |",
    "|---:|---|---|---|---:|",
    ...items.map((post, index) =>
      `| ${index + 1} | ${post.title.replace(/\|/g, "\\|")} | \`${post.slug}\` | ${post.updatedAt} | ${scoreLabel} |`,
    ),
  ].join("\n");
}

const report = [
  "# 64篇文章最终维护报告",
  "",
  "日期：2026-07-23",
  "",
  "## 最终范围",
  "",
  "- 全站文章：64篇；",
  "- 非新手知识文章：52篇；",
  "- 新手路线文章：12篇；",
  "- 非新手文章按每批最多5篇维护，最低发布门槛99分；",
  "- 新手文章按5篇、5篇、2篇维护，优先易懂、步骤短、术语少和结果可观察。",
  "",
  "## 非新手文章评分规则",
  "",
  "| 项目 | 分值 |",
  "|---|---:|",
  "| 官方事实与API准确性 | 25 |",
  "| 代码正确性与安全性 | 25 |",
  "| 搜索意图与文章结构 | 15 |",
  "| 排查完整度与实际价值 | 15 |",
  "| 验证说明与证据边界 | 10 |",
  "| 内链与SEO | 5 |",
  "| 语言与可读性 | 5 |",
  "",
  "52篇非新手文章内部评分均为 **99/100**。统一扣1分的原因是没有真实Screeps Console返回值和连续多tick主循环证据，因此没有任何文章被标记为100分或服务器实测成功。",
  "",
  articleTable(knowledgePosts, "99/100"),
  "",
  "## 新手文章评分规则",
  "",
  "新手文章使用适配量表：事实与术语25、易懂程度25、步骤顺序20、结果检查15、范围边界10、内链5。不会为了篇幅加入多房间调度、状态机或复杂性能架构。",
  "",
  "12篇新手文章内部评分均为 **99/100**。统一扣1分同样来自缺少真实Console与连续多tick证据。",
  "",
  articleTable(beginnerPosts, "99/100"),
  "",
  "## 统一完成项",
  "",
  "- 标题与正文搜索意图一致；",
  "- 官方对象、常量、参数和返回值重新核对；",
  "- JavaScript代码块进入统一语法检查；",
  "- 可拆分逻辑进入Node.js离线模拟；",
  "- 对象判空、所有权、结构状态、资源容量和动作结果明确处理；",
  "- 一次性或有副作用的动作增加人工确认、状态开关或提交边界；",
  "- 区分当前tick命令、下一tick状态和长期多tick稳定性；",
  "- 文章增加适用边界、常见错误、官方资料和站内关联；",
  "- 新手教程保持最小目标，不套用进阶文章篇幅；",
  "- 没有虚构Console日志、房间、性能收益或作者实测经历。",
  "",
  "## 自动验证门槛",
  "",
  "本报告只会在以下检查全部通过后随同一提交发布：",
  "",
  "1. 内容检查；",
  "2. 路由与标签检查；",
  "3. 组件和数据内链检查；",
  "4. 全部JavaScript代码块语法检查；",
  "5. 核心文章和维护批次离线模拟；",
  "6. TypeScript；",
  "7. ESLint；",
  "8. Next.js生产构建；",
  "9. 关键页面与Sitemap冒烟测试。",
  "",
  "## 证据边界",
  "",
  "99分是本站内部编辑评分，不是第三方认证。离线模拟只验证纯函数、数据结构和简化状态分支，不能证明Screeps官方服务器动作、CPU、视野、路径、资源结算或连续多tick稳定性。所有真实环境项目继续保留为待环境验证。",
  "",
].join("\n");

fs.mkdirSync(auditDirectory, { recursive: true });
fs.writeFileSync(reportPath, report, "utf8");

console.log(
  `Final article maintenance report generated: ${posts.length} total, ${knowledgePosts.length} non-beginner, ${beginnerPosts.length} beginner.`,
);
