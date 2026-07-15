"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getBlogPageHref } from "@/lib/blog-pagination";

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
}

export function BlogPagination({
  currentPage,
  totalPages,
  totalPosts,
}: BlogPaginationProps) {
  const router = useRouter();
  const [pageValue, setPageValue] = useState(String(currentPage));
  const [error, setError] = useState("");

  const previousPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const targetPage = Number.parseInt(pageValue, 10);

    if (
      !Number.isInteger(targetPage) ||
      targetPage < 1 ||
      targetPage > totalPages
    ) {
      setError(`请输入 1 到 ${totalPages} 之间的页数`);
      return;
    }

    setError("");
    router.push(getBlogPageHref(targetPage));
  }

  return (
    <nav className="blog-pagination" aria-label="文章分页">
      <div className="blog-pagination-row">
        {previousPage ? (
          <Link
            className="blog-pagination-link blog-pagination-previous"
            href={getBlogPageHref(previousPage)}
          >
            ← 上一页
          </Link>
        ) : (
          <span
            className="blog-pagination-link blog-pagination-disabled"
            aria-disabled="true"
          >
            ← 上一页
          </span>
        )}

        <p className="blog-pagination-summary" aria-live="polite">
          第 {currentPage} / {totalPages} 页
          <span aria-hidden="true"> · </span>
          共 {totalPosts} 篇
        </p>

        {nextPage ? (
          <Link
            className="blog-pagination-link blog-pagination-next"
            href={getBlogPageHref(nextPage)}
          >
            下一页 →
          </Link>
        ) : (
          <span
            className="blog-pagination-link blog-pagination-next blog-pagination-disabled"
            aria-disabled="true"
          >
            下一页 →
          </span>
        )}
      </div>

      <form className="blog-page-jump" onSubmit={handleSubmit}>
        <label htmlFor="blog-page-number">跳转到第</label>
        <input
          id="blog-page-number"
          className="blog-page-input"
          type="number"
          inputMode="numeric"
          min={1}
          max={totalPages}
          step={1}
          value={pageValue}
          onChange={(event) => setPageValue(event.target.value)}
          aria-describedby={error ? "blog-page-error" : undefined}
          required
        />
        <span>页</span>
        <button className="blog-page-submit" type="submit">
          跳转
        </button>
      </form>

      <p
        id="blog-page-error"
        className="blog-page-error"
        role="status"
        aria-live="polite"
      >
        {error}
      </p>
    </nav>
  );
}
