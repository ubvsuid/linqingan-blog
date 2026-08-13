import styles from "./article-quick-answer.module.css";

export function ArticleQuickAnswer({
  text,
  locale = "zh-CN",
}: {
  text: string;
  locale?: "zh-CN" | "en";
}) {
  const isEnglish = locale === "en";

  return (
    <aside
      className={styles.answer}
      aria-label={isEnglish ? "Quick answer" : "快速结论"}
    >
      <span>{isEnglish ? "QUICK ANSWER" : "快速结论"}</span>
      <p className="article-description">{text}</p>
    </aside>
  );
}
