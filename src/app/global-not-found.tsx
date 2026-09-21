import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/container";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";
import "./site-shell.css";

export const metadata: Metadata = {
  title: { absolute: "Page not found / 页面不存在 | Linqingan" },
  description: "This page does not exist. 页面不存在，请返回首页或使用站内搜索。",
  robots: { index: false, follow: false },
};

/**
 * Next.js renders this document without either language root layout.
 * Keep the shared Shell and both language escape routes visible in the
 * server-rendered 404 response; locale-specific segment not-found pages
 * continue to own explicit notFound() errors on matched routes.
 */
export default function GlobalNotFound() {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main-content">跳到正文 / Skip to content</a>
        <SiteHeader />
        <div id="main-content" className="site-content">
          <main className="not-found monochrome-system-page">
            <Container>
              <p className="eyebrow">ERROR 404</p>
              <h1>这个页面不存在</h1>
              <p>网址可能输入有误，或页面已经移动。你可以返回首页或搜索网站。</p>
              <div className="button-row" aria-label="中文导航">
                <Link href="/" className="button button-primary">返回首页</Link>
                <Link href="/search" className="button button-secondary">搜索网站</Link>
              </div>
              <section lang="en" aria-label="English page not found">
                <h2>Page not found</h2>
                <p>The address may be incorrect or the page may have moved. Return to the English home or search the site.</p>
                <div className="button-row" aria-label="English navigation">
                  <Link href="/en" className="button button-secondary">English home</Link>
                  <Link href="/en/search" className="button button-secondary">Search the site</Link>
                </div>
              </section>
            </Container>
          </main>
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
