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

const repositoryUrl = "https://github.com/ubvsuid/linqingan-blog";

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
    socialHandle: "@H_linqingan",
    email: "linqingan501@gmail.com",
  },
  navigation: [
    { label: "学习", href: "/beginner" },
    { label: "解决问题", href: "/diagnostics" },
    { label: "工具", href: "/tools" },
    { label: "验证", href: "/verification" },
    { label: "关于", href: "/about" },
  ],
  links: {
    x: "https://x.com/H_linqingan",
    facebook: "https://www.facebook.com/profile.php?id=61568376002140",
    github: "https://github.com/ubvsuid",
    repository: repositoryUrl,
    issues: `${repositoryUrl}/issues/new`,
  },
} as const;
