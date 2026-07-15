import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { ProjectsArchive } from "@/components/projects-archive";
import {
  getArchiveStaticParams,
  getTotalPages,
  parsePositivePageNumber,
} from "@/lib/pagination";
import { projects } from "@/lib/projects";

interface ProjectsPageNumberProps {
  params: Promise<{
    page: string;
  }>;
}

export const dynamicParams = true;

export function generateStaticParams() {
  return getArchiveStaticParams(projects.length);
}

export async function generateMetadata({
  params,
}: ProjectsPageNumberProps): Promise<Metadata> {
  const { page } = await params;
  const pageNumber = parsePositivePageNumber(page);
  const totalPages = getTotalPages(projects.length);

  if (!pageNumber || pageNumber === 1 || pageNumber > totalPages) {
    return {
      title: "项目分页不存在",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `项目 · 第 ${pageNumber} 页`,
    description: `浏览临清安的项目档案，第 ${pageNumber} 页。`,
    alternates: {
      canonical: `/projects/page/${pageNumber}`,
    },
  };
}

export default async function ProjectsPageNumber({
  params,
}: ProjectsPageNumberProps) {
  const { page } = await params;
  const pageNumber = parsePositivePageNumber(page);

  if (pageNumber === 1) {
    permanentRedirect("/projects");
  }

  const totalPages = getTotalPages(projects.length);

  if (!pageNumber || pageNumber > totalPages) {
    notFound();
  }

  return <ProjectsArchive currentPage={pageNumber} />;
}