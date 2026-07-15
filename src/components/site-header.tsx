import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Container className="header-inner">
        <Link
          href="/"
          className="brand"
          aria-label={`${siteConfig.name}首页`}
        >
          <Image
            className="brand-logo"
            src="/brand-logo.svg"
            alt={siteConfig.name}
            width={224}
            height={60}
            priority
          />
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

      <style>{`
        .brand-logo {
          width: 168px;
          height: auto;
          transition: opacity 160ms ease;
        }

        .brand:hover .brand-logo {
          opacity: 0.72;
        }

        html[data-theme="dark"] .brand-logo {
          filter: invert(1) brightness(1.15);
        }

        @media (max-width: 600px) {
          .brand-logo {
            width: 148px;
          }
        }
      `}</style>
    </header>
  );
}
