"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import { useCallback, useMemo, useSyncExternalStore } from "react";

import styles from "./article-feedback.module.css";

interface ArticleFeedbackProps {
  slug: string;
  title: string;
  articleUrl: string;
  email: string;
  issueUrl: string;
  language?: "zh-CN" | "en";
  rssHref?: string;
  changelogHref?: string;
}

type FeedbackValue = "helpful" | "partly" | "not-solved" | "outdated" | "suggestion";

function parseFeedback(value: string | null): FeedbackValue | null {
  return value === "helpful"
    || value === "partly"
    || value === "not-solved"
    || value === "outdated"
    || value === "suggestion"
    ? value
    : null;
}

export function ArticleFeedback({
  slug,
  title,
  articleUrl,
  email,
  issueUrl,
  language = "zh-CN",
  rssHref,
  changelogHref,
}: ArticleFeedbackProps) {
  const isEnglish = language === "en";
  const storageKey = `article-feedback:${slug}`;
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const handleStorage = (event: StorageEvent) => {
        if (event.key === storageKey) onStoreChange();
      };
      const handleLocalFeedback = (event: Event) => {
        if (
          event instanceof CustomEvent
          && typeof event.detail === "object"
          && event.detail !== null
          && "slug" in event.detail
          && event.detail.slug === slug
        ) {
          onStoreChange();
        }
      };

      window.addEventListener("storage", handleStorage);
      window.addEventListener("site:article-feedback", handleLocalFeedback);
      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener("site:article-feedback", handleLocalFeedback);
      };
    },
    [slug, storageKey],
  );
  const getSnapshot = useCallback(
    () => parseFeedback(window.localStorage.getItem(storageKey)),
    [storageKey],
  );
  const feedback = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const githubHref = useMemo(() => {
    const body = isEnglish
      ? [
          "## Affected guide",
          articleUrl,
          "",
          "## What did not solve the problem?",
          "Describe the Screeps object, API method, return code, expected behavior, and actual result.",
          "",
          "## Evidence",
          "Paste relevant Console output, tick observations, or a minimal code sample. Remove private tokens or account details.",
        ].join("\n")
      : [
          `文章：${title}`,
          `地址：${articleUrl}`,
          "",
          "问题位置：",
          "",
          "问题描述：",
          "",
          "建议修改：",
        ].join("\n");

    const params = new URLSearchParams({
      title: isEnglish ? `English guide feedback: ${title}` : `文章反馈：${title}`,
      body,
    });

    return `${issueUrl}?${params.toString()}`;
  }, [articleUrl, isEnglish, issueUrl, title]);

  function saveFeedback(value: FeedbackValue) {
    window.localStorage.setItem(storageKey, value);
    window.dispatchEvent(
      new CustomEvent("site:article-feedback", {
        detail: { slug, value },
      }),
    );
    track("article_feedback", {
      slug: slug.slice(0, 80),
      feedback: value,
      language,
    });
  }

  const status = isEnglish
    ? feedback === "helpful"
      ? "Thank you. This guide is marked as helpful."
      : feedback === "partly"
        ? "Recorded. A missing edge case or clearer example may be needed."
        : feedback === "not-solved"
          ? "Recorded. Use the issue link to include the return code, tick state, and minimal code."
          : feedback === "outdated"
            ? "Recorded as potentially outdated. Please include the relevant API or behavior change."
            : feedback === "suggestion"
              ? "Recorded. You can add the example or evidence you want to see in a public issue."
              : "Choose one response to record feedback."
    : feedback === "helpful"
      ? "感谢反馈，我会继续保持这种写法。"
      : feedback === "not-solved"
        ? "已经记录。可以继续提交具体卡住的位置。"
        : feedback === "outdated"
          ? "已经标记为可能过时，建议同时提交对应 API 或版本信息。"
          : feedback === "suggestion" || feedback === "partly"
            ? "已经记录补充建议，可以继续说明希望增加的示例。"
            : "选择一个选项即可完成反馈。";

  return (
    <section className={styles.feedback} aria-labelledby={`article-feedback-title-${slug}`}>
      <div>
        <p className="eyebrow">{isEnglish ? "READER FEEDBACK" : "FEEDBACK"}</p>
        <h2 id={`article-feedback-title-${slug}`}>
          {isEnglish ? "Did this guide solve your problem?" : "这篇文章解决了你的问题吗？"}
        </h2>
        <p className={styles.intro}>
          {isEnglish
            ? "Responses are stored in the current browser and anonymously summarized in site analytics. Technical reports open a public issue with this guide already included."
            : "反馈会匿名汇总到站点分析中，同时保存在当前浏览器。具体错误仍可通过 GitHub 或邮箱提交。"}
        </p>
      </div>

      <div className={styles.actions}>
        <div className={styles.votes} role="group" aria-label={isEnglish ? "Was this guide helpful?" : "文章是否有帮助"}>
          <button type="button" className={feedback === "helpful" ? styles.active : undefined} aria-pressed={feedback === "helpful"} onClick={() => saveFeedback("helpful")}>
            {isEnglish ? "Yes" : "有帮助"}
          </button>
          <button type="button" className={feedback === "partly" || (!isEnglish && feedback === "not-solved") ? styles.active : undefined} aria-pressed={feedback === "partly" || (!isEnglish && feedback === "not-solved")} onClick={() => saveFeedback(isEnglish ? "partly" : "not-solved")}>
            {isEnglish ? "Partly" : "没解决"}
          </button>
          <button type="button" className={feedback === "outdated" ? styles.active : undefined} aria-pressed={feedback === "outdated"} onClick={() => saveFeedback("outdated")}>
            {isEnglish ? "May be outdated" : "内容可能过时"}
          </button>
          {!isEnglish ? (
            <button type="button" className={feedback === "suggestion" ? styles.active : undefined} aria-pressed={feedback === "suggestion"} onClick={() => saveFeedback("suggestion")}>
              建议补充
            </button>
          ) : null}
        </div>

        <p className={styles.status} aria-live="polite">{status}</p>

        <div className={styles.links}>
          <a href={githubHref} target="_blank" rel="noreferrer" onClick={() => { if (isEnglish) saveFeedback("not-solved"); }}>
            {isEnglish ? "No — report the missing case ↗" : "在 GitHub 提交问题 ↗"}
          </a>
          <a href={`mailto:${email}?subject=${encodeURIComponent(isEnglish ? `English guide feedback: ${title}` : `文章反馈：${title}`)}&body=${encodeURIComponent(isEnglish ? `Guide: ${articleUrl}\n\nProblem description:` : `文章：${articleUrl}\n\n问题描述：`)}`}>
            {isEnglish ? "Send private feedback" : "通过邮箱反馈"}
          </a>
        </div>

        {isEnglish && (rssHref || changelogHref) ? (
          <div className={styles.follow} aria-label="Follow English updates">
            {rssHref ? <Link href={rssHref}>Follow English updates via RSS →</Link> : null}
            {changelogHref ? <Link href={changelogHref}>Review meaningful changes →</Link> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
