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
  const isBeginnerArticle = beginnerSeriesSlugs.some((slug) => pathname === `/blog/${slug}`);
  const isKnowledgeArticle = knowledgeBaseSlugs.some((slug) => pathname === `/blog/${slug}`);

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
      if (headerRef.current && event.target instanceof Node && !headerRef.current.contains(event.target)) {
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
      return pathname === href || pathname.startsWith(`${href}/`);
    }
    if (href === "/") return pathname === "/";
    if (href === "/beginner") return pathname.startsWith("/beginner") || isBeginnerArticle;
    if (href === "/blog") {
      return pathname === "/blog" || (pathname.startsWith("/blog/") && !isBeginnerArticle && !isKnowledgeArticle);
    }
    if (href === "/knowledge") return pathname.startsWith("/knowledge") || isKnowledgeArticle;
    if (href === "/resources") {
      return pathname === "/resources" || pathname.startsWith("/resources/") || pathname === "/glossary" || pathname === "/screeps-errors" || pathname.startsWith("/tags") || pathname === "/search";
    }
    if (href === "/now") return pathname.startsWith("/now") || pathname.startsWith("/changelog");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const homeHref = english ? "/en" : "/";
  const searchHref = english ? "/en/search" : "/search";
  const aboutHref = english ? "/en/about" : "/about";

  return (
    <header ref={headerRef} className="site-header" lang={english ? "en" : "zh-CN"}>
      <Container className="header-inner">
        <Link
          href={homeHref}
          className={english ? "brand brand-english" : "brand"}
          aria-label={english ? "Linqingan English Screeps home" : "返回首页"}
          onClick={() => setMenuOpen(false)}
        >
          <Image className="brand-logo" src="/brand-logo.svg" alt="" width={80} height={72} sizes="68px" />
          {english ? (
            <span className="brand-copy"><strong>Linqingan</strong><small>Screeps Guides &amp; Tools</small></span>
          ) : null}
        </Link>

        <div className="header-actions">
          <nav id="site-navigation" className={menuOpen ? "site-nav site-nav-open" : "site-nav"} aria-label={english ? "Primary navigation" : "主导航"}>
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
            <Link className="language-switch" href={languageTarget} hrefLang={english ? "zh-CN" : "en"} lang={english ? "zh-CN" : "en"} aria-label={english ? "Switch to Chinese" : "Switch to English"} title={english ? "Switch to Chinese" : "Switch to English"} onClick={() => setMenuOpen(false)}>
              {english ? "中文" : "EN"}
            </Link>
            <Link className="header-icon-link" href={searchHref} aria-label={english ? "Search the English site" : "搜索网站"} title={english ? "Search" : "搜索网站"} onClick={() => setMenuOpen(false)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
            </Link>
            <ThemeToggle />
            {!english ? (
              <Link className="profile-shortcut" href={aboutHref} aria-label="查看临清安的个人主页" title="个人主页" onClick={() => setMenuOpen(false)}>
                <Image src="/profile-avatar.webp" alt="" width={36} height={36} sizes="36px" />
              </Link>
            ) : null}
            <button
              ref={menuButtonRef}
              type="button"
              className={menuOpen ? "menu-toggle menu-toggle-open" : "menu-toggle"}
              aria-controls="site-navigation"
              aria-expanded={menuOpen}
              aria-label={english ? (menuOpen ? "Close navigation menu" : "Open navigation menu") : (menuOpen ? "关闭导航菜单" : "打开导航菜单")}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
            </button>
          </div>
        </div>
      </Container>
    </header>
  );
}
