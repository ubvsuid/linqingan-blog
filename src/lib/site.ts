export const siteConfig = {
  name: "林清安",
  title: "林清安的数字花园",
  description:
    "记录 Screeps 自动化、JavaScript、系统架构、网站建设与个人成长。",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://linqingan.com",
  locale: "zh_CN",
  language: "zh-CN",
  author: {
    name: "林清安",
    handle: "@linqingan501",
    email: "linqingan501@gmail.com",
  },
  navigation: [
    { label: "首页", href: "/" },
    { label: "文章", href: "/blog" },
    { label: "项目", href: "/projects" },
    { label: "近况", href: "/now" },
    { label: "关于", href: "/about" },
  ],
  links: {
    github: "",
  },
} as const;
