const DEFAULT_SITE_URL = "https://www.linqingan.com";

function normalizeSiteUrl(value: string | undefined): string {
  const candidate = value?.trim() || DEFAULT_SITE_URL;

  try {
    const url = new URL(candidate);

    if (url.hostname === "linqingan.com") {
      url.hostname = "www.linqingan.com";
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const siteConfig = {
  name: "临清安",
  title: "临清安",
  description:
    "记录 Screeps 中文学习路线、自动化系统、JavaScript 工程实践与真实开发过程。",
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  locale: "zh_CN",
  language: "zh-CN",
  author: {
    name: "临清安",
    handle: "@linqingan501",
    email: "linqingan501@gmail.com",
  },
  navigation: [
    { label: "首页", href: "/" },
    { label: "入门", href: "/beginner" },
    { label: "文章", href: "/blog" },
    { label: "资料", href: "/resources" },
    { label: "项目", href: "/projects" },
    { label: "近况", href: "/now" },
    { label: "关于", href: "/about" },
  ],
  links: {
    github: "https://github.com/ubvsuid",
  },
} as const;
