import Link from "next/link";

import { Container } from "@/components/container";
import { siteConfig } from "@/lib/site";

const learningLinks = [
  { href: "/beginner", label: "新手入门" },
  { href: "/knowledge", label: "知识库" },
  { href: "/blog", label: "全部文章" },
  { href: "/resources", label: "资料中心" },
];

const siteLinks = [
  { href: "/verification", label: "验证方法" },
  { href: "/projects", label: "项目" },
  { href: "/now", label: "近况" },
  { href: "/about", label: "关于" },
  { href: "/search", label: "站内搜索" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container className="footer-inner">
        <div className="footer-brand">
          <strong>{siteConfig.name}</strong>
          <p>构建，运行，迭代。</p>
          <p className="copyright">© {new Date().getFullYear()} {siteConfig.name}</p>
        </div>

        <nav className="footer-column" aria-label="页脚学习导航">
          <strong>学习</strong>
          {learningLinks.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </nav>

        <nav className="footer-column" aria-label="页脚网站导航">
          <strong>网站</strong>
          {siteLinks.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </nav>

        <div className="footer-column" aria-label="关注与联系">
          <strong>关注</strong>
          <Link href="/feed.xml">RSS</Link>
          <a href={siteConfig.links.github} rel="noreferrer" target="_blank">GitHub ↗</a>
          <a href={`mailto:${siteConfig.author.email}`}>Email</a>
        </div>
      </Container>

      <style>{`
        .site-footer .footer-inner {
          display: grid;
          grid-template-columns: minmax(240px, 1.4fr) repeat(3, minmax(120px, .6fr));
          gap: clamp(34px, 6vw, 76px);
          align-items: start;
          min-height: 0;
          padding: 58px 0 54px;
          color: var(--muted);
          font-size: 14px;
        }
        .footer-brand { display: grid; align-content: start; gap: 7px; }
        .footer-brand > strong { color: var(--foreground); font-size: 22px; letter-spacing: -.03em; }
        .footer-brand p { margin: 0; }
        .footer-brand .copyright { margin-top: 24px; white-space: normal; font-size: 12px; }
        .footer-column { display: grid; align-content: start; gap: 9px; }
        .footer-column > strong { margin-bottom: 5px; color: var(--foreground); font-size: 13px; }
        .footer-column a { width: fit-content; }
        @media (max-width: 880px) {
          .site-footer .footer-inner {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 34px 24px;
          }
          .footer-brand { grid-column: 1 / -1; border-bottom: 1px solid var(--border); padding-bottom: 30px; }
          .footer-brand .copyright { margin-top: 12px; }
        }
        @media (max-width: 560px) {
          .site-footer .footer-inner {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            padding: 42px 0;
          }
          .footer-column:last-child { grid-column: 1 / -1; border-top: 1px solid var(--border); padding-top: 28px; }
        }
      `}</style>
    </footer>
  );
}