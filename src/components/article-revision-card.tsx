import Link from "next/link";

import { getArticleRevision } from "@/lib/article-revisions";
import { formatDate } from "@/lib/date";

export function ArticleRevisionCard({ slug }: { slug: string }) {
  const revision = getArticleRevision(slug);
  if (!revision) return null;

  return (
    <aside className="article-revision" aria-labelledby={`article-revision-${slug}`}>
      <div>
        <p className="eyebrow">REVISION NOTE</p>
        <h2 id={`article-revision-${slug}`}>本次为什么修改</h2>
        <time dateTime={revision.date}>{formatDate(revision.date)}</time>
      </div>
      <div>
        <p>{revision.reason}</p>
        <ul>
          {revision.details.map((detail) => <li key={detail}>{detail}</li>)}
        </ul>
        <Link href="/changelog">查看网站更新日志 →</Link>
      </div>
      <style>{`
        .article-revision { display: grid; grid-template-columns: minmax(180px, .5fr) minmax(0, 1.5fr); gap: 36px; margin: 34px 0 0; border: 1px solid var(--border); border-radius: 20px; padding: clamp(22px, 4vw, 34px); background: var(--surface); }
        .article-revision h2 { margin: 8px 0 10px; font-size: clamp(25px, 4vw, 34px); letter-spacing: -.035em; }
        .article-revision time { color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 12px; }
        .article-revision > div:last-child > p { margin: 0; font-weight: 650; line-height: 1.65; }
        .article-revision ul { margin: 16px 0 0; padding-left: 20px; color: var(--muted); line-height: 1.7; }
        .article-revision a { display: inline-flex; margin-top: 18px; font-weight: 700; }
        @media (max-width: 720px) { .article-revision { grid-template-columns: 1fr; gap: 20px; } }
      `}</style>
    </aside>
  );
}
