"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { getCollectionPageHref } from "@/lib/pagination";

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

    if (
      !Number.isInteger(targetPage) ||
      targetPage < 1 ||
      targetPage > totalPages
    ) {
      setError(`请输入 1 到 ${totalPages} 之间的页数`);
      return;
    }

    setError("");
    router.push(getCollectionPageHref(basePath, targetPage));
  }

  return (
    <nav className="collection-pagination" aria-label={ariaLabel}>
      <div className="collection-pagination-row">
        {previousPage ? (
          <Link
            className="collection-pagination-link collection-pagination-previous"
            href={getCollectionPageHref(basePath, previousPage)}
          >
            ← 上一页
          </Link>
        ) : (
          <span
            className="collection-pagination-link collection-pagination-disabled"
            aria-disabled="true"
          >
            ← 上一页
          </span>
        )}

        <p className="collection-pagination-summary" aria-live="polite">
          第 {currentPage} / {totalPages} 页
          <span aria-hidden="true"> · </span>
          共 {totalItems} {itemLabel}
        </p>

        {nextPage ? (
          <Link
            className="collection-pagination-link collection-pagination-next"
            href={getCollectionPageHref(basePath, nextPage)}
          >
            下一页 →
          </Link>
        ) : (
          <span
            className="collection-pagination-link collection-pagination-next collection-pagination-disabled"
            aria-disabled="true"
          >
            下一页 →
          </span>
        )}
      </div>

      <form className="collection-page-jump" onSubmit={handleSubmit}>
        <label htmlFor={inputId}>跳转到第</label>
        <input
          id={inputId}
          className="collection-page-input"
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
        <button className="collection-page-submit" type="submit">
          跳转
        </button>
      </form>

      <p
        id={errorId}
        className="collection-page-error"
        role="status"
        aria-live="polite"
      >
        {error}
      </p>

      <style>{`
        .collection-pagination {
          display: grid;
          gap: 20px;
          margin-top: 54px;
          border-top: 1px solid var(--border);
          padding-top: 30px;
        }

        .collection-pagination-row {
          display: grid;
          grid-template-columns: minmax(120px, 1fr) auto minmax(120px, 1fr);
          align-items: center;
          gap: 20px;
        }

        .collection-pagination-link {
          display: inline-flex;
          width: fit-content;
          min-height: 42px;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 0 16px;
          background: var(--surface);
          font-size: 14px;
          font-weight: 650;
          transition:
            transform 160ms ease,
            border-color 160ms ease;
        }

        .collection-pagination-link:hover {
          transform: translateY(-2px);
          border-color: var(--muted);
          text-decoration: none;
        }

        .collection-pagination-next {
          justify-self: end;
        }

        .collection-pagination-disabled {
          color: var(--muted);
          cursor: not-allowed;
          opacity: 0.48;
        }

        .collection-pagination-disabled:hover {
          transform: none;
          border-color: var(--border);
        }

        .collection-pagination-summary {
          margin: 0;
          color: var(--muted);
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
          font-size: 13px;
          text-align: center;
          white-space: nowrap;
        }

        .collection-page-jump {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: var(--muted);
          font-size: 14px;
        }

        .collection-page-input {
          width: 82px;
          min-height: 42px;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0 10px;
          background: var(--surface);
          color: var(--foreground);
          text-align: center;
          outline: none;
        }

        .collection-page-input:focus {
          border-color: var(--foreground);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--foreground) 10%, transparent);
        }

        .collection-page-submit {
          min-height: 42px;
          border: 1px solid var(--foreground);
          border-radius: 999px;
          padding: 0 18px;
          background: var(--foreground);
          color: var(--background);
          font-weight: 650;
          cursor: pointer;
          transition: transform 160ms ease;
        }

        .collection-page-submit:hover {
          transform: translateY(-2px);
        }

        .collection-page-error {
          min-height: 22px;
          margin: -10px 0 0;
          color: var(--muted);
          font-size: 13px;
          text-align: center;
        }

        @media (max-width: 640px) {
          .collection-pagination-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .collection-pagination-summary {
            grid-column: 1 / -1;
            grid-row: 1;
          }

          .collection-pagination-previous {
            grid-column: 1;
            grid-row: 2;
          }

          .collection-pagination-next {
            grid-column: 2;
            grid-row: 2;
          }

          .collection-pagination-link {
            justify-content: center;
          }
        }
      `}</style>
    </nav>
  );
}