import { TickLab } from "@/components/tick-lab/tick-lab";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Screeps Tick Lab｜逐 Tick 理解 Runtime",
  description:
    "用确定性互动实验理解 Screeps Creep.transfer() 的返回码、Intent 与 Tick 前后状态。V1 明确区分教学模型与真实 Runtime Evidence。",
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
    description: "通过受控的确定性实验逐 Tick 理解 Screeps API 返回值、Intent 与状态变化。",
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
