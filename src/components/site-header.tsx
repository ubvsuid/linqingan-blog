"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Container } from "@/components/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { beginnerSeriesSlugs } from "@/lib/beginner-series";
import { englishNavigation, getLanguageSwitchTarget, isEnglishPath } from "@/lib/i18n";
import { knowledgeBaseSlugs } from "@/lib/knowledge-base";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstNavigationLinkRef = useRef<HTMLAnchorElement>(null);
  const english = isEnglishPath(pathname);
  const navigation = english ? englishNavigation : siteConfig.navigation;
  const languageTarget = getLanguageSwitchTarget(pathname);
  const isBeginnerArticle = beginnerSeriesSlugs.some(
    (slug) => pathname === `/blog/${slug}`,
  );
  const isKnowledgeArticle = knowledgeBaseSlugs.some(
    (slug) => pathname === `/blog/${slug}`,
  );

  useEffect(() => {
    if (!menuOpen) return;

    firstNavigationLinkRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (
        headerRef.current &&
        event.target instanceof Node &&
        !headerRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [menuOpen]);

  function isActive(href: string): boolean {
    if (english) {
      if (href === "/en") return pathname === "/en";
      return pathname === href || pathname.startsWith(`${href}/`);
    }

    if (href === "/") return pathname === "/";

    if (href === "/beginner") {
      return pathname.startsWith("/beginner") || isBeginnerArticle;
    }

    if (href === "/blog") {
      return (
        pathname === "/blog" ||
        (pathname.startsWith("/blog/") &&
          !isBeginnerArticle &&
          !isKnowledgeArticle)
      );
    }

    if (href === "/knowledge") {
      return pathname.startsWith("/knowledge") || isKnowledgeArticle;
    }

    if (href === "/resources") {
      return (
        pathname === "/resources" ||
        pathname.startsWith("/resources/") ||
        pathname === "/glossary" ||
        pathname === "/screeps-errors" ||
        pathname.startsWith("/tags") ||
        pathname === "/search"
      );
    }

    if (href === "/now") {
      return pathname.startsWith("/now") || pathname.startsWith("/changelog");
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const homeHref = english ? "/en" : "/";
  const searchHref = english ? "/en/search" : "/search";
  const aboutHref = english ? "/en/about" : "/about";

  return (
    <header ref={headerRef} className="site-header">
      <Container className="header-inner">
        <Link
          href={homeHref}
          className="brand"
          aria-label={english ? "Return to English home" : "返回首页"}
          onClick={() => setMenuOpen(false)}
        >
          <Image className="brand-logo" src="/brand-logo.svg" alt="" width={80} height={72} priority />
        </Link>

        <div className="header-actions">
          <nav
            id="site-navigation"
            className={menuOpen ? "site-nav site-nav-open" : "site-nav"}
            aria-label={english ? "Primary navigation" : "主导航"}
          >
            {navigation.map((item, index) => {
              const active = isActive(item.href);
              return (
                <Link
                  ref={index === 0 ? firstNavigationLinkRef : undefined}
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
            <Link
              className="language-switch"
              href={languageTarget}
              hrefLang={english ? "zh-CN" : "en"}
              lang={english ? "zh-CN" : "en"}
              aria-label={english ? "切换到中文" : "Switch to English"}
              title={english ? "切换到中文" : "Switch to English"}
              onClick={() => setMenuOpen(false)}
            >
              {english ? "中文" : "EN"}
            </Link>
            <Link
              className="header-icon-link"
              href={searchHref}
              aria-label={english ? "Search the English site" : "搜索网站"}
              title={english ? "Search" : "搜索网站"}
              onClick={() => setMenuOpen(false)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
            </Link>
            <ThemeToggle />
            <Link
              className="profile-shortcut"
              href={aboutHref}
              aria-label={english ? "About Linqingan" : "查看临清安的个人主页"}
              title={english ? "About" : "个人主页"}
              onClick={() => setMenuOpen(false)}
            >
              <Image src="/profile-avatar.webp" alt="" width={36} height={36} />
            </Link>
            <button
              ref={menuButtonRef}
              type="button"
              className={menuOpen ? "menu-toggle menu-toggle-open" : "menu-toggle"}
              aria-controls="site-navigation"
              aria-expanded={menuOpen}
              aria-label={
                english
                  ? menuOpen ? "Close navigation menu" : "Open navigation menu"
                  : menuOpen ? "关闭导航菜单" : "打开导航菜单"
              }
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
        .header-inner { display: grid; grid-template-columns: 1fr auto 1fr; min-height: 92px; align-items: center; gap: 24px; }
        .brand { justify-self: start; }
        .brand-logo { width: 68px; height: 68px; object-fit: contain; transition: opacity 160ms ease; }
        .brand:hover .brand-logo { opacity: .72; }
        .header-actions { display: contents; }
        .site-nav { display: flex; grid-column: 2; justify-self: center; gap: clamp(15px, 1.7vw, 27px); font-size: clamp(14px, 1.15vw, 16px); }
        .site-nav a { position: relative; padding-block: 8px; white-space: nowrap; }
        .site-nav a::after { content: ""; position: absolute; right: 0; bottom: 2px; left: 0; height: 1px; transform: scaleX(0); transform-origin: center; background: var(--foreground); transition: transform 160ms ease; }
        .site-nav a.nav-link-active { color: var(--foreground); }
        .site-nav a.nav-link-active::after { transform: scaleX(1); }
        .header-controls { display: flex; grid-column: 3; align-items: center; justify-self: end; gap: 8px; }
        .header-icon-link, .profile-shortcut, .language-switch { display: inline-grid; min-width: 42px; height: 42px; place-items: center; border: 1px solid var(--border); border-radius: 999px; background: var(--surface); color: var(--foreground); transition: border-color 160ms ease, transform 160ms ease; }
        .language-switch { padding: 0 11px; font-size: 12px; font-weight: 750; letter-spacing: .04em; }
        .header-icon-link:hover, .profile-shortcut:hover, .language-switch:hover { transform: translateY(-1px); border-color: var(--muted); text-decoration: none; }
        .header-icon-link { width: 42px; }
        .header-icon-link svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; }
        .profile-shortcut { width: 42px; overflow: hidden; }
        .profile-shortcut img { width: 100%; height: 100%; object-fit: cover; }
        .menu-toggle { display: none; width: 42px; height: 42px; align-items: center; justify-content: center; flex-direction: column; gap: 4px; border: 1px solid var(--border); border-radius: 999px; background: var(--surface); color: var(--foreground); cursor: pointer; }
        .menu-toggle span { width: 15px; height: 1px; background: currentColor; transition: transform 160ms ease, opacity 160ms ease; }
        .menu-toggle-open span:first-child { transform: translateY(5px) rotate(45deg); }
        .menu-toggle-open span:nth-child(2) { opacity: 0; }
        .menu-toggle-open span:last-child { transform: translateY(-5px) rotate(-45deg); }
        html[data-theme="dark"] .brand-logo { filter: invert(1) brightness(1.15); }
        @media (max-width: 1080px) {
          .header-inner { display: grid; grid-template-columns: 1fr auto; gap: 10px 16px; min-height: 88px; padding: 12px 0; }
          .brand { grid-column: 1; grid-row: 1; }
          .brand-logo { width: 56px; height: 56px; }
          .header-controls { grid-column: 2; grid-row: 1; }
          .menu-toggle { display: inline-flex; }
          .site-nav { display: none; grid-column: 1 / -1; grid-row: 2; width: 100%; overflow: hidden; flex-direction: column; justify-self: stretch; gap: 0; border: 1px solid var(--border); border-radius: 16px; background: var(--surface); font-size: 16px; }
          .site-nav-open { display: flex; }
          .site-nav a { padding: 13px 18px; text-align: center; }
          .site-nav a + a { border-top: 1px solid var(--border); }
          .site-nav a::after { right: 18px; bottom: 7px; left: 18px; }
        }
        @media (max-width: 430px) {
          .profile-shortcut { display: none; }
          .header-controls { gap: 6px; }
          .header-icon-link { width: 40px; height: 40px; }
          .language-switch { min-width: 40px; height: 40px; padding: 0 9px; }
        }
      `}</style>
    </header>
  );
}
