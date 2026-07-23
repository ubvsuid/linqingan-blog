import fs from "node:fs";

const articlePath = "src/app/blog/[slug]/page.tsx";
let article = fs.readFileSync(articlePath, "utf8");
const articleUrlAnchor = '  const articleUrl = `${siteConfig.url}/blog/${post.slug}`;';
const articleUrlReplacement = `${articleUrlAnchor}\n  const socialImage = post.cover ?? \`\${siteConfig.url}/blog/\${post.slug}/opengraph-image\`;`;

if (!article.includes(articleUrlReplacement)) {
  if (!article.includes(articleUrlAnchor)) {
    throw new Error("Unable to scope article social image");
  }
  article = article.replace(articleUrlAnchor, articleUrlReplacement);
}

article = article.replace(
  `  const hasRuntimeVerification =
    post.verification.consoleTested || post.verification.liveTested;
`,
  "",
);
fs.writeFileSync(articlePath, article);

const smokePath = "scripts/smoke-test.mjs";
let smoke = fs.readFileSync(smokePath, "utf8");
smoke = smoke
  .replace('"已经遇到问题？"', '"常用查询工具"')
  .replaceAll('"验证状态"', '"查看验证详情"')
  .replaceAll('"离线验证环境"', '"测试环境"');
fs.writeFileSync(smokePath, smoke);

console.log("Article image scope, obsolete verification flag and smoke expectations corrected.");
