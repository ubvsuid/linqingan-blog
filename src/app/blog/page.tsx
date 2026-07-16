import type { Metadata } from "next";

import { BlogArchive } from "@/components/blog-archive";

export const metadata: Metadata = {
  title: "文章",
  description: "文章内容将在后续更新。",
  alternates: {
    canonical: "/blog",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function BlogPage() {
  return <BlogArchive currentPage={1} />;
}
