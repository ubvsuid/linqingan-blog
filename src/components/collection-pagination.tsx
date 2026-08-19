"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { getCollectionPageHref } from "@/lib/pagination";

import styles from "./collection-pagination.module.css";

interface CollectionPaginationProps {
  ariaLabel: string;
  basePath: string;
  currentPage: number;
  itemLabel: string;
  totalItems: number;
  totalPages: number;
}

export function CollectionPagination({
  ariaLabel,
  basePath,
  currentPage,
  itemLabel,
  totalItems,
  totalPages,
}: CollectionPaginationProps) {
  const router = useRouter();
  const [pageValue, setPageValue] = useState(String(currentPage));
  const [error, setError] = useState("");
  const inputId = `${basePath.replace(/[^a-z0-9]+/gi, "-")}-page-number`;
  const errorId = `${inputId}-error`;
  const previousPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const targetPage = Number.parseInt(pageValue, 10);

    if (!Number.isInteger(targetPage) || targetPage < 1 || targetPage > totalPages) {
      setError(`请输入 1 到 ${totalPages} 之间的页数`);
      return;
    }

    setError("");
    router.push(getCollectionPageHref(basePath, targetPage));
  }

  return (
    <nav className={styles.pagination} aria-label={ariaLabel}>
      <div className={styles.row}>
        {previousPage ? (
          <Link
            className={`${styles.link} ${styles.previous}`}
            href={getCollectionPageHref(basePath, previousPage)}
            prefetch={false}
          >
            ← 上一页
          </Link>
        ) : (
          <span className={`${styles.link} ${styles.previous} ${styles.disabled}`} aria-disabled="true">
            ← 上一页
          </span>
        )}

        <p className={styles.summary} aria-live="polite">
          第 {currentPage} / {totalPages} 页
          <span aria-hidden="true"> · </span>
          共 {totalItems} {itemLabel}
        </p>

        {nextPage ? (
          <Link
            className={`${styles.link} ${styles.next}`}
            href={getCollectionPageHref(basePath, nextPage)}
            prefetch={false}
          >
            下一页 →
          </Link>
        ) : (
          <span className={`${styles.link} ${styles.next} ${styles.disabled}`} aria-disabled="true">
            下一页 →
          </span>
        )}
      </div>

      <form className={styles.jump} onSubmit={handleSubmit}>
        <label htmlFor={inputId}>跳转到第</label>
        <input
          id={inputId}
          className={styles.input}
          type="number"
          inputMode="numeric"
          min={1}
          max={totalPages}
          step={1}
          value={pageValue}
          onChange={(event) => setPageValue(event.target.value)}
          aria-describedby={error ? errorId : undefined}
          required
        />
        <span>页</span>
        <button className={styles.submit} type="submit">跳转</button>
      </form>

      <p id={errorId} className={styles.error} role="status" aria-live="polite">
        {error}
      </p>
    </nav>
  );
}
