import Link from "next/link";

import { getRecentArticleRevisions } from "@/lib/article-revisions";
import { changelogEntries } from "@/lib/changelog";
import { getAllPosts } from "@/lib/posts";

const popularQuestions = [
  {
    label: "Creep 不动",
    href: "/blog/screeps-moveto-not-moving",
    description: "检查疲劳、MOVE、目标、路径和 moveTo() 返回值。",
  },
  {
    label: "距离不足",
    href: "/blog/screeps-err-not-in-range",
    description: "保存动作结果，只在 -9 时移动并在后续 tick 重试。",
  },
  {
    label: "Spawn 失败",
    href: "/blog/screeps-spawncreep-return-codes",
    description: "按名称、身体、Energy、Memory 和 Spawn 状态排查。",
  },
  {
    label: "CPU 过高",
    href: "/blog/screeps-cpu-getused-bucket",
    description: "记录样本、平均值、峰值与 bucket，不用单 tick 下结论。",
  },
];

export function HomeMaintenancePanel() {
  const posts = getAllPosts();
  const postsBySlug = new Map(posts.map((post) => [post.slug, post]));
  const recentRevisions = getRecentArticleRevisions(3);
  const latestChanges = changelogEntries.slice(0, 3);

  return (
    <section className="home-maintenance" aria-labelledby="home-maintenance-title">
      <div className="home-maintenance-heading">
        <div>
          <p className="eyebrow">POPULAR & RECENTLY FIXED</p>
          <h2 id="home-maintenance-title">热门问题与最近修正</h2>
        </div>
        <Link href="/changelog">查看全部更新日志 →</Link>
      </div>

      <div className="home-maintenance-grid">
        <div className="home-maintenance-column">
          <h3>常见问题</h3>
          <div className="home-question-list">
            {popularQuestions.map((item) => (
              <Link href={item.href} key={item.href}>
                <strong>{item.label}</strong>
                <span>{item.description}</span>
                <small aria-hidden="true">→</small>
              </Link>
            ))}
          </div>
        </div>

        <div className="home-maintenance-column">
          <h3>文章修订</h3>
          <div className="home-revision-list">
            {recentRevisions.map((revision) => {
              const post = postsBySlug.get(revision.slug);
              return (
                <Link href={`/blog/${revision.slug}`} key={revision.slug}>
                  <time dateTime={revision.date}>{revision.date}</time>
                  <strong>{post?.title ?? revision.slug}</strong>
                  <span>{revision.reason}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="home-change-strip" aria-label="最近网站更新">
        {latestChanges.map((entry) => (
          <article key={entry.id}>
            <span>{entry.type}</span>
            <strong>{entry.title}</strong>
          </article>
        ))}
      </div>

      <style>{`
        .home-maintenance { padding: 88px 0; }
        .home-maintenance-heading { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 30px; }
        .home-maintenance-heading h2 { margin: 8px 0 0; font-size: clamp(34px, 5vw, 56px); letter-spacing: -.045em; }
        .home-maintenance-heading > a { font-weight: 700; }
        .home-maintenance-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
        .home-maintenance-column { border: 1px solid var(--border); border-radius: 24px; padding: clamp(24px, 4vw, 38px); background: var(--surface); }
        .home-maintenance-column h3 { margin: 0 0 22px; font-size: 24px; }
        .home-question-list, .home-revision-list { display: grid; border-top: 1px solid var(--border); }
        .home-question-list a, .home-revision-list a { position: relative; display: grid; gap: 7px; border-bottom: 1px solid var(--border); padding: 18px 34px 18px 0; }
        .home-question-list a:hover, .home-revision-list a:hover { text-decoration: none; }
        .home-question-list span, .home-revision-list span { color: var(--muted); font-size: 13px; line-height: 1.55; }
        .home-question-list small { position: absolute; top: 20px; right: 0; }
        .home-revision-list time { color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 11px; }
        .home-change-strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
        .home-change-strip article { display: grid; gap: 7px; border: 1px solid var(--border); border-radius: 16px; padding: 16px 18px; }
        .home-change-strip span { color: var(--muted); font-size: 11px; }
        @media (max-width: 820px) { .home-maintenance-grid, .home-change-strip { grid-template-columns: 1fr; } }
        @media (max-width: 620px) { .home-maintenance-heading { align-items: start; flex-direction: column; } }
      `}</style>
    </section>
  );
}
