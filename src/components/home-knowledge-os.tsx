import Link from "next/link";

import styles from "./home-knowledge-os.module.css";

type Locale = "zh" | "en";

type ProductPath = {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

const COPY = {
  zh: {
    title: "把学习、构建、排错与验证连成一个系统",
    description:
      "linqingan.com 不再只是文章列表。教程负责建立模型，API 与工具负责构建，Resolver 与 Doctor 负责排错，Runtime Evidence 负责验证结论。",
    doctorEyebrow: "DIAGNOSTIC ASSISTANT",
    doctorTitle: "遇到问题，先让 Doctor 收集正确的证据",
    doctorDescription:
      "当前 Doctor 支持 Spawn 不工作、Creep 不移动、Creep 不采集。Doctor 只解析受控的只读 Snapshot，数据留在浏览器本地；无法直接证明的原因会交回 canonical Resolver。",
    doctorAction: "打开 Screeps Doctor",
    diagnosticsAction: "查看全部诊断问题",
    symptomsLabel: "当前 Doctor 切片",
    localBoundary: "本地解析 · 不需要 Screeps Token · 不执行游戏动作",
  },
  en: {
    title: "Connect learning, building, debugging, and verification",
    description:
      "Linqingan is more than a guide library. Tutorials build the model, APIs and tools help you build, Resolver and Doctor help you debug, and Runtime Evidence verifies what the system can actually prove.",
    doctorEyebrow: "DIAGNOSTIC ASSISTANT",
    doctorTitle: "Start with Doctor when you do not know what evidence to collect",
    doctorDescription:
      "Doctor currently supports Spawn not working, Creep not moving, and Creep not harvesting. It parses bounded read-only Snapshots locally in the browser and hands anything unproven back to the canonical Resolver.",
    doctorAction: "Open Screeps Doctor",
    diagnosticsAction: "Browse all diagnostic symptoms",
    symptomsLabel: "Current Doctor slices",
    localBoundary: "Local parsing · no Screeps token · no game actions",
  },
} as const;

function getProductPaths(locale: Locale): ProductPath[] {
  const prefix = locale === "en" ? "/en" : "";
  if (locale === "en") {
    return [
      {
        eyebrow: "LEARN",
        title: "Understand the system",
        description: "Follow the beginner roadmap or jump into a structured knowledge module instead of reading by publication date.",
        primaryLabel: "Beginner roadmap",
        primaryHref: `${prefix}/beginner`,
        secondaryLabel: "Knowledge map",
        secondaryHref: `${prefix}/knowledge`,
      },
      {
        eyebrow: "BUILD",
        title: "Write with references and tools",
        description: "Move from API contracts to calculators and planners before changing colony code.",
        primaryLabel: "Screeps API",
        primaryHref: `${prefix}/screeps-api`,
        secondaryLabel: "Tools",
        secondaryHref: `${prefix}/tools`,
      },
      {
        eyebrow: "SOLVE",
        title: "Diagnose from symptoms and evidence",
        description: "Use Doctor for a bounded Snapshot, then continue through deterministic Resolver and Diagnostics paths.",
        primaryLabel: "Screeps Doctor",
        primaryHref: `${prefix}/resolver#screeps-doctor`,
        secondaryLabel: "Diagnostics",
        secondaryHref: `${prefix}/diagnostics`,
      },
      {
        eyebrow: "VERIFY",
        title: "Separate claims from runtime proof",
        description: "Check documentation, offline, Console, and live-room evidence without treating them as the same level of proof.",
        primaryLabel: "Verification",
        primaryHref: `${prefix}/verification`,
        secondaryLabel: "Verified archive",
        secondaryHref: `${prefix}/verified`,
      },
    ];
  }

  return [
    {
      eyebrow: "LEARN",
      title: "Learn",
      description: "按新手路线建立基础，或直接进入按系统组织的知识模块，不再按发布时间翻文章。",
      primaryLabel: "新手路线",
      primaryHref: "/beginner",
      secondaryLabel: "知识地图",
      secondaryHref: "/knowledge",
    },
    {
      eyebrow: "BUILD",
      title: "Build",
      description: "从 API contract 进入计算器与规划工具，在真正修改 colony 代码之前先把边界算清楚。",
      primaryLabel: "Screeps API",
      primaryHref: "/screeps-api",
      secondaryLabel: "工具中心",
      secondaryHref: "/tools",
    },
    {
      eyebrow: "SOLVE",
      title: "Solve",
      description: "先用 Doctor 收集受控 Snapshot，再进入 deterministic Resolver 与 Diagnostics 继续定位。",
      primaryLabel: "Screeps Doctor",
      primaryHref: "/resolver#screeps-doctor",
      secondaryLabel: "诊断中心",
      secondaryHref: "/diagnostics",
    },
    {
      eyebrow: "VERIFY",
      title: "Verify",
      description: "把官方文档、离线检查、Console 实测和 live-room 证据分开，不用推断冒充运行事实。",
      primaryLabel: "验证方法",
      primaryHref: "/verification",
      secondaryLabel: "最近验证",
      secondaryHref: "/verified",
    },
  ];
}

const SYMPTOMS = {
  zh: ["Spawn 不工作", "Creep 不移动", "Creep 不采集"],
  en: ["Spawn not working", "Creep not moving", "Creep not harvesting"],
} as const;

export function HomeKnowledgeOs({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  const prefix = locale === "en" ? "/en" : "";
  const productPaths = getProductPaths(locale);

  return (
    <section className={`${styles.section} ${locale === "zh" ? styles.editorial : ""}`} aria-labelledby={`knowledge-os-title-${locale}`}>
      <header className={styles.heading}>
        <div>
          <p className="eyebrow">SCREEPS KNOWLEDGE OS</p>
          <h2 id={`knowledge-os-title-${locale}`}>{copy.title}</h2>
        </div>
        <p>{copy.description}</p>
      </header>

      <div className={styles.pathGrid}>
        {productPaths.map((item, index) => (
          <article className={styles.pathCard} key={item.eyebrow}>
            <div className={styles.pathTopline}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p className="eyebrow">{item.eyebrow}</p>
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <div className={styles.pathLinks}>
              <Link href={item.primaryHref}>{item.primaryLabel} →</Link>
              <Link href={item.secondaryHref}>{item.secondaryLabel}</Link>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.doctorPanel}>
        <div className={styles.doctorCopy}>
          <p className="eyebrow">{copy.doctorEyebrow}</p>
          <h3>{copy.doctorTitle}</h3>
          <p>{copy.doctorDescription}</p>
          <small>{copy.localBoundary}</small>
        </div>
        <div className={styles.doctorActions}>
          <span>{copy.symptomsLabel}</span>
          <div className={styles.symptoms} aria-label={copy.symptomsLabel}>
            {SYMPTOMS[locale].map((symptom) => <code key={symptom}>{symptom}</code>)}
          </div>
          <div className={styles.actionLinks}>
            <Link className={styles.primaryAction} href={`${prefix}/resolver#screeps-doctor`}>{copy.doctorAction} →</Link>
            <Link href={`${prefix}/diagnostics`}>{copy.diagnosticsAction}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
