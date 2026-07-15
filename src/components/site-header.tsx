"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Container } from "@/components/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { beginnerSeriesSlugs } from "@/lib/beginner-series";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const isBeginnerArticle = beginnerSeriesSlugs.some(
    (slug) => pathname === `/blog/${slug}`,
  );

  function isActive(href: string): boolean {
    if (href === "/") {
      return pathname === "/";
    }

    if (href === "/beginner") {
      return pathname === "/beginner" || isBeginnerArticle;
    }

    if (href === "/blog") {
      return (
        pathname === "/blog" ||
        (pathname.startsWith("/blog/") && !isBeginnerArticle)
      );
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

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
            {siteConfig.navigation.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  className={active ? "nav-link-active" : undefined}
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
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

        .site-nav a {
          position: relative;
          padding-block: 8px;
        }

        .site-nav a::after {
          content: "";
          position: absolute;
          right: 0;
          bottom: 2px;
          left: 0;
          height: 1px;
          transform: scaleX(0);
          transform-origin: center;
          background: var(--foreground);
          transition: transform 160ms ease;
        }

        .site-nav a.nav-link-active {
          color: var(--foreground);
        }

        .site-nav a.nav-link-active::after {
          transform: scaleX(1);
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
