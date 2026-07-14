# 林清安个人博客 · Clean V1

一套不依赖第三方博客主题的 Next.js App Router 个人博客。

## 已包含

- 首页、文章、项目、近况、关于页面
- 本地 Markdown 文章系统
- 文章草稿、精选文章、分类和标签
- SEO Metadata、JSON-LD、Sitemap、robots.txt
- RSS Feed
- 深色/浅色模式
- 响应式布局
- 自定义 404 和错误页
- Vercel 部署配置友好

## 环境要求

- Node.js 20.9 或更高版本
- npm 10 或更高版本

## 启动

```bash
npm install
npm run dev
```

打开 <http://localhost:3000>。

## 发布前检查

```bash
npm run check
```

## 发布文章

在 `content/posts/` 新建 `.md` 文件。文件名就是 URL slug，例如：

```text
content/posts/my-first-post.md
→ /blog/my-first-post
```

文章头部格式：

```yaml
---
title: "文章标题"
description: "文章摘要"
publishedAt: "2026-07-14"
updatedAt: "2026-07-14"
category: "Screeps"
tags:
  - "Screeps"
  - "JavaScript"
draft: false
featured: true
---
```

## 需要优先修改

1. `src/lib/site.ts`：网站名称、说明、社交链接。
2. `src/app/about/page.tsx`：个人介绍。
3. `src/app/projects/page.tsx`：项目资料。
4. `content/posts/`：替换示例文章。
5. `src/app/opengraph-image.tsx`：分享图文字。

迁移旧项目请阅读 `MIGRATION.md`。
