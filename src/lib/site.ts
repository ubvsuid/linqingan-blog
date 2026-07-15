export const siteConfig = {
  name: "临清安",
  title: "临清安的数字花园",
  description:
    "记录 Screeps 自动化系统、JavaScript 工程实践、软件架构与真实开发过程。",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://linqingan.com",
  locale: "zh_CN",
  language: "zh-CN",
  author: {
    name: "临清安",
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
    github: "https://github.com/ubvsuid",
  },
} as const;
