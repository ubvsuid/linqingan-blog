import { getKnowledgeModuleConfigByNumber } from "@/lib/knowledge-module-registry";

import styles from "./knowledge-system-map.module.css";

type Locale = "zh" | "en";

export function KnowledgeSystemMap({ moduleNumber, locale }: { moduleNumber: number; locale: Locale }) {
  const config = getKnowledgeModuleConfigByNumber(moduleNumber)?.systemMap;
  if (!config) return null;
  const isEnglish = locale === "en";

  return (
    <section className={styles.map} aria-labelledby={`system-map-${moduleNumber}-${locale}`}>
      <div className={styles.header}>
        <p className="eyebrow">SYSTEM MAP</p>
        <h2 id={`system-map-${moduleNumber}-${locale}`}>{isEnglish ? config.enTitle : config.zhTitle}</h2>
        <p>{isEnglish ? config.enDescription : config.zhDescription}</p>
      </div>
      <ol className={styles.flow}>
        {config.steps.map((step, index) => (
          <li className={styles.step} key={`${moduleNumber}-${index}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{isEnglish ? step.enLabel : step.zhLabel}</strong>
            <p>{isEnglish ? step.enDetail : step.zhDetail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
