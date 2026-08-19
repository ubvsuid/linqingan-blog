import { ImageResponse } from "next/og";

import { getAllPosts, getPostBySlug } from "@/lib/posts";

export const alt = "Screeps 中文技术文章｜临清安";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function ArticleOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const title = post?.title ?? "Screeps 中文知识库";
  const category = post?.category ?? "临清安";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#10110f",
        color: "#f5f2e8",
        fontFamily: "Arial, sans-serif",
        padding: "72px 78px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.15,
          backgroundImage:
            "linear-gradient(#d6a84f 1px, transparent 1px), linear-gradient(90deg, #d6a84f 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            letterSpacing: 2,
            color: "#e5b95e",
          }}
        >
          <span>SCREEPS · 中文知识库</span>
          <span>临清安</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 980 }}>
          <div style={{ fontSize: 24, color: "#c8c4b8" }}>{category}</div>
          <div
            style={{
              fontSize: title.length > 34 ? 58 : 68,
              lineHeight: 1.16,
              fontWeight: 760,
              letterSpacing: -2,
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 25, color: "#c8c4b8" }}>
          <span style={{ width: 16, height: 16, borderRadius: 999, background: "#e5b95e" }} />
          www.linqingan.com
        </div>
      </div>
    </div>,
    size,
  );
}
