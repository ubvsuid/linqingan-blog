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
  const symptomLabel = isEnglish
    ? experience.symptoms.length === 1
      ? "symptom"
      : "symptoms"
    : "症状";
  const facets = [
    {
      key: "learn",
      label: "LEARN",
      title: isEnglish ? "Learn this system in order" : "按系统顺序学习",
      description: isEnglish
        ? `${experience.articleCount} primary guides are organized into ${experience.stageCount} learning stages. Start from the first guide before jumping into isolated errors.`
        : `${experience.articleCount} 篇主指南已经按 ${experience.stageCount} 个学习阶段组织。先建立完整系统认识，再进入单点错误。`,
      links: [experience.firstGuide],
    },
    {
      key: "build",
      label: "BUILD",
      title: isEnglish ? "Turn constraints into a plan" : "把约束变成可执行方案",
      description: isEnglish
        ? "Use the graph-related tools to turn capacity, timing, and resource constraints into an executable plan before they become runtime failures."
        : "用 Graph 关联工具把容量、节奏与资源约束变成可执行方案，在它们演变成 Runtime 故障之前先做规划。",
      links: experience.tools,
    },
    {
      key: "solve",
      label: "SOLVE",
      title: isEnglish ? "Diagnose the failure path" : "定位故障路径",
      description: isEnglish
        ? "Start from the canonical diagnostic symptoms for this cluster, then move into the deterministic Resolver when a guided branch-by-branch check is useful."
        : "先从这个 Cluster 的 canonical 诊断症状进入排查，再在需要逐步判断时进入 deterministic Resolver。",
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
        ? "Use the related Tick Lab experiment to inspect modeled return values and tick boundaries, while keeping modeled results separate from accepted Runtime Evidence."
        : "用关联的 Tick Lab 实验检查模型化返回值和 tick 边界，并继续把 modeled result 与 accepted Runtime Evidence 严格区分。",
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
            ? `${experience.title}: one problem space, five ways to work with it`
            : `${experience.title}：同一个问题空间，五种工作方式`}
        </h2>
        <p>
          {experience.description}{" "}
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
        {isEnglish ? "Graph-related surface" : "Graph 关联面"}: {experience.apis.length} API · {experience.symptoms.length} {symptomLabel} · {experience.tools.length} {isEnglish ? "tools" : "工具"} · {experience.experiments.length} Tick Lab · {experience.returnCodeCount} ReturnCode
      </p>
    </section>
  );
}
