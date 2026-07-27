import { ImageResponse } from "next/og";

export const alt = "Screeps Creep 身体计算器：成本、生成时间与移动速度";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function BodyCalculatorOpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#f4f2ec", color: "#111", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26 }}>
        <strong>临清安</strong><span style={{ color: "#666" }}>SCREEPS TOOL</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 74, fontWeight: 750, letterSpacing: "-0.055em" }}>Creep 身体计算器</div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 28, color: "#555" }}>Energy 成本 · 生成时间 · 携带容量 · 满载移动</div>
        <div style={{ display: "flex", gap: 12, marginTop: 38 }}>
          {["WORK", "CARRY", "MOVE", "ATTACK", "HEAL", "CLAIM"].map((item) => (
            <span key={item} style={{ display: "flex", border: "1px solid #aaa", borderRadius: 12, padding: "12px 16px", fontFamily: "monospace", fontSize: 22 }}>{item}</span>
          ))}
        </div>
      </div>
    </div>,
    size,
  );
}
