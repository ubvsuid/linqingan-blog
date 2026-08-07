import Link from "next/link";

import { formatDate } from "@/lib/date";
import { getRecentSiteActivity } from "@/lib/site-status";

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
  const timelineItems = getRecentSiteActivity(3);

  return (
    <section className="home-maintenance" aria-labelledby="home-maintenance-title">
      <div className="home-maintenance-heading">
        <div>
          <p className="eyebrow">POPULAR &amp; RECENT</p>
          <h2 id="home-maintenance-title">热门问题与最近更新</h2>
        </div>
        <Link href="/changelog">查看完整更新日志 →</Link>
      </div>

      <nav className="home-question-strip" aria-label="热门问题">
        {popularQuestions.map((item) => (
          <Link href={item.href} key={item.href}>
            <strong>{item.label}</strong>
            <span>{item.description}</span>
            <small aria-hidden="true">→</small>
          </Link>
        ))}
      </nav>

      <div className="home-timeline" aria-label="最近内容与网站更新">
        {timelineItems.map((item) => (
          <Link href={item.href ?? "/changelog"} key={item.id}>
            <time dateTime={item.date}>{formatDate(item.date)}</time>
            <span>{item.type}</span>
            <strong>{item.title}</strong>
          </Link>
        ))}
      </div>

      <style>{`
        .home-maintenance { padding: 72px 0; }
        .home-maintenance-heading { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
        .home-maintenance-heading h2 { margin: 8px 0 0; font-size: clamp(34px, 5vw, 54px); letter-spacing: -.045em; }
        .home-maintenance-heading > a { font-weight: 700; }
        .home-question-strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .home-question-strip a { position: relative; display: grid; gap: 7px; padding: 20px 34px 20px 0; }
        .home-question-strip a + a { border-left: 1px solid var(--border); padding-left: 20px; }
        .home-question-strip a:hover, .home-timeline a:hover { text-decoration: none; }
        .home-question-strip span { color: var(--muted); font-size: 12px; line-height: 1.55; }
        .home-question-strip small { position: absolute; top: 22px; right: 10px; }
        .home-timeline { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 30px; }
        .home-timeline a { display: grid; align-content: start; gap: 9px; min-height: 132px; border: 1px solid var(--border); border-radius: 16px; padding: 18px; background: var(--surface); }
        .home-timeline time, .home-timeline > a > span { color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 10px; }
        .home-timeline strong { line-height: 1.5; }
        @media (max-width: 900px) {
          .home-question-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .home-question-strip a:nth-child(3) { border-left: 0; }
          .home-question-strip a:nth-child(n + 3) { border-top: 1px solid var(--border); }
          .home-timeline { grid-template-columns: 1fr; }
        }
        @media (max-width: 620px) {
          .home-maintenance { padding: 58px 0; }
          .home-maintenance-heading { align-items: start; flex-direction: column; }
          .home-question-strip { grid-template-columns: 1fr; }
          .home-question-strip a + a { border-top: 1px solid var(--border); border-left: 0; padding-left: 0; }
        }
      `}</style>
    </section>
  );
}
