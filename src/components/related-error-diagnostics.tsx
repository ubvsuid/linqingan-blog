import Link from "next/link";

import {
  getScreepsErrorDiagnosticHref,
  getScreepsErrorDiagnosticsForHref,
  type ScreepsErrorDiagnosticLocale,
} from "@/lib/screeps-error-diagnostics";

import styles from "./related-error-diagnostics.module.css";

export function RelatedErrorDiagnostics({
  href,
  locale,
  variant = "panel",
}: {
  href: string;
  locale: ScreepsErrorDiagnosticLocale;
  variant?: "panel" | "compact";
}) {
  const diagnostics = getScreepsErrorDiagnosticsForHref(href, locale);
  if (diagnostics.length === 0) return null;

  const isEnglish = locale === "en";
  const label = isEnglish ? "Related error diagnostics" : "相关错误诊断";
  const id = `related-errors-${locale}-${href.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`;
  const links = (
    <nav className={styles.links} aria-label={label}>
      {diagnostics.map((diagnostic) => (
        <Link
          key={diagnostic.name}
          href={getScreepsErrorDiagnosticHref(diagnostic.name, locale)}
        >
          <code>{diagnostic.name}</code>
        </Link>
      ))}
    </nav>
  );

  if (variant === "compact") {
    return (
      <div className={styles.compact}>
        <strong>{label}</strong>
        {links}
      </div>
    );
  }

  return (
    <aside className={styles.panel} aria-labelledby={id}>
      <div>
        <p className="eyebrow">DIAGNOSTIC PATHS</p>
        <h2 id={id}>{isEnglish ? "Continue from this context" : "从当前场景继续排查"}</h2>
        <p>
          {isEnglish
            ? "These high-frequency return codes connect this page to the relevant APIs, Object Hubs, checks, tools, and current Runtime Verification status."
            : "这些高频返回码把当前页面连接到相关 API、对象 Hub、排查动作、工具与当前 Runtime Verification 状态。"}
        </p>
      </div>
      {links}
    </aside>
  );
}
