import { TickLab } from "@/components/tick-lab/tick-lab";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Screeps Tick Lab｜逐 Tick 理解 Runtime",
  description:
    "用确定性互动实验理解 Screeps Creep.transfer()、StructureSpawn.spawnCreep() 与 Game.cpu CPU / Bucket 的返回码、Intent、预算边界与模型化 Tick 状态，并明确区分教学模型与真实 Runtime Evidence。",
  path: "/tick-lab",
});

export default function TickLabPage() {
  const pageUrl = `${siteConfig.url}/tick-lab`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Screeps Tick Lab",
    url: pageUrl,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    inLanguage: "zh-CN",
    isAccessibleForFree: true,
    description: "通过受控的确定性 transfer、spawnCreep 与 CPU / Bucket 实验逐 Tick 理解 Screeps API 返回值、Intent、CPU 预算边界与状态变化。",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TickLab language="zh" />
    </>
  );
}
