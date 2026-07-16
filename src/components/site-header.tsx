"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Container } from "@/components/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { beginnerSeriesSlugs } from "@/lib/beginner-series";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isBeginnerArticle = beginnerSeriesSlugs.some(
    (slug) => pathname === `/blog/${slug}`,
  );

  function isActive(href: string): boolean {
    if (href === "/") {
      return pathname === "/";
    }

    if (href === "/beginner") {
      return pathname.startsWith("/beginner") || isBeginnerArticle;
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
          onClick={() => setMenuOpen(false)}
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
          <nav
            id="site-navigation"
            className={menuOpen ? "site-nav site-nav-open" : "site-nav"}
            aria-label="主导航"
          >
            {siteConfig.navigation.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  className={active ? "nav-link-active" : undefined}
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="header-controls">
            <ThemeToggle />
            <button
              type="button"
              className="menu-toggle"
              aria-controls="site-navigation"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "关闭导航菜单" : "打开导航菜单"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>
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
          display: flex;
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

        .header-controls {
          display: flex;
          grid-column: 3;
          align-items: center;
          justify-self: end;
          gap: 10px;
        }

        .menu-toggle {
          display: none;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 4px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--surface);
          color: var(--foreground);
          cursor: pointer;
        }

        .menu-toggle span {
          width: 15px;
          height: 1px;
          background: currentColor;
          transition: transform 160ms ease;
        }

        html[data-theme="dark"] .brand-logo {
          filter: invert(1) brightness(1.15);
        }

        @media (max-width: 860px) {
          .header-inner {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 10px 16px;
            min-height: 88px;
            padding: 12px 0;
          }

          .brand {
            grid-column: 1;
            grid-row: 1;
          }

          .brand-logo {
            width: 56px;
            height: 56px;
          }

          .header-controls {
            grid-column: 2;
            grid-row: 1;
          }

          .menu-toggle {
            display: inline-flex;
          }

          .site-nav {
            display: none;
            grid-column: 1 / -1;
            grid-row: 2;
            width: 100%;
            overflow: hidden;
            flex-direction: column;
            justify-self: stretch;
            gap: 0;
            border: 1px solid var(--border);
            border-radius: 16px;
            background: var(--surface);
            font-size: 16px;
          }

          .site-nav-open {
            display: flex;
          }

          .site-nav a {
            padding: 13px 18px;
            text-align: center;
          }

          .site-nav a + a {
            border-top: 1px solid var(--border);
          }

          .site-nav a::after {
            right: 18px;
            bottom: 7px;
            left: 18px;
          }
        }
      `}</style>
    </header>
  );
}
