import { BlogArchive } from "@/components/blog-archive";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Screeps 中文教程与开发文章",
  description:
    "浏览 Screeps 中文教程与开发文章，覆盖 Creep、Spawn、Memory、寻路、Controller、资源经济、市场、自动化与错误排查。",
  path: "/blog",
});

export default function BlogPage() {
  return <BlogArchive currentPage={1} />;
}
