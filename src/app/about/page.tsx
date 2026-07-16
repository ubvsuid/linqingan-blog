import type { Metadata } from "next";

import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "关于",
  description: "关于页面内容将在后续更新。",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <main className="page-shell">
      <Container className="narrow-container">
        <header className="page-header">
          <p className="eyebrow">ABOUT</p>
          <h1>关于</h1>
        </header>
      </Container>
    </main>
  );
}
