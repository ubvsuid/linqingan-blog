import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { BlogArchive } from "@/components/blog-archive";
import { getBlogTotalPages } from "@/lib/blog-pagination";
import { createPageMetadata } from "@/lib/metadata";
import { getAllPosts } from "@/lib/posts";

interface BlogPageNumberProps {
  params: Promise<{
    page: string;
  }>;
}

export const dynamicParams = true;

function parsePageNumber(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const page = Number.parseInt(value, 10);
  return Number.isSafeInteger(page) && page > 0 ? page : null;
}

export function generateStaticParams() {
  const totalPages = getBlogTotalPages(getAllPosts().length);

  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => ({
    page: String(index + 2),
  }));
}

export async function generateMetadata({
  params,
}: BlogPageNumberProps): Promise<Metadata> {
  const { page } = await params;
  const pageNumber = parsePageNumber(page);
  const totalPages = getBlogTotalPages(getAllPosts().length);

  if (!pageNumber || pageNumber === 1 || pageNumber > totalPages) {
    return {
      title: "文章分页不存在",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return createPageMetadata({
    title: `文章 · 第 ${pageNumber} 页`,
    description: `浏览临清安发布的全部文章，第 ${pageNumber} 页。`,
    path: `/blog/page/${pageNumber}`,
  });
}

export default async function BlogPageNumber({
  params,
}: BlogPageNumberProps) {
  const { page } = await params;
  const pageNumber = parsePageNumber(page);

  if (pageNumber === 1) {
    permanentRedirect("/blog");
  }

  const totalPages = getBlogTotalPages(getAllPosts().length);

  if (!pageNumber || pageNumber > totalPages) {
    notFound();
  }

  return <BlogArchive currentPage={pageNumber} />;
}
