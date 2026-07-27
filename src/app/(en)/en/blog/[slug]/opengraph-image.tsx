import { ImageResponse } from "next/og";

import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Linqingan English Screeps guide";

interface EnglishArticleOpenGraphImageProps {
  params: Promise<{ slug: string }>;
}

export default async function EnglishArticleOpenGraphImage({ params }: EnglishArticleOpenGraphImageProps) {
  const { slug } = await params;
  const article = getEnglishDiscoveryArticle(`/en/blog/${slug}`);
  const title = article?.title ?? "English Screeps Guide";
  const moduleTitle = article?.moduleTitle ?? "Screeps Guides and Tools";
  const labels = article ? [article.difficulty, article.contentType, article.readingTime] : ["Verified", "Practical", "English"];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0d10",
          color: "#f4f5f7",
          padding: "68px 76px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 54, height: 54, border: "2px solid #f4f5f7", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 25, fontWeight: 800 }}>L</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 25, fontWeight: 800 }}>Linqingan</span>
              <span style={{ marginTop: 4, color: "#a8adb5", fontSize: 15 }}>Screeps Guides &amp; Tools</span>
            </div>
          </div>
          <div style={{ border: "1px solid #454b55", borderRadius: 999, padding: "10px 16px", color: "#c9cdd3", fontSize: 15 }}>ENGLISH GUIDE</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 1000 }}>
          <span style={{ color: "#9ca3ad", fontSize: 20, letterSpacing: 1.5, textTransform: "uppercase" }}>{moduleTitle}</span>
          <h1 style={{ margin: "20px 0 0", fontSize: title.length > 62 ? 50 : 60, lineHeight: 1.08, letterSpacing: -2.5 }}>{title}</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #353a42", paddingTop: 25 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {labels.map((label) => <span key={label} style={{ border: "1px solid #454b55", borderRadius: 999, padding: "8px 13px", color: "#c9cdd3", fontSize: 14 }}>{label}</span>)}
          </div>
          <span style={{ color: "#8f96a0", fontSize: 15 }}>linqingan.com</span>
        </div>
      </div>
    ),
    size,
  );
}
