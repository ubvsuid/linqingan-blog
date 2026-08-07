import Link from "next/link";

import { Container } from "@/components/container";
import { beginnerSeriesSlugs, beginnerStages } from "@/lib/beginner-series";
import { knowledgeBaseSections, knowledgeBaseSlugs } from "@/lib/knowledge-base";
import { createPageMetadata } from "@/lib/metadata";
import { getAllPosts } from "@/lib/posts";
import { getSearchDocuments } from "@/lib/search";
import { screepsErrorCodes } from "@/lib/screeps-errors";
import { screepsGlossary } from "@/lib/screeps-glossary";
import { siteConfig } from "@/lib/site";
import { getTagRecords } from "@/lib/tags";

import styles from "./knowledge.module.css";

export const metadata = createPageMetadata({
  title: "Screeps 知识库",
  description:
    "从 Screeps 新手路线进入 8 个专题模块，并查询术语、错误码、标签、验证方法、房间诊断、Creep 身体计算器和全部站内内容。",
  path: "/knowledge",
});

const referenceTools = [
  {
    eyebrow: "ROOM DIAGNOSTICS",
    title: "房间运行诊断",
    description: "按 Spawn、角色、Energy、Controller、工地和 CPU 快照定位常见风险。",
    href: "/tools/room-diagnostics",
    count: "已上线",
  },
  {
    eyebrow: "BODY CALCULATOR",
    title: "Creep 身体计算器",
    description: "组合身体部件，计算 Energy 成本、生成时间、携带容量和满载移动速度。",
    href: "/tools/creep-body-calculator",
    count: "已上线",
  },
  {
    eyebrow: "SEARCH",
    title: "站内搜索",
    description: "同时搜索文章正文、知识模块、术语、错误码、工具和公开建设说明。",
    href: "/search",
    count: `${getSearchDocuments().length} 条内容`,
  },
  {
    eyebrow: "GLOSSARY",
    title: "Screeps 术语表",
    description: "用新手能理解的方式解释 Creep、Spawn、Memory、RCL 等常见概念。",
    href: "/glossary",
    count: `${screepsGlossary.length} 个术语`,
  },
  {
    eyebrow: "ERROR CODES",
    title: "错误码查询",
    description: "查询 ERR_NOT_IN_RANGE、ERR_FULL、ERR_INVALID_TARGET 等返回值的原因与处理方式。",
    href: "/screeps-errors",
    count: `${screepsErrorCodes.length} 个返回值`,
  },
  {
    eyebrow: "TAGS",
    title: "文章标签",
    description: "按照 Creep、JavaScript、Spawn、Builder 等主题浏览已发布内容。",
    href: "/tags",
    count: `${getTagRecords().length} 个标签`,
  },
  {
    eyebrow: "VERIFICATION",
    title: "文章验证方法",
    description: "了解文档核对、语法检查、离线模拟、Console 与真实主循环验证的区别。",
    href: "/verification",
    count: "5 种验证状态",
  },
];

export default function KnowledgePage() {
  const allPosts = getAllPosts();
  const postsBySlug = new Map(allPosts.map((post) => [post.slug, post]));
  const pageUrl = `${siteConfig.url}/knowledge`;
  const itemListEntries = [
    { name: "Screeps 新手入门", url: `${siteConfig.url}/beginner` },
    ...knowledgeBaseSections.map((section) => ({
      name: section.title,
      url: `${siteConfig.url}/knowledge/${section.id}`,
    })),
    ...referenceTools.map((tool) => ({
      name: tool.title,
      url: `${siteConfig.url}${tool.href}`,
    })),
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Screeps 知识库",
        description: "Screeps 中文新手路线、专题模块、术语、错误码、验证方法和实用工具入口。",
        url: pageUrl,
        inLanguage: "zh-CN",
        mainEntity: { "@id": `${pageUrl}#items` },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#items`,
        numberOfItems: itemListEntries.length,
        itemListElement: itemListEntries.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          url: item.url,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "知识库", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell knowledge-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Container>
        <header className={`page-header ${styles.header}`}>
          <p className="eyebrow">SCREEPS KNOWLEDGE BASE</p>
          <h1>Screeps 知识库</h1>
          <p>
            第一次接触 Screeps，先按顺序完成新手路线；已经遇到具体 API、报错或系统问题时，进入对应专题模块，或直接使用查询工具。
          </p>
          <div className={styles.stats} aria-label="知识库数据">
            <span><strong>{beginnerSeriesSlugs.length}</strong> 篇新手路线</span>
            <span><strong>{knowledgeBaseSlugs.length}</strong> 篇专题文章</span>
            <span><strong>{knowledgeBaseSections.length}</strong> 个独立模块</span>
          </div>
          <Link className={styles.allPosts} href="/blog">
            浏览全部 {allPosts.length} 篇文章 →
          </Link>
        </header>

        <section className={styles.beginner} aria-labelledby="knowledge-beginner-title">
          <div>
            <p className="eyebrow">BEGINNER PATH</p>
            <h2 id="knowledge-beginner-title">从零开始的新手模块</h2>
            <p className={styles.beginnerCopy}>
              从认识游戏界面和 tick 开始，逐步完成采集、运输、角色分工、Controller 升级、Extension、建造维修与第一份房间基础代码。
            </p>
            <Link href="/beginner">开始 {beginnerSeriesSlugs.length} 篇新手路线 →</Link>
          </div>
          <ol className={styles.stageList}>
            {beginnerStages.map((stage) => (
              <li key={stage.id}>
                <span>{String(stage.number).padStart(2, "0")}</span>
                <div><strong>{stage.title}</strong><small>{stage.slugs.length} 篇</small></div>
              </li>
            ))}
          </ol>
        </section>

        <section id="reference-tools" className={styles.reference} aria-labelledby="knowledge-reference-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className="eyebrow">REFERENCE &amp; TOOLS</p>
              <h2 id="knowledge-reference-title">查询与工具</h2>
            </div>
            <p>文章用于连续学习；这些入口用于遇到具体名词、返回值、身体配置或代码问题时快速定位。</p>
          </div>

          <div className={styles.referenceGrid}>
            {referenceTools.map((item) => (
              <Link href={item.href} key={item.href}>
                <span className="eyebrow">{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className={styles.referenceMeta}><span>{item.count}</span><strong aria-hidden="true">→</strong></div>
              </Link>
            ))}
          </div>

          <div className={styles.apiRoadmap}>
            <div>
              <strong>常用 Screeps API 快速查询</strong>
              <p>下一阶段会把常用对象、方法、参数和返回值整理成独立查询入口；上线前仍以官方文档和已验证文章为准。</p>
            </div>
            <Link href="/search?q=API">先搜索现有 API 内容 →</Link>
          </div>
        </section>

        <div className={styles.modulesHeading}>
          <div>
            <p className="eyebrow">TOPIC MODULES</p>
            <h2>选择你要解决的问题</h2>
          </div>
          <p>知识库首页只展示每个模块的代表文章，完整顺序放在模块页，减少首屏和服务器 HTML 体积。</p>
        </div>

        <nav className={styles.jump} aria-label="知识库主题导航">
          {knowledgeBaseSections.map((section) => (
            <Link key={section.id} href={`#${section.id}`}>
              {String(section.number).padStart(2, "0")} · {section.title}
            </Link>
          ))}
        </nav>

        <div className={styles.moduleList}>
          {knowledgeBaseSections.map((section) => {
            const previewPosts = section.slugs
              .slice(0, 3)
              .map((slug) => postsBySlug.get(slug))
              .filter((post): post is NonNullable<typeof post> => Boolean(post));

            return (
              <section key={section.id} id={section.id} className={styles.module}>
                <header className={styles.moduleHeader}>
                  <span className={styles.moduleNumber}>{String(section.number).padStart(2, "0")}</span>
                  <div>
                    <div className={styles.moduleTitleRow}>
                      <h2><Link href={`/knowledge/${section.id}`}>{section.title}</Link></h2>
                      <small>{section.slugs.length} 篇 · {section.stages.length} 个阶段</small>
                    </div>
                    <p className={styles.moduleDescription}>{section.description}</p>
                  </div>
                </header>

                <ol className={styles.previewList} aria-label={`${section.title}代表文章`}>
                  {previewPosts.map((post, index) => (
                    <li key={post.slug}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <Link href={`/blog/${post.slug}`}>
                        <strong>{post.title}</strong>
                        <small>{post.category} · {post.readingMinutes} 分钟</small>
                      </Link>
                    </li>
                  ))}
                </ol>

                <div className={styles.moduleFooter}>
                  <Link href={`/knowledge/${section.id}`}>查看本模块全部 {section.slugs.length} 篇 →</Link>
                </div>
              </section>
            );
          })}
        </div>
      </Container>
    </main>
  );
}
