import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { NowArchive } from "@/components/now-archive";
import { nowEntries } from "@/lib/now-entries";
import {
  getArchiveStaticParams,
  getTotalPages,
  parsePositivePageNumber,
} from "@/lib/pagination";

interface NowPageNumberProps {
  params: Promise<{
    page: string;
  }>;
}

export const dynamicParams = true;

export function generateStaticParams() {
  return getArchiveStaticParams(nowEntries.length);
}

export async function generateMetadata({
  params,
}: NowPageNumberProps): Promise<Metadata> {
  const { page } = await params;
  const pageNumber = parsePositivePageNumber(page);
  const totalPages = getTotalPages(nowEntries.length);

  if (!pageNumber || pageNumber === 1 || pageNumber > totalPages) {
    return {
      title: "近况分页不存在",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `近况 · 第 ${pageNumber} 页`,
    description: `浏览临清安最近在做的事情，第 ${pageNumber} 页。`,
    alternates: {
      canonical: `/now/page/${pageNumber}`,
    },
  };
}

export default async function NowPageNumber({
  params,
}: NowPageNumberProps) {
  const { page } = await params;
  const pageNumber = parsePositivePageNumber(page);

  if (pageNumber === 1) {
    permanentRedirect("/now");
  }

  const totalPages = getTotalPages(nowEntries.length);

  if (!pageNumber || pageNumber > totalPages) {
    notFound();
  }

  return <NowArchive currentPage={pageNumber} />;
}