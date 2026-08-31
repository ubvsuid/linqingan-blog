import { TickLab } from "@/components/tick-lab/tick-lab";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Tick Lab: See What One Tick Does",
  description:
    "Use deterministic Creep.transfer() and StructureSpawn.spawnCreep() experiments to inspect return codes, intents, check order, and modeled Tick state while keeping the boundary from real Runtime Evidence explicit.",
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
    description: "A constrained deterministic lab for understanding Screeps transfer and spawnCreep return values, intents, check order, and Tick state transitions.",
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
