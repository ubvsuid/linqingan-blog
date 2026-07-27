import { ImageResponse } from "next/og";

export const alt = "临清安 Screeps 新手入门：12 篇连续学习路线";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function BeginnerOpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#111", color: "#f5f3ed", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26 }}>
        <strong>临清安</strong><span style={{ color: "#aaa" }}>BEGINNER PATH</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 750, letterSpacing: "-0.055em" }}>Screeps 新手入门</div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 30, color: "#c7c7c7" }}>从第一只 Creep 到第一份房间基础代码</div>
        <div style={{ display: "flex", gap: 18, marginTop: 42, alignItems: "center" }}>
          {["01 认识游戏", "02 控制 Creep", "03 建立分工", "04 完成循环"].map((item) => (
            <span key={item} style={{ display: "flex", borderTop: "1px solid #666", paddingTop: 12, fontSize: 20 }}>{item}</span>
          ))}
        </div>
      </div>
    </div>,
    size,
  );
}
