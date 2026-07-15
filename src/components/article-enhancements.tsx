"use client";

import { useEffect } from "react";

interface ArticleEnhancementsProps {
  articleId: string;
}

export function ArticleEnhancements({
  articleId,
}: ArticleEnhancementsProps) {
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

  return null;
}
