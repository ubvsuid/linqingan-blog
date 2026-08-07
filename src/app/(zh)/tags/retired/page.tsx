import Link from "next/link";

import { Container } from "@/components/container";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "细粒度标签已收敛",
  description:
    "这个标签只用于描述单篇文章，不再建立独立归档页。请返回文章标签中心、知识库或站内搜索继续查找相关内容。",
  path: "/tags/retired",
  noindex: true,
});

export default function RetiredTagPage() {
  return (
    <main className="page-shell">
      <Container className="narrow-container">
        <header className="page-header">
          <p className="eyebrow">TAG GOVERNANCE</p>
          <h1>这个细粒度标签不再单独建页</h1>
          <p>
            为避免大量只有一篇文章的薄标签页，这类标签仍保留在文章中作为描述，但不再作为独立内容分类。可以从长期主题标签、知识模块或站内搜索继续查找。
          </p>
          <div className="button-row">
            <Link className="button button-primary" href="/tags">
              返回文章标签
            </Link>
            <Link className="button button-secondary" href="/knowledge">
              浏览知识库
            </Link>
            <Link className="button button-secondary" href="/search">
              站内搜索
            </Link>
          </div>
        </header>
      </Container>
    </main>
  );
}
