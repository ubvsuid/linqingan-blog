import type { Metadata } from "next";

import { BeginnerArchive } from "@/components/beginner-archive";

export const metadata: Metadata = {
  title: "Screeps 新手入门",
  description:
    "按顺序阅读 Screeps 新手文章，从认识游戏到完成第一次采集与运输循环。",
  alternates: {
    canonical: "/beginner",
  },
};

export default function BeginnerPage() {
  return <BeginnerArchive currentPage={1} />;
}