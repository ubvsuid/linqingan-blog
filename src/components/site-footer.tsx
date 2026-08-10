"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Container } from "@/components/container";
import { getLanguageSwitchTarget, isEnglishPath } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";

const chineseLearningLinks = [
  { href: "/beginner", label: "新手入门" },
  { href: "/knowledge", label: "知识库" },
  { href: "/blog", label: "全部文章" },
  { href: "/screeps-api", label: "API 快速查询" },
  { href: "/glossary", label: "术语表" },
];

const chineseSiteLinks = [
  { href: "/screeps-errors", label: "错误码" },
  { href: "/verification", label: "验证方法" },
  { href: "/verified", label: "最近验证" },
  { href: "/tags", label: "文章标签" },
  { href: "/now", label: "近况" },
  { href: "/changelog", label: "更新日志" },
  { href: "/about", label: "关于" },
  { href: "/search", label: "站内搜索" },
];

const englishLearningLinks = [
  { href: "/en/beginner", label: "Beginner Roadmap" },
  { href: "/en/knowledge", label: "Knowledge Base" },
  { href: "/en/blog", label: "Guide Library" },
  { href: "/en/screeps-api", label: "API Quick Reference" },
  { href: "/en/tools", label: "Tools" },
  { href: "/en/glossary", label: "Glossary" },
];

const englishSiteLinks = [
  { href: "/en/tags", label: "Topics" },
  { href: "/en/screeps-errors", label: "Error Codes" },
  { href: "/en/verification", label: "Verification Method" },
  { href: "/en/verified", label: "Recently Verified" },
  { href: "/en/changelog", label: "Changelog" },
  { href: "/en/roadmap", label: "Roadmap" },
  { href: "/en/license", label: "Content and Code Use" },
  { href: "/en/about", label: "About" },
  { href: "/en/search", label: "Site Search" },
];

export function SiteFooter() {
  const pathname = usePathname();
  const english = isEnglishPath(pathname);
  const learningLinks = english ? englishLearningLinks : chineseLearningLinks;
  const siteLinks = english ? englishSiteLinks : chineseSiteLinks;
  const languageTarget = getLanguageSwitchTarget(pathname);

  return (
    <footer className="site-footer" lang={english ? "en" : "zh-CN"}>
      <Container className="footer-inner">
        <div className="footer-brand">
          <strong>{english ? "Linqingan" : siteConfig.name}</strong>
          <p>{english ? "Practical Screeps guides, transparent verification, debugging workflows, and browser-based tools." : "构建，运行，迭代。"}</p>
          {english ? <p className="footer-status"><span aria-hidden="true" /> Public project · See the changelog for current interface updates</p> : null}
          <p className="copyright">© {new Date().getFullYear()} {english ? "Linqingan" : siteConfig.name}</p>
        </div>

        <nav className="footer-column" aria-label={english ? "Learning links" : "页脚学习导航"}>
          <strong>{english ? "Learn" : "学习"}</strong>
          {learningLinks.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </nav>

        <nav className="footer-column" aria-label={english ? "Site links" : "页脚网站导航"}>
          <strong>{english ? "Site" : "网站"}</strong>
          {siteLinks.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
          <Link href={languageTarget} hrefLang={english ? "zh-CN" : "en"}>
            {english ? "中文版" : "English version"}
          </Link>
        </nav>

        <div className="footer-column" aria-label={english ? "Contact links" : "关注与联系"}>
          <strong>{english ? "Connect" : "关注"}</strong>
          <Link href={english ? "/en/feed.xml" : "/feed.xml"}>{english ? "English RSS" : "RSS"}</Link>
          {english ? <Link href="/feed.xml">Chinese RSS</Link> : null}
          <a href={siteConfig.links.github} rel="noreferrer" target="_blank">GitHub ↗</a>
          {english ? <a href={siteConfig.links.issues} rel="noreferrer" target="_blank">Report an issue ↗</a> : null}
          <a href={`mailto:${siteConfig.author.email}`}>Email</a>
        </div>
      </Container>
    </footer>
  );
}
