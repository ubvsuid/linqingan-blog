import Link from "next/link";

import { Container } from "@/components/container";
import { GlossaryExplorer } from "@/components/glossary-explorer";
import { createPageMetadata } from "@/lib/metadata";
import { screepsGlossary } from "@/lib/screeps-glossary";

export const metadata = createPageMetadata({
  title: "Screeps 术语表",
  description: "面向新手解释 Creep、Spawn、Source、Controller、RCL、Memory、tick 等常见 Screeps 术语。",
  path: "/glossary",
});

export default function GlossaryPage() {
  return (
    <main className="page-shell">
      <Container>
        <nav className="resource-breadcrumb" aria-label="面包屑"><Link href="/resources">资料中心</Link><span aria-hidden="true">/</span><span>术语表</span></nav>
        <header className="page-header"><p className="eyebrow">GLOSSARY</p><h1>Screeps 术语表</h1><p>遇到不熟悉的英文对象或玩家常用说法时，可以在这里先看一个新手版本的解释，再进入相关教程。</p></header>
        <GlossaryExplorer entries={screepsGlossary} />
      </Container>
      <style>{`.resource-breadcrumb { display: flex; gap: 10px; margin-bottom: 28px; color: var(--muted); font-size: 13px; }.resource-breadcrumb a:hover { color: var(--foreground); }`}</style>
    </main>
  );
}
