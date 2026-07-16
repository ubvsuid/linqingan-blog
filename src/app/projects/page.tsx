import type { Metadata } from "next";

import { ProjectsArchive } from "@/components/projects-archive";

export const metadata: Metadata = {
  title: "项目",
  description: "项目内容将在后续更新。",
  alternates: {
    canonical: "/projects",
  },
};

export default function ProjectsPage() {
  return <ProjectsArchive currentPage={1} />;
}
