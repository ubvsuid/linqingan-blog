import type { Metadata } from "next";

import { Container } from "@/components/container";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <main className="minimal-home">
      <Container className="minimal-home-inner">
        <h1>构建，运行，迭代</h1>
        <p>Screeps 与系统实践。</p>
      </Container>

      <style>{`
        .minimal-home {
          min-height: calc(100vh - 92px);
          overflow: hidden;
        }

        .minimal-home-inner {
          display: flex;
          min-height: calc(100vh - 92px);
          flex-direction: column;
          align-items: center;
          padding-top: clamp(84px, 13vh, 150px);
          text-align: center;
        }

        .minimal-home h1 {
          margin: 0;
          font-size: clamp(32px, 6.4vw, 96px);
          font-weight: 680;
          line-height: 1.08;
          letter-spacing: -0.055em;
          white-space: nowrap;
        }

        .minimal-home p {
          margin: 28px 0 0;
          color: var(--muted);
          font-size: clamp(18px, 2vw, 26px);
          letter-spacing: 0.01em;
        }

        @media (max-width: 860px) {
          .minimal-home,
          .minimal-home-inner {
            min-height: calc(100vh - 148px);
          }

          .minimal-home-inner {
            padding-top: clamp(70px, 11vh, 110px);
          }
        }

        @media (max-width: 480px) {
          .minimal-home h1 {
            font-size: clamp(30px, 9vw, 42px);
          }

          .minimal-home p {
            margin-top: 20px;
            font-size: 17px;
          }
        }
      `}</style>
    </main>
  );
}
