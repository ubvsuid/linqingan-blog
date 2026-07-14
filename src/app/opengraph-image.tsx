import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site";

export const alt = siteConfig.title;

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#f4f2ec",
          color: "#111111",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 28,
            letterSpacing: "-0.02em",
          }}
        >
          LINQINGAN.COM
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "980px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 82,
              lineHeight: 1.05,
              fontWeight: 700,
              letterSpacing: "-0.055em",
            }}
          >
            <div
              style={{
                display: "flex",
              }}
            >
              用代码构建
            </div>

            <div
              style={{
                display: "flex",
              }}
            >
              持续运行的系统
            </div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 32,
              fontSize: 28,
              color: "#555555",
            }}
          >
            Screeps · JavaScript · Architecture
          </div>
        </div>
      </div>
    ),
    size,
  );
}