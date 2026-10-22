"use client";

import { useId, useRef, useState } from "react";

import styles from "./reader-feedback.module.css";

type FeedbackLanguage = "zh-CN" | "en";

interface ReaderFeedbackProps {
  title: string;
  pageUrl: string;
  email: string;
  language?: FeedbackLanguage;
}

const articlePilotPaths = new Set([
  "/blog/screeps-introduction",
  "/en/blog/screeps-introduction",
]);

const pilotPaths = new Set([
  ...articlePilotPaths,
  "/tools/room-diagnostics",
  "/en/tools/room-diagnostics",
  "/diagnostics",
  "/en/diagnostics",
]);

function getPageContext(pageUrl: string) {
  try {
    const url = new URL(pageUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    url.search = "";
    url.hash = "";
    return { url: url.toString(), path: url.pathname };
  } catch {
    return null;
  }
}

export function isReaderFeedbackArticlePilot(pageUrl: string): boolean {
  const context = getPageContext(pageUrl);
  return context !== null && articlePilotPaths.has(context.path);
}

const categories = [
  { id: "factual-error", zh: "事实错误", en: "Factual error" },
  { id: "unclear-explanation", zh: "解释不清", en: "Unclear explanation" },
  { id: "functional-issue", zh: "功能问题", en: "Functional issue" },
  { id: "topic-suggestion", zh: "主题建议", en: "Topic suggestion" },
] as const;

const messages = {
  "zh-CN": {
    heading: "反馈与纠错",
    instructions: "选择反馈类型，打开邮件草稿；也可以复制模板到网页版邮箱。请自行确认并发送邮件。",
    recipient: "收件邮箱",
    privacy: "邮件会显示你的发件地址，不是匿名反馈。请勿提供 Token、Room Snapshot、游戏代码、Console 输出或其他个人信息。反馈默认私下处理，公开引用前会征求同意。",
    draft: "打开邮件草稿",
    copy: "复制完整模板",
    template: "完整邮件模板（可选择并手动复制）",
    copied: "模板已复制。请粘贴到邮箱并自行发送。",
    manual: "无法自动复制。请手动复制下方已选中的模板。",
    noScript: "复制按钮需要 JavaScript；仍可手动复制模板或使用邮件链接。",
  },
  en: {
    heading: "Feedback & corrections",
    instructions: "Choose a feedback type to open an email draft, or copy a template into webmail. Review and send the email yourself.",
    recipient: "Email recipient",
    privacy: "Email shows your sender address and is not anonymous. Do not include tokens, room snapshots, game code, Console output, or other personal information. Feedback is handled privately; permission will be requested before quoting it publicly.",
    draft: "Open email draft",
    copy: "Copy full template",
    template: "Full email template (selectable for manual copying)",
    copied: "Template copied. Paste it into your email service and send it yourself.",
    manual: "Automatic copying is unavailable. Copy the selected template below manually.",
    noScript: "The copy button needs JavaScript. You can still copy the template manually or use the email link.",
  },
} as const;

function FeedbackCategory({
  label,
  subject,
  body,
  email,
  language,
}: {
  label: string;
  subject: string;
  body: string;
  email: string;
  language: FeedbackLanguage;
}) {
  const templateId = useId();
  const templateRef = useRef<HTMLTextAreaElement>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "manual">("idle");
  const copy = messages[language];
  const template = language === "en"
    ? `To: ${email}\nSubject: ${subject}\n\n${body}`
    : `收件人：${email}\n主题：${subject}\n\n${body}`;
  const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.replace(/\n/g, "\r\n"))}`;

  async function copyTemplate() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(template);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("manual");
      templateRef.current?.focus();
      templateRef.current?.select();
    }
  }

  return (
    <details className={styles.category}>
      <summary>{label}</summary>
      <div className={styles.categoryBody}>
        <div className={styles.actions}>
          <a href={mailto}>{copy.draft}</a>
          <button type="button" onClick={copyTemplate}>{copy.copy}</button>
        </div>
        <p className={styles.status} role="status" aria-live="polite">
          {copyStatus === "idle" ? "" : copy[copyStatus]}
        </p>
        <label htmlFor={templateId}>{copy.template}</label>
        <textarea
          id={templateId}
          ref={templateRef}
          readOnly
          rows={12}
          value={template}
          spellCheck={false}
        />
      </div>
    </details>
  );
}

export function ReaderFeedback({ title, pageUrl, email, language = "zh-CN" }: ReaderFeedbackProps) {
  const context = getPageContext(pageUrl);
  if (!context || !pilotPaths.has(context.path)) return null;

  const copy = messages[language];
  const isEnglish = language === "en";
  const cleanTitle = title.replace(/[\r\n]+/g, " ").trim();
  const isRoomTool = context.path === "/tools/room-diagnostics" || context.path === "/en/tools/room-diagnostics";

  return (
    <details
      className={`${styles.root}${isRoomTool ? " tool-utility-bar" : ""}`}
      data-reader-feedback="v1"
      lang={language}
    >
      <summary>{copy.heading}</summary>
      <div className={styles.body}>
        <p>{copy.instructions}</p>
        <p>{copy.recipient}： <span className={styles.email}>{email}</span></p>
        <p className={styles.privacy}>{copy.privacy}</p>
        <noscript><p>{copy.noScript}</p></noscript>
        <div className={styles.categories}>
          {categories.map((category) => {
            const label = isEnglish ? category.en : category.zh;
            const subject = isEnglish
              ? `Reader feedback: ${label} — ${cleanTitle}`
              : `读者反馈：${label} — ${cleanTitle}`;
            const body = isEnglish
              ? `Feedback type: ${label}\nPage title: ${cleanTitle}\nCanonical URL: ${context.url}\n\nSpecific location or step:\n\nWhat happened or was unclear:\n\nExpected behavior or suggestion:\n`
              : `反馈类型：${label}\n页面标题：${cleanTitle}\n规范 URL：${context.url}\n\n具体位置或步骤：\n\n遇到的现象或不清楚的内容：\n\n期望或建议：\n`;

            return (
              <FeedbackCategory
                key={category.id}
                label={label}
                subject={subject}
                body={body}
                email={email}
                language={language}
              />
            );
          })}
        </div>
      </div>
    </details>
  );
}
