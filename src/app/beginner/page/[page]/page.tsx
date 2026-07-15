import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { BeginnerArchive } from "@/components/beginner-archive";
import { beginnerSeriesSlugs } from "@/lib/beginner-series";
import {
  getArchiveStaticParams,
  getTotalPages,
  parsePositivePageNumber,
} from "@/lib/pagination";

interface BeginnerPageNumberProps {
  params: Promise<{
    page: string;
  }>;
}

export const dynamicParams = true;

export function generateStaticParams() {
  return getArchiveStaticParams(beginnerSeriesSlugs.length);
}

export async function generateMetadata({
  params,
}: BeginnerPageNumberProps): Promise<Metadata> {
  const { page } = await params;
  const pageNumber = parsePositivePageNumber(page);
  const totalPages = getTotalPages(beginnerSeriesSlugs.length);

  if (!pageNumber || pageNumber === 1 || pageNumber > totalPages) {
    return {
      title: "入门分页不存在",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `Screeps 新手入门 · 第 ${pageNumber} 页`,
    description: `按顺序浏览 Screeps 新手入门内容，第 ${pageNumber} 页。`,
    alternates: {
      canonical: `/beginner/page/${pageNumber}`,
    },
  };
}

export default async function BeginnerPageNumber({
  params,
}: BeginnerPageNumberProps) {
  const { page } = await params;
  const pageNumber = parsePositivePageNumber(page);

  if (pageNumber === 1) {
    permanentRedirect("/beginner");
  }

  const totalPages = getTotalPages(beginnerSeriesSlugs.length);

  if (!pageNumber || pageNumber > totalPages) {
    notFound();
  }

  return <BeginnerArchive currentPage={pageNumber} />;
}