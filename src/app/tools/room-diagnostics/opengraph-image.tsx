import { ImageResponse } from "next/og";

export const alt = "Screeps 房间运行诊断工具｜临清安";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function RoomDiagnosticsOpenGraphImage() {
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
          opacity: 0.16,
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
            color: "#e5b95e",
            fontSize: 25,
            letterSpacing: 2,
          }}
        >
          <span>SCREEPS · TOOL</span>
          <span>临清安</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 980 }}>
          <div style={{ color: "#c8c4b8", fontSize: 25 }}>ROOM DIAGNOSTICS</div>
          <div
            style={{
              fontSize: 70,
              lineHeight: 1.14,
              fontWeight: 760,
              letterSpacing: -2,
            }}
          >
            Screeps 房间运行诊断
          </div>
          <div style={{ color: "#c8c4b8", fontSize: 28, lineHeight: 1.5 }}>
            Spawn · Energy · Controller · 工地 · CPU 风险
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#c8c4b8", fontSize: 24 }}>
          <span style={{ width: 16, height: 16, borderRadius: 999, background: "#e5b95e" }} />
          www.linqingan.com/tools/room-diagnostics
        </div>
      </div>
    </div>,
    size,
  );
}
