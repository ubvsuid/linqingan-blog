import { ImageResponse } from "next/og";

export const alt = "临清安 Screeps 知识库：新手路线、专题模块与查询工具";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function KnowledgeOpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#f4f2ec", color: "#111", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26 }}>
        <strong>临清安</strong><span style={{ color: "#666" }}>SCREEPS KNOWLEDGE BASE</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 82, fontWeight: 750, letterSpacing: "-0.055em" }}>Screeps 知识库</div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 28, color: "#555" }}>12 篇新手路线 · 8 个专题模块 · 查询与工具</div>
        <div style={{ display: "flex", gap: 12, marginTop: 38 }}>
          {["Memory", "Spawn", "Economy", "Pathfinding", "Defense", "Debugging"].map((item) => (
            <span key={item} style={{ display: "flex", border: "1px solid #bbb", borderRadius: 999, padding: "9px 15px", fontSize: 20 }}>{item}</span>
          ))}
        </div>
      </div>
    </div>,
    size,
  );
}
