import { TickLab } from "@/components/tick-lab/tick-lab";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Tick Lab: See What One Tick Does",
  description:
    "Use deterministic Creep.transfer(), StructureSpawn.spawnCreep(), and Game.cpu CPU / Bucket experiments to inspect returns, intents, CPU budget boundaries, and modeled Tick state while keeping the boundary from real Runtime Evidence explicit.",
  path: "/en/tick-lab",
  chinesePath: "/tick-lab",
});

export default function EnglishTickLabPage() {
  const pageUrl = `${siteConfig.url}/en/tick-lab`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Screeps Tick Lab",
    url: pageUrl,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    inLanguage: "en",
    isAccessibleForFree: true,
    description: "A constrained deterministic lab for understanding Screeps transfer, spawnCreep, and Game.cpu CPU / Bucket behavior across API returns, intents, budget boundaries, and modeled Tick state.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TickLab language="en" />
    </>
  );
}
