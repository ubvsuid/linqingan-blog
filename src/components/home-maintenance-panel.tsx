import Link from "next/link";

import { formatDate } from "@/lib/date";
import { getRecentSiteActivity } from "@/lib/site-status";

import styles from "./home-maintenance-panel.module.css";

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
    <section className={styles.maintenance} aria-labelledby="home-maintenance-title">
      <div className={styles.heading}>
        <div>
          <p className="eyebrow">POPULAR &amp; RECENT</p>
          <h2 id="home-maintenance-title">热门问题与最近更新</h2>
        </div>
        <Link href="/changelog">查看完整更新日志 →</Link>
      </div>

      <nav className={styles.questions} aria-label="热门问题">
        {popularQuestions.map((item) => (
          <Link href={item.href} key={item.href}>
            <strong>{item.label}</strong>
            <span>{item.description}</span>
            <small aria-hidden="true">→</small>
          </Link>
        ))}
      </nav>

      <div className={`${styles.timeline} home-timeline`} aria-label="最近内容与网站更新">
        {timelineItems.map((item) => (
          <Link href={item.href ?? "/changelog"} key={item.id}>
            <time dateTime={item.date}>{formatDate(item.date)}</time>
            <span>{item.type}</span>
            <strong>{item.title}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
