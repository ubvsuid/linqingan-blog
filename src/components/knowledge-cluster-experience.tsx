import Link from "next/link";

import { getKnowledgeClusterExperienceByModuleNumber } from "@/lib/knowledge-cluster-experience";

import styles from "./knowledge-cluster-experience.module.css";

type Locale = "zh" | "en";

interface KnowledgeClusterExperienceProps {
  moduleNumber: number;
  locale: Locale;
}

export function KnowledgeClusterExperience({
  moduleNumber,
  locale,
}: KnowledgeClusterExperienceProps) {
  const experience = getKnowledgeClusterExperienceByModuleNumber(
    moduleNumber,
    locale,
  );
  if (!experience) return null;

  const isEnglish = locale === "en";
  const prefix = isEnglish ? "/en" : "";
  const facets = [
    {
      key: "learn",
      label: "LEARN",
      title: isEnglish ? "Learn the lifecycle in order" : "按生命周期顺序学习",
      description: isEnglish
        ? `${experience.articleCount} primary guides are organized into ${experience.stageCount} learning stages. Start from the first guide before jumping into isolated errors.`
        : `${experience.articleCount} 篇主指南已经按 ${experience.stageCount} 个学习阶段组织。先建立完整生命周期，再进入单点错误。`,
      links: [experience.firstGuide],
    },
    {
      key: "build",
      label: "BUILD",
      title: isEnglish ? "Turn constraints into a plan" : "把约束变成可执行方案",
      description: isEnglish
        ? "Use the graph-related tools to size bodies, estimate Spawn capacity, and plan replacements before production pressure becomes a failure."
        : "用 Graph 关联工具计算 Body、Spawn 容量与替换节奏，在生产压力真正变成故障之前先做规划。",
      links: experience.tools,
    },
    {
      key: "solve",
      label: "SOLVE",
      title: isEnglish ? "Diagnose why spawning stopped" : "定位为什么 Spawn 停止生产",
      description: isEnglish
        ? "Start from the canonical Spawn symptom, then move into the deterministic Resolver when you need a guided branch-by-branch check."
        : "先从 canonical Spawn 症状进入诊断，再在需要逐步判断时进入 deterministic Resolver。",
      links: [
        ...experience.symptoms,
        {
          href: `${prefix}/resolver`,
          label: isEnglish ? "Problem Resolver" : "问题解决器",
          meta: isEnglish ? "Guided deterministic flow" : "确定性引导流程",
        },
      ],
    },
    {
      key: "verify",
      label: "VERIFY",
      title: isEnglish ? "Verify the runtime model" : "验证 Runtime 行为模型",
      description: isEnglish
        ? "Use the Spawn Tick Lab experiment to inspect modeled return values and tick boundaries, then keep modeled results separate from accepted Runtime Evidence."
        : "用 Spawn Tick Lab 检查模型化返回值和 tick 边界，并继续把 modeled result 与 accepted Runtime Evidence 严格区分。",
      links: [
        ...experience.experiments,
        {
          href: `${prefix}/verification`,
          label: isEnglish ? "Runtime Evidence" : "Runtime Evidence 验证中心",
          meta: isEnglish ? "Evidence boundary" : "证据边界",
        },
      ],
    },
    {
      key: "explore",
      label: "EXPLORE",
      title: isEnglish ? "Explore APIs and return codes" : "继续查询 API 与返回码",
      description: isEnglish
        ? `The current explicit graph surface connects this cluster to ${experience.apis.length} APIs and ${experience.returnCodeCount} return-code nodes.`
        : `当前显式 Graph surface 已把这个 Cluster 连接到 ${experience.apis.length} 个 API 与 ${experience.returnCodeCount} 个 ReturnCode 节点。`,
      links: [
        ...experience.apis,
        {
          href: `${prefix}/screeps-errors`,
          label: isEnglish
            ? `${experience.returnCodeCount} related return codes`
            : `${experience.returnCodeCount} 个相关返回码`,
          meta: isEnglish ? "Error reference" : "错误码参考",
        },
      ],
    },
  ] as const;

  return (
    <section
      className={styles.experience}
      aria-labelledby={`cluster-experience-${experience.clusterId}-${locale}`}
    >
      <header className={styles.header}>
        <p className="eyebrow">KNOWLEDGE CLUSTER · DEMONSTRATOR</p>
        <h2 id={`cluster-experience-${experience.clusterId}-${locale}`}>
          {isEnglish
            ? "One Spawn problem space, five ways to work with it"
            : "同一个 Spawn 问题空间，五种工作方式"}
        </h2>
        <p>
          {isEnglish
            ? "The learning module remains the primary article owner. This layer only connects that same durable cluster to graph-derived tools, diagnostics, experiments, APIs, and return codes."
            : "学习模块继续拥有文章主归属；这一层只把同一个 durable Cluster 连接到 Graph 派生的工具、诊断、实验、API 与返回码，不创建第二套内容真值。"}
        </p>
      </header>

      <div className={styles.grid}>
        {facets.map((facet, index) => (
          <article className={styles.card} key={facet.key}>
            <div className={styles.cardHeader}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p className="eyebrow">{facet.label}</p>
            </div>
            <h3>{facet.title}</h3>
            <p>{facet.description}</p>
            <div className={styles.links}>
              {facet.links.slice(0, 4).map((link) => (
                <Link href={link.href} key={`${facet.key}-${link.href}`}>
                  <strong>{link.label}</strong>
                  <small>{link.meta}</small>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>

      <p className={styles.summary}>
        {isEnglish ? "Graph-related surface" : "Graph 关联面"}: {experience.apis.length} API · {experience.symptoms.length} {isEnglish ? "symptom" : "症状"} · {experience.tools.length} {isEnglish ? "tools" : "工具"} · {experience.experiments.length} Tick Lab · {experience.returnCodeCount} ReturnCode
      </p>
    </section>
  );
}
