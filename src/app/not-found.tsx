import Link from "next/link";

import { Container } from "@/components/container";

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <Container>
        <p className="eyebrow">ERROR 404</p>
        <h1>这个页面不存在</h1>
        <p>它可能已经移动、被删除，或者网址输入有误。可以返回首页，也可以直接搜索文章、术语和错误码。</p>
        <div className="button-row">
          <Link href="/" className="button button-primary">
            返回首页
          </Link>
          <Link href="/search" className="button button-secondary">
            搜索网站
          </Link>
        </div>
      </Container>
    </main>
  );
}
