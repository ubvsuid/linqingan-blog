import { ProjectsArchive } from "@/components/projects-archive";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "项目",
  description:
    "查看临清安正在建设的个人技术网站、Screeps 中文学习路线与相关系统实践。",
  path: "/projects",
});

export default function ProjectsPage() {
  return <ProjectsArchive currentPage={1} />;
}
