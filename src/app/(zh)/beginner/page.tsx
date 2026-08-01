import { BeginnerArchive } from "@/components/beginner-archive";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Screeps 新手入门",
  description:
    "按顺序完成 12 篇 Screeps 新手路线：从认识游戏、控制 Creep 和采集运输，到角色分工、升级 Controller、建造 Extension 与整理第一份房间代码。",
  path: "/beginner",
});

export default function BeginnerPage() {
  return (
    <>
      <style>{`
        .beginner-stage-heading,
        .beginner-item,
        .beginner-complete {
          content-visibility: auto;
        }

        .beginner-stage-heading {
          contain-intrinsic-size: auto 150px;
        }

        .beginner-item {
          contain-intrinsic-size: auto 150px;
        }

        .beginner-complete {
          contain-intrinsic-size: auto 360px;
        }
      `}</style>
      <BeginnerArchive />
    </>
  );
}
