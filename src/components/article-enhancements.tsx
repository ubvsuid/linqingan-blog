"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BeginnerProgressPanel } from "@/components/beginner-progress-panel";
import { SeriesArticleJump } from "@/components/series-article-jump";
import { beginnerSeriesSlugs } from "@/lib/beginner-series";

interface ArticleEnhancementsProps {
  articleId: string;
}

interface ArticleLearningLink {
  label: string;
  title: string;
  description: string;
  href: string;
}

const articleLearningLinks: Record<string, ArticleLearningLink[]> = {
  "screeps-introduction": [
    {
      label: "下一步",
      title: "认识游戏界面与第一个房间",
      description: "在实际客户端中找到 Room、Spawn、Source、Controller、Creep 和 Console。",
      href: "/blog/screeps-first-room",
    },
    {
      label: "查术语",
      title: "Screeps 术语表",
      description: "快速查询 Creep、Spawn、Source、Controller 和 Room 的新手解释。",
      href: "/glossary#creep",
    },
    {
      label: "查错误",
      title: "ERR_NOT_IN_RANGE 是什么意思",
      description: "了解为什么动作目标太远时，需要先让 Creep 靠近。",
      href: "/screeps-errors#err_not_in_range",
    },
  ],
  "screeps-first-room": [
    {
      label: "前置知识",
      title: "Screeps 是什么",
      description: "先理解游戏的基本对象和前期资源循环。",
      href: "/blog/screeps-introduction",
    },
    {
      label: "下一步",
      title: "tick 是什么",
      description: "理解代码为什么会在每个 tick 中重新运行。",
      href: "/blog/screeps-tick-and-game-loop",
    },
    {
      label: "相关术语",
      title: "Room：房间",
      description: "查看 Room、RoomPosition 和房间对象的基础解释。",
      href: "/glossary#room",
    },
  ],
  "screeps-tick-and-game-loop": [
    {
      label: "前置知识",
      title: "认识第一个房间",
      description: "先找到代码编辑器、Console 和房间中的主要对象。",
      href: "/blog/screeps-first-room",
    },
    {
      label: "下一步",
      title: "让第一只 Creep 开始采集",
      description: "把 tick、Game.creeps、harvest() 和 moveTo() 连接起来。",
      href: "/blog/screeps-first-creep-harvest",
    },
    {
      label: "继续深入",
      title: "Screeps Memory 是什么",
      description: "理解哪些数据会随 tick 重建，哪些状态可以跨 tick 保存。",
      href: "/blog/screeps-memory-basics",
    },
  ],
  "screeps-first-creep-harvest": [
    {
      label: "前置知识",
      title: "tick 与主循环",
      description: "理解 Creep 为什么需要多个 tick 才能靠近并完成采集。",
      href: "/blog/screeps-tick-and-game-loop",
    },
    {
      label: "下一步",
      title: "把 Energy 运回 Spawn",
      description: "在采满以后切换目标，并把能量交给 Spawn。",
      href: "/blog/screeps-creep-deliver-energy",
    },
    {
      label: "相关错误",
      title: "ERR_NOT_IN_RANGE 排查方法",
      description: "查看 harvest()、transfer()、build() 等动作距离不足时的统一处理方式。",
      href: "/screeps-errors#err_not_in_range",
    },
  ],
  "screeps-creep-deliver-energy": [
    {
      label: "前置知识",
      title: "让 Creep 采集 Energy",
      description: "先确认 Creep 能找到 Source、移动并完成采集。",
      href: "/blog/screeps-first-creep-harvest",
    },
    {
      label: "下一步",
      title: "认识 Creep Body 部件",
      description: "理解 WORK、CARRY 和 MOVE 如何决定这只 Creep 的能力。",
      href: "/blog/screeps-creep-body-parts",
    },
    {
      label: "相关错误",
      title: "ERR_FULL 是什么意思",
      description: "当 Spawn、Extension 或其他目标没有剩余容量时，先更换目标。",
      href: "/screeps-errors#err_full",
    },
  ],
  "screeps-creep-body-parts": [
    {
      label: "前置知识",
      title: "采集与运输 Energy",
      description: "结合实际行为理解 WORK、CARRY 和 MOVE 的作用。",
      href: "/blog/screeps-creep-deliver-energy",
    },
    {
      label: "下一步",
      title: "使用 spawnCreep() 创建单位",
      description: "把身体部件数组、名称和房间能量组合成一次生产调用。",
      href: "/blog/screeps-spawn-create-creep",
    },
    {
      label: "相关术语",
      title: "Body Part：身体部件",
      description: "查看身体部件、Creep 和 Spawn 的快速解释。",
      href: "/glossary#body-part",
    },
  ],
  "screeps-spawn-create-creep": [
    {
      label: "前置知识",
      title: "认识 Creep Body 部件",
      description: "先理解身体数组中的 WORK、CARRY 和 MOVE。",
      href: "/blog/screeps-creep-body-parts",
    },
    {
      label: "下一步",
      title: "认识 Harvester、Upgrader 和 Builder",
      description: "理解这些名称是玩家为不同工作职责建立的角色约定。",
      href: "/blog/screeps-creep-roles",
    },
    {
      label: "相关错误",
      title: "Spawn 能量不足的返回值",
      description: "查看 ERR_NOT_ENOUGH_ENERGY、ERR_BUSY 和 ERR_NAME_EXISTS 的处理方法。",
      href: "/screeps-errors#err_not_enough_energy",
    },
  ],
  "screeps-creep-roles": [
    {
      label: "前置知识",
      title: "使用 Spawn 创建新的 Creep",
      description: "先确认你能够创建不同名称和 Body 的单位。",
      href: "/blog/screeps-spawn-create-creep",
    },
    {
      label: "下一步",
      title: "让 Upgrader 升级 Controller",
      description: "把角色职责连接到实际的 upgradeController() 行为。",
      href: "/blog/screeps-upgrade-controller",
    },
    {
      label: "继续深入",
      title: "使用 Memory 保存角色",
      description: "了解为什么稳定的角色系统不能只依赖固定 Creep 名称。",
      href: "/blog/screeps-memory-basics",
    },
  ],
  "screeps-upgrade-controller": [
    {
      label: "前置知识",
      title: "认识 Creep 角色分工",
      description: "先理解 Upgrader 只是玩家为升级工作建立的角色名称。",
      href: "/blog/screeps-creep-roles",
    },
    {
      label: "下一步",
      title: "建造第一个 Extension",
      description: "通过提升 RCL 解锁更多房间能量容量。",
      href: "/blog/screeps-first-extension",
    },
    {
      label: "相关错误",
      title: "ERR_NOT_IN_RANGE 排查方法",
      description: "Controller 距离太远时，先检查 upgradeController() 的返回值。",
      href: "/screeps-errors#err_not_in_range",
    },
  ],
  "screeps-first-extension": [
    {
      label: "前置知识",
      title: "升级 Controller",
      description: "先理解 RCL 如何决定可建造的建筑类型和数量。",
      href: "/blog/screeps-upgrade-controller",
    },
    {
      label: "下一步",
      title: "让 Builder 自动建造和维修",
      description: "把 Construction Site、build() 和 repair() 连接起来。",
      href: "/blog/screeps-build-and-repair",
    },
    {
      label: "相关术语",
      title: "Extension：扩展建筑",
      description: "查看 Extension、Construction Site 和 RCL 的基础解释。",
      href: "/glossary#extension",
    },
  ],
  "screeps-build-and-repair": [
    {
      label: "前置知识",
      title: "建造第一个 Extension",
      description: "先认识 Construction Site 和房间建造限制。",
      href: "/blog/screeps-first-extension",
    },
    {
      label: "下一步",
      title: "整理第一份房间基础代码",
      description: "把采集、运输、升级、建造和维修放进同一个主循环。",
      href: "/blog/screeps-first-room-code",
    },
    {
      label: "相关错误",
      title: "ERR_INVALID_TARGET 是什么意思",
      description: "当目标类型不适用于 build() 或 repair() 时，先检查查找结果。",
      href: "/screeps-errors#err_invalid_target",
    },
  ],
  "screeps-first-room-code": [
    {
      label: "前置知识",
      title: "自动建造和维修",
      description: "先确认不同工作行为已经能够单独运行。",
      href: "/blog/screeps-build-and-repair",
    },
    {
      label: "下一阶段",
      title: "Screeps Memory 是什么",
      description: "从固定名称代码继续走向角色状态和跨 tick 数据保存。",
      href: "/blog/screeps-memory-basics",
    },
    {
      label: "快速查询",
      title: "站内搜索",
      description: "搜索 Creep、Memory、错误码和已经发布的教程。",
      href: "/search?q=Memory",
    },
  ],
  "screeps-memory-basics": [
    {
      label: "前置知识",
      title: "理解 tick 与主循环",
      description: "先理解 Game 对象为什么会在每个 tick 中重新生成。",
      href: "/blog/screeps-tick-and-game-loop",
    },
    {
      label: "承接代码",
      title: "第一份房间基础代码",
      description: "查看固定名称和多角色代码为什么需要进一步整理。",
      href: "/blog/screeps-first-room-code",
    },
    {
      label: "相关术语",
      title: "Memory：持久化内存",
      description: "快速查看 Memory、Game 和 tick 之间的关系。",
      href: "/glossary#memory",
    },
  ],
};

export function ArticleEnhancements({
  articleId,
}: ArticleEnhancementsProps) {
  const pathname = usePathname();
  const currentSlug = pathname.split("/").filter(Boolean).at(-1) ?? "";
  const beginnerIndex = beginnerSeriesSlugs.findIndex(
    (slug) => slug === currentSlug,
  );
  const isBeginnerArticle = beginnerIndex >= 0;
  const isLastBeginnerArticle = beginnerIndex === beginnerSeriesSlugs.length - 1;
  const learningLinks = articleLearningLinks[currentSlug] ?? [];

  useEffect(() => {
    const article = document.getElementById(articleId);

    if (!article) {
      return;
    }

    const cleanups: Array<() => void> = [];

    article.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".copy-code-button")) {
        return;
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-code-button";
      button.textContent = "复制";
      button.setAttribute("aria-label", "复制代码");
      button.setAttribute("aria-live", "polite");

      const handleClick = async () => {
        const code = pre.querySelector("code")?.textContent ?? "";

        try {
          await navigator.clipboard.writeText(code);
          button.textContent = "已复制";
        } catch {
          button.textContent = "复制失败";
        }

        window.setTimeout(() => {
          button.textContent = "复制";
        }, 1600);
      };

      button.addEventListener("click", handleClick);
      pre.classList.add("has-copy-button");
      pre.appendChild(button);

      cleanups.push(() => {
        button.removeEventListener("click", handleClick);
        button.remove();
        pre.classList.remove("has-copy-button");
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [articleId]);

  if (!isBeginnerArticle && learningLinks.length === 0) {
    return null;
  }

  return (
    <>
      {learningLinks.length > 0 ? (
        <section className="article-learning-links" aria-labelledby="article-learning-links-title">
          <div className="article-learning-links-heading">
            <p className="eyebrow">LEARNING PATH</p>
            <h2 id="article-learning-links-title">把这篇内容连接到下一步</h2>
            <p>根据当前问题继续学习、查询术语，或直接查看相关错误码。</p>
          </div>
          <div className="article-learning-links-grid">
            {learningLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                <span>{item.label}</span>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {isBeginnerArticle ? (
        <>
          <BeginnerProgressPanel slug={currentSlug} />
          <SeriesArticleJump
            key={currentSlug}
            articleHrefs={beginnerSeriesSlugs.map((slug) => `/blog/${slug}`)}
            currentArticle={beginnerIndex + 1}
            seriesLabel="Screeps 新手入门"
          />

          {isLastBeginnerArticle ? (
            <section className="beginner-next-stage" aria-labelledby="next-stage-title">
              <p className="eyebrow">WHAT IS NEXT</p>
              <h2 id="next-stage-title">入门完成，接下来开始建设稳定的房间系统</h2>
              <p>
                你已经走完从第一只 Creep 到房间基础代码的路线。下一阶段会逐步进入角色 Memory、自动补员、模块拆分、异常恢复与房间管理。
              </p>
              <div>
                <Link href="/blog/screeps-memory-basics">从 Memory 基础开始 →</Link>
                <Link href="/blog">浏览全部文章 →</Link>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      <style>{`
        .article-learning-links {
          display: grid;
          grid-template-columns: minmax(220px, .72fr) minmax(0, 1.28fr);
          gap: 44px;
          margin-top: 72px;
          border-top: 1px solid var(--border);
          padding-top: 42px;
        }

        .article-learning-links-heading h2 {
          margin: 8px 0 0;
          font-size: clamp(28px, 4vw, 40px);
          line-height: 1.15;
          letter-spacing: -.04em;
        }

        .article-learning-links-heading > p:last-child {
          margin: 16px 0 0;
          color: var(--muted);
          line-height: 1.75;
        }

        .article-learning-links-grid {
          display: grid;
          gap: 10px;
        }

        .article-learning-links-grid a {
          display: grid;
          gap: 8px;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          background: var(--surface);
          transition: transform 160ms ease, border-color 160ms ease;
        }

        .article-learning-links-grid a:hover {
          transform: translateY(-2px);
          border-color: var(--muted);
          text-decoration: none;
        }

        .article-learning-links-grid span {
          color: var(--muted);
          font-size: 12px;
        }

        .article-learning-links-grid strong {
          line-height: 1.45;
        }

        .article-learning-links-grid p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.65;
        }

        .article-learning-links + .beginner-progress-panel {
          margin-top: 34px;
        }

        .beginner-next-stage {
          margin-top: 46px;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: clamp(26px, 5vw, 42px);
          background: var(--surface);
        }

        .beginner-next-stage h2 {
          margin: 0;
          font-size: clamp(30px, 5vw, 44px);
          line-height: 1.15;
          letter-spacing: -0.045em;
        }

        .beginner-next-stage > p:not(.eyebrow) {
          margin: 18px 0 0;
          color: var(--muted);
          line-height: 1.8;
        }

        .beginner-next-stage > div {
          display: flex;
          flex-wrap: wrap;
          gap: 12px 22px;
          margin-top: 24px;
          font-weight: 650;
        }

        @media (max-width: 760px) {
          .article-learning-links {
            grid-template-columns: 1fr;
            gap: 26px;
          }
        }
      `}</style>
    </>
  );
}
