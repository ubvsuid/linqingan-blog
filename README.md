# 临清安个人博客 · Clean V1

一套不依赖第三方博客主题的 Next.js App Router 个人博客，用于记录 Screeps 自动化、JavaScript 工程实践、软件架构和真实开发过程。

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

Windows PowerShell 如果阻止 `npm.ps1`，可以使用：

```powershell
npm.cmd run dev
```

## 发布前检查

```bash
npm run check
```

PowerShell 中可以使用：

```powershell
npm.cmd run check
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
publishedAt: "2026-07-15"
updatedAt: "2026-07-15"
category: "Screeps"
tags:
  - "Screeps"
  - "JavaScript"
draft: false
featured: true
---
```

新手文章应以解释、介绍和解惑为主，每篇优先解决一个当前会遇到的问题。复杂机制、工程架构和性能分析放入单独的进阶文章。

## 主要维护位置

1. `src/lib/site.ts`：网站名称、说明、作者和社交链接。
2. `src/app/page.tsx`：首页定位和当前项目。
3. `src/app/about/page.tsx`：个人介绍与写作原则。
4. `src/app/projects/page.tsx`：项目资料。
5. `src/app/now/page.tsx`：当前开发和学习进度。
6. `content/posts/`：博客文章。
7. `src/app/opengraph-image.tsx`：社交平台分享图。

迁移旧项目请阅读 `MIGRATION.md`，部署说明请阅读 `DEPLOY.md`。
