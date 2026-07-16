import type { Metadata } from "next";

import { BeginnerArchive } from "@/components/beginner-archive";

export const metadata: Metadata = {
  title: "Screeps 新手入门",
  description:
    "按顺序阅读 Screeps 新手文章，从认识游戏、界面和 tick，到采集、运输、身体部件与创建 Creep。",
  alternates: {
    canonical: "/beginner",
  },
};

export default function BeginnerPage() {
  return <BeginnerArchive currentPage={1} />;
}
