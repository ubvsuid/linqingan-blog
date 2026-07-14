import Link from "next/link";

import { Container } from "@/components/container";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container className="footer-inner">
        <div>
          <strong>{siteConfig.name}</strong>
          <p>用代码构建持续运行的系统。</p>
        </div>

        <div className="footer-links">
          <Link href="/feed.xml">RSS</Link>
          <a href={`mailto:${siteConfig.author.email}`}>Email</a>
        </div>

        <p className="copyright">
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
      </Container>
    </footer>
  );
}
