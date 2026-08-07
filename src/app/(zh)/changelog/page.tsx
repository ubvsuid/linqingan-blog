import { ChangelogArchive } from "@/components/changelog-archive";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "更新日志",
  description:
    "查看临清安网站、Screeps 内容、工具、SEO 与验证流程中的具体更新记录，包括早期合并资料中心与项目页面等结构调整。",
  path: "/changelog",
});

export default function ChangelogPage() {
  return <ChangelogArchive currentPage={1} />;
}
