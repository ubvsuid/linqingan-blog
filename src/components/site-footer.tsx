import Link from "next/link";

import { Container } from "@/components/container";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container className="footer-inner">
        <div>
          <strong>{siteConfig.name}</strong>
          <p>构建，运行，迭代。</p>
        </div>

        <div className="footer-links">
          <Link href="/blog">文章</Link>
          <Link href="/feed.xml">RSS</Link>
          <a href={siteConfig.links.github} rel="noreferrer" target="_blank">
            GitHub
          </a>
          <a href={`mailto:${siteConfig.author.email}`}>Email</a>
        </div>

        <p className="copyright">
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
      </Container>
    </footer>
  );
}
