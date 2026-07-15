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
            alt=""
            width={80}
            height={72}
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
        .header-inner {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          min-height: 92px;
          align-items: center;
          gap: 28px;
        }

        .brand {
          justify-self: start;
        }

        .brand-logo {
          width: 68px;
          height: 68px;
          object-fit: contain;
          transition: opacity 160ms ease;
        }

        .brand:hover .brand-logo {
          opacity: 0.72;
        }

        .header-actions {
          display: contents;
        }

        .site-nav {
          grid-column: 2;
          justify-self: center;
          gap: 34px;
          font-size: 17px;
        }

        .theme-toggle {
          grid-column: 3;
          justify-self: end;
        }

        html[data-theme="dark"] .brand-logo {
          filter: invert(1) brightness(1.15);
        }

        @media (max-width: 860px) {
          .header-inner {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 14px 20px;
            padding: 14px 0;
          }

          .brand {
            grid-column: 1;
            grid-row: 1;
          }

          .brand-logo {
            width: 56px;
            height: 56px;
          }

          .theme-toggle {
            grid-column: 2;
            grid-row: 1;
          }

          .site-nav {
            grid-column: 1 / -1;
            grid-row: 2;
            justify-self: center;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px 22px;
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .site-nav {
            gap: 10px 16px;
            font-size: 15px;
          }
        }
      `}</style>
    </header>
  );
}
