"use client";

import { useEffect, useMemo, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface ArticleReadingExperienceProps {
  articleId: string;
  slug: string;
  title: string;
  toc: TocItem[];
}

interface LightboxState {
  src: string;
  alt: string;
}

const RECENT_STORAGE_KEY = "linqingan:recent-articles";

export function ArticleReadingExperience({
  articleId,
  slug,
  title,
  toc,
}: ArticleReadingExperienceProps) {
  const [activeId, setActiveId] = useState(toc[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const tocItems = useMemo(() => toc.filter((item) => item.id), [toc]);

  useEffect(() => {
    try {
      const existing = JSON.parse(window.localStorage.getItem(RECENT_STORAGE_KEY) ?? "[]");
      const current = Array.isArray(existing) ? existing : [];
      const next = [
        { slug, title, href: `/blog/${slug}`, visitedAt: new Date().toISOString() },
        ...current.filter((item) => item && item.slug !== slug),
      ].slice(0, 8);
      window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("site:recent-articles"));
    } catch {
      // Reading history is optional. The article must remain usable without storage.
    }
  }, [slug, title]);

  useEffect(() => {
    const article = document.getElementById(articleId);
    if (!article) return;

    const updateProgress = () => {
      const rect = article.getBoundingClientRect();
      const articleTop = window.scrollY + rect.top;
      const readableDistance = Math.max(article.scrollHeight - window.innerHeight * 0.55, 1);
      const current = window.scrollY + 120 - articleTop;
      setProgress(Math.max(0, Math.min(100, (current / readableDistance) * 100)));
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [articleId]);

  useEffect(() => {
    const article = document.getElementById(articleId);
    if (!article) return;

    const cleanups: Array<() => void> = [];
    article.querySelectorAll<HTMLElement>("h2[id], h3[id]").forEach((heading) => {
      if (heading.querySelector(".heading-link-button")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "heading-link-button";
      button.textContent = "#";
      button.setAttribute("aria-label", `复制“${heading.textContent ?? "本节"}”链接`);
      const handleClick = async () => {
        const nextUrl = `${window.location.origin}${window.location.pathname}#${heading.id}`;
        window.history.replaceState(null, "", `#${heading.id}`);
        try {
          await navigator.clipboard.writeText(nextUrl);
          button.textContent = "已复制";
        } catch {
          button.textContent = "复制失败";
        }
        window.setTimeout(() => { button.textContent = "#"; }, 1500);
      };
      button.addEventListener("click", handleClick);
      heading.classList.add("heading-with-anchor");
      heading.appendChild(button);
      cleanups.push(() => {
        button.removeEventListener("click", handleClick);
        button.remove();
        heading.classList.remove("heading-with-anchor");
      });
    });

    article.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
      if (image.closest("a")) return;
      image.classList.add("article-zoomable-image");
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", `${image.alt || "文章图片"}，点击放大`);
      const open = () => setLightbox({ src: image.currentSrc || image.src, alt: image.alt });
      const handleKey = (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      };
      image.addEventListener("click", open);
      image.addEventListener("keydown", handleKey);
      cleanups.push(() => {
        image.removeEventListener("click", open);
        image.removeEventListener("keydown", handleKey);
        image.classList.remove("article-zoomable-image");
        image.removeAttribute("tabindex");
        image.removeAttribute("role");
        image.removeAttribute("aria-label");
      });
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [articleId]);

  useEffect(() => {
    if (tocItems.length === 0) return;
    const headings = tocItems
      .map((item) => document.getElementById(item.id))
      .filter((heading): heading is HTMLElement => Boolean(heading));
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 1] },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [tocItems]);

  useEffect(() => {
    const links = document.querySelectorAll<HTMLAnchorElement>(".article-toc a");
    links.forEach((link) => {
      const isActive = link.hash === `#${activeId}`;
      link.classList.toggle("toc-link-active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, [activeId]);

  useEffect(() => {
    if (!lightbox) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightbox]);

  return (
    <>
      <div className="article-reading-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      {tocItems.length > 1 ? (
        <aside className="article-floating-toc" aria-label="悬浮文章目录">
          <span>当前章节</span>
          <ol>
            {tocItems.map((item) => (
              <li className={item.level === 3 ? "toc-level-three" : undefined} key={item.id}>
                <a className={activeId === item.id ? "toc-link-active" : undefined} href={`#${item.id}`}>
                  {item.text}
                </a>
              </li>
            ))}
          </ol>
        </aside>
      ) : null}

      {tocItems.length > 1 ? (
        <a className="article-back-to-toc" href="#article-page-toc">
          返回目录
        </a>
      ) : null}

      {lightbox ? (
        <div
          className="article-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.alt || "放大文章图片"}
          onClick={() => setLightbox(null)}
        >
          <button type="button" onClick={() => setLightbox(null)}>关闭</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.src} alt={lightbox.alt} onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
    </>
  );
}
