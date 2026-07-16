import { BlogArchive } from "@/components/blog-archive";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "文章",
  description:
    "浏览临清安发布的全部内容，包括 Screeps 新手入门、基础工程、系统架构与网站建设记录。",
  path: "/blog",
});

export default function BlogPage() {
  return <BlogArchive currentPage={1} />;
}
