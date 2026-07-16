import { NowArchive } from "@/components/now-archive";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "近况",
  description:
    "查看临清安最近在 Screeps 内容、个人网站与系统实践方面正在推进的工作。",
  path: "/now",
});

export default function NowPage() {
  return <NowArchive currentPage={1} />;
}
