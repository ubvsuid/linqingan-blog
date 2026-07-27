import fs from "node:fs";

const articlePath = "src/app/(zh)/blog/[slug]/page.tsx";
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

if (!smoke.includes('/blog/screeps-memory-basics/opengraph-image')) {
  smoke = smoke.replace(
    '  ["/tools/creep-body-calculator/opengraph-image", "image/"],',
    '  ["/tools/creep-body-calculator/opengraph-image", "image/"],\n  ["/blog/screeps-memory-basics/opengraph-image", "image/"],',
  );
}

if (!smoke.includes("const fullIndexResponse")) {
  const auditChecks = [
    'const fullIndexResponse = await fetch(`${baseUrl}/api/search-index`);',
    'if (fullIndexResponse.status !== 200) {',
    '  failures.push(`/api/search-index: 预期 200，实际 ${fullIndexResponse.status}`);',
    '} else {',
    '  try {',
    '    const payload = await fullIndexResponse.json();',
    '    if (!Array.isArray(payload) || payload.length === 0) failures.push("/api/search-index: 应返回非空搜索文档数组");',
    '  } catch {',
    '    failures.push("/api/search-index: 返回内容不是有效 JSON");',
    '  }',
    '}',
    '',
    'const missingResponse = await fetch(`${baseUrl}/audit-page-that-does-not-exist`, { redirect: "manual" });',
    'const missingBody = await missingResponse.text();',
    'if (missingResponse.status !== 404) failures.push(`/404: 预期 404，实际 ${missingResponse.status}`);',
    'if (!missingBody.includes("页面不存在｜临清安")) failures.push("/404: 缺少独立页面标题");',
    'const hasHomeCanonical = missingBody.includes(`rel="canonical" href="https://www.linqingan.com"`) || missingBody.includes(`rel="canonical" href="https://www.linqingan.com/"`);',
    'if (hasHomeCanonical) failures.push("/404: 不应把不存在页面 canonical 到首页");',
  ].join("\n");
  smoke = smoke.replace(
    'const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`);',
    auditChecks + '\n\nconst sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`);',
  );
}

smoke = smoke.replace(
  'for (const requiredPath of ["/verification", "/changelog", "/tools/creep-body-calculator"]) {',
  'for (const requiredPath of ["/verification", "/changelog", "/tools/creep-body-calculator", "/tools/room-diagnostics"]) {',
);

fs.writeFileSync(smokePath, smoke);
console.log("Article image scope, obsolete verification flag and audit smoke expectations corrected.");
