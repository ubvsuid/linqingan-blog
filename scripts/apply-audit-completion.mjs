import fs from "node:fs";

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function write(filePath, value) {
  fs.writeFileSync(filePath, value);
}

function replaceRequired(source, before, after, label) {
  if (!source.includes(before)) {
    throw new Error(`Unable to apply ${label}: expected source shape not found`);
  }
  return source.replace(before, after);
}

function patchKnowledgePage() {
  const filePath = "src/app/(zh)/knowledge/page.tsx";
  let source = read(filePath);

  if (!source.includes('href: "/tools/room-diagnostics"')) {
    const bodyCalculator = `  {
    eyebrow: "BODY CALCULATOR",
    title: "Creep 身体计算器",
    description: "组合身体部件，计算 Energy 成本、生成时间、携带容量和满载移动速度。",
    href: "/tools/creep-body-calculator",
    count: "已上线",
  },`;
    const roomDiagnostics = `${bodyCalculator}
  {
    eyebrow: "ROOM CHECK",
    title: "房间运行诊断",
    description: "根据 Spawn、角色、Energy、Controller、工地和 CPU 快照生成分级排查建议。",
    href: "/tools/room-diagnostics",
    count: "已上线",
  },`;
    source = replaceRequired(source, bodyCalculator, roomDiagnostics, "room diagnostics knowledge entry");
  }

  source = source.replace(
    `  {
    title: "房间运行诊断清单",
    description: "按 Spawn、Creep、Energy、Controller、工地和 CPU 逐项检查常见问题。",
  },
`,
    "",
  );

  if (!source.includes('className="knowledge-article-list"')) {
    source = replaceRequired(
      source,
      `              </header>
              <ol>
                {section.slugs.map((slug, index) => {`,
      `              </header>
              <details className="knowledge-article-list" open={section.number <= 2}>
                <summary>查看本模块全部 {section.slugs.length} 篇文章</summary>
                <ol>
                  {section.slugs.map((slug, index) => {`,
      "knowledge module disclosure opening",
    );
    source = replaceRequired(
      source,
      `                })}
              </ol>
            </section>`,
      `                  })}
                </ol>
              </details>
            </section>`,
      "knowledge module disclosure closing",
    );
  }

  if (!source.includes(".knowledge-article-list > summary")) {
    source = replaceRequired(
      source,
      `        .knowledge-section ol { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--border); }`,
      `        .knowledge-article-list { border-top: 1px solid var(--border); }
        .knowledge-article-list > summary { display: flex; min-height: 48px; align-items: center; justify-content: space-between; cursor: pointer; list-style: none; color: var(--muted); font-size: 13px; font-weight: 680; }
        .knowledge-article-list > summary::-webkit-details-marker { display: none; }
        .knowledge-article-list > summary::after { content: "展开"; border: 1px solid var(--border); border-radius: 999px; padding: 5px 10px; background: var(--surface); font-size: 11px; font-weight: 600; }
        .knowledge-article-list[open] > summary::after { content: "收起"; }
        .knowledge-article-list ol { border-top: 1px solid var(--border); }
        .knowledge-section ol { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--border); }`,
      "knowledge module disclosure styles",
    );
  }

  write(filePath, source);
}

function patchBlogArchive() {
  const filePath = "src/components/blog-archive.tsx";
  let source = read(filePath);

  if (!source.includes('className="archive-topic-links"')) {
    source = replaceRequired(
      source,
      `        </section>

        <div className="post-list" aria-label={\`文章第 \${currentPage} 页\`}>`,
      `        </section>

        <nav className="archive-topic-links" aria-label="按内容类型浏览">
          <span>按类型浏览</span>
          <Link href="/beginner">新手路线</Link>
          <Link href="/tags/basic-engineering">基础工程</Link>
          <Link href="/tags/common-questions">常见问题</Link>
          <Link href="/tags/debugging">错误排查</Link>
          <Link href="/tags/advanced-development">进阶开发</Link>
          <Link href="/knowledge">专题知识库</Link>
        </nav>

        <div className="post-list" aria-label={\`文章第 \${currentPage} 页\`}>`,
      "blog archive topic links",
    );
  }

  if (!source.includes(".archive-topic-links")) {
    source = replaceRequired(
      source,
      `        @media (max-width: 700px) {`,
      `        .archive-topic-links { display: flex; flex-wrap: wrap; gap: 9px; align-items: center; margin: -14px 0 36px; }
        .archive-topic-links > span { margin-right: 4px; color: var(--muted); font-size: 12px; }
        .archive-topic-links a { border: 1px solid var(--border); border-radius: 999px; padding: 8px 12px; background: var(--surface); font-size: 12px; }
        .archive-topic-links a:hover { border-color: var(--muted); text-decoration: none; }

        @media (max-width: 700px) {`,
      "blog archive topic styles",
    );
  }

  write(filePath, source);
}

function patchSecurityHeaders() {
  const filePath = "next.config.ts";
  let source = read(filePath);

  if (!source.includes("contentSecurityPolicyReportOnly")) {
    source = source.replace(
      `import type { NextConfig } from "next";
`,
      `import type { NextConfig } from "next";

const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://vercel.live",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://assets.vercel.com https://vercel.live",
  "connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com https://vercel.live wss://ws-us3.pusher.com",
  "frame-src https://vercel.live",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");
`,
    );
  }

  if (!source.includes('key: "Content-Security-Policy-Report-Only"')) {
    source = replaceRequired(
      source,
      `  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },`,
      `  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Content-Security-Policy-Report-Only",
    value: contentSecurityPolicyReportOnly,
  },`,
      "CSP report-only header",
    );
  }

  write(filePath, source);
}

function patchSmokeTests() {
  const filePath = "scripts/smoke-test.mjs";
  let source = read(filePath);

  if (!source.includes('["/tools/room-diagnostics", ["房间运行诊断"')) {
    const anchor = '  ["/tools/creep-body-calculator", ["Creep 身体计算器", "选择身体部件", "计算结果", "复制身体数组"]],';
    source = replaceRequired(
      source,
      anchor,
      `${anchor}\n  ["/tools/room-diagnostics", ["房间运行诊断", "使用边界", "CPU 风险"]],`,
      "room diagnostics smoke page",
    );
  }

  if (!source.includes('["/tools/room-diagnostics/opengraph-image", "image/"]')) {
    const anchor = '  ["/tools/creep-body-calculator/opengraph-image", "image/"],';
    source = replaceRequired(
      source,
      anchor,
      `${anchor}\n  ["/tools/room-diagnostics/opengraph-image", "image/"],`,
      "room diagnostics social image smoke check",
    );
  }

  if (!source.includes('  "/tools/room-diagnostics",')) {
    source = replaceRequired(
      source,
      '  "/tools/creep-body-calculator",',
      '  "/tools/creep-body-calculator",\n  "/tools/room-diagnostics",',
      "room diagnostics metadata smoke check",
    );
  }

  if (!source.includes("Content-Security-Policy-Report-Only")) {
    source = replaceRequired(
      source,
      `const searchResponse = await fetch(\`\${baseUrl}/search\`);`,
      `const securityResponse = await fetch(baseUrl);
const cspReportOnly = securityResponse.headers.get("content-security-policy-report-only") ?? "";
if (!cspReportOnly.includes("default-src 'self'") || !cspReportOnly.includes("object-src 'none'")) {
  failures.push("安全响应头: 缺少有效的 Content-Security-Policy-Report-Only");
}

const searchResponse = await fetch(\`\${baseUrl}/search\`);`,
      "CSP smoke check",
    );
  }

  write(filePath, source);
}

patchKnowledgePage();
patchBlogArchive();
patchSecurityHeaders();
patchSmokeTests();
console.log("Knowledge navigation, archive discovery, CSP observation and audit smoke fixes applied.");
