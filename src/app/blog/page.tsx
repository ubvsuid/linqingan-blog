import type { Metadata } from "next";

import { BlogArchive } from "@/components/blog-archive";

export const metadata: Metadata = {
  title: "文章",
  description: "Screeps、JavaScript、系统架构与网站建设文章。",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogPage() {
  return <BlogArchive currentPage={1} />;
}
