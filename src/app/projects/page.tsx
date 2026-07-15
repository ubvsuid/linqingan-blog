import type { Metadata } from "next";

import { ProjectsArchive } from "@/components/projects-archive";

export const metadata: Metadata = {
  title: "项目",
  description: "临清安正在开发和持续维护的项目档案。",
  alternates: {
    canonical: "/projects",
  },
};

export default function ProjectsPage() {
  return <ProjectsArchive currentPage={1} />;
}