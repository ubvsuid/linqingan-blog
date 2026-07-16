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

export function ArticleEnhancements({
  articleId,
}: ArticleEnhancementsProps) {
  const pathname = usePathname();
  const currentSlug = pathname.split("/").filter(Boolean).at(-1) ?? "";
  const beginnerIndex = beginnerSeriesSlugs.findIndex(
    (slug) => slug === currentSlug,
  );
  const isLastBeginnerArticle = beginnerIndex === beginnerSeriesSlugs.length - 1;

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

  if (beginnerIndex < 0) {
    return null;
  }

  return (
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
            你已经走完从第一只 Creep 到房间基础代码的路线。下一阶段会逐步进入角色 Memory、提前补员、模块拆分、异常恢复与房间管理。
          </p>
          <div>
            <Link href="/blog">浏览全部文章 →</Link>
            <Link href="/projects">查看正在建设的项目 →</Link>
          </div>
        </section>
      ) : null}

      <style>{`
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
      `}</style>
    </>
  );
}
