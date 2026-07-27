import { siteConfig } from "@/lib/site";

const englishStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteConfig.url}/en#person`,
      name: "Linqingan",
      alternateName: [siteConfig.author.name, siteConfig.author.handle],
      url: `${siteConfig.url}/en/about`,
      image: `${siteConfig.url}/profile-avatar.webp`,
      email: `mailto:${siteConfig.author.email}`,
      sameAs: [siteConfig.links.github],
      knowsAbout: ["Screeps", "JavaScript", "debugging", "game automation", "technical documentation"],
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/en#website`,
      url: `${siteConfig.url}/en`,
      name: "Linqingan Screeps Guides & Tools",
      alternateName: "Linqingan",
      description: "Practical English Screeps guides, debugging workflows, references, and browser-based tools.",
      inLanguage: "en",
      author: { "@id": `${siteConfig.url}/en#person` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteConfig.url}/en/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="english-root" lang="en">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(englishStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      {children}
    </div>
  );
}
