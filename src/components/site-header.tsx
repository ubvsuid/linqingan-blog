import Link from "next/link";

import { siteConfig } from "@/lib/site";
import { Container } from "@/components/container";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Container className="header-inner">
        <Link href="/" className="brand" aria-label="林清安首页">
          <span className="brand-mark" aria-hidden="true">
            LQ
          </span>
          <span>{siteConfig.name}</span>
        </Link>

        <div className="header-actions">
          <nav className="site-nav" aria-label="主导航">
            {siteConfig.navigation.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}
