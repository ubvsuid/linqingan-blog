import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { ChangelogArchive } from "@/components/changelog-archive";
import {
  CHANGELOG_ITEMS_PER_PAGE,
  changelogEntries,
} from "@/lib/changelog";
import {
  getArchiveStaticParams,
  getTotalPages,
  parsePositivePageNumber,
} from "@/lib/pagination";

interface ChangelogPageNumberProps {
  params: Promise<{
    page: string;
  }>;
}

export const dynamicParams = true;

export function generateStaticParams() {
  return getArchiveStaticParams(
    changelogEntries.length,
    CHANGELOG_ITEMS_PER_PAGE,
  );
}

export async function generateMetadata({
  params,
}: ChangelogPageNumberProps): Promise<Metadata> {
  const { page } = await params;
  const pageNumber = parsePositivePageNumber(page);
  const totalPages = getTotalPages(
    changelogEntries.length,
    CHANGELOG_ITEMS_PER_PAGE,
  );

  if (!pageNumber || pageNumber === 1 || pageNumber > totalPages) {
    return {
      title: "更新日志分页不存在",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `更新日志 · 第 ${pageNumber} 页`,
    description: `浏览临清安网站与内容的更新记录，第 ${pageNumber} 页。`,
    alternates: {
      canonical: `/changelog/page/${pageNumber}`,
    },
  };
}

export default async function ChangelogPageNumber({
  params,
}: ChangelogPageNumberProps) {
  const { page } = await params;
  const pageNumber = parsePositivePageNumber(page);

  if (pageNumber === 1) {
    permanentRedirect("/changelog");
  }

  const totalPages = getTotalPages(
    changelogEntries.length,
    CHANGELOG_ITEMS_PER_PAGE,
  );

  if (!pageNumber || pageNumber > totalPages) {
    notFound();
  }

  return <ChangelogArchive currentPage={pageNumber} />;
}
