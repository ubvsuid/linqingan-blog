import { BeginnerArchive } from "@/components/beginner-archive";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Screeps 新手入门",
  description:
    "按顺序学习 Screeps：从认识游戏、控制 Creep 和采集运输，到角色分工、升级 Controller、建造 Extension 与整理第一份房间代码。",
  path: "/beginner",
});

export default function BeginnerPage() {
  return <BeginnerArchive currentPage={1} />;
}
