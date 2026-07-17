# 临清安 · Screeps 中文知识站

围绕 Screeps、JavaScript 与长期运行系统持续建设的个人技术网站。

正式网站：<https://www.linqingan.com>

## 主要入口

- [Screeps 中文新手学习路线](https://www.linqingan.com/beginner)
- [全部文章](https://www.linqingan.com/blog)
- [Screeps 资料中心](https://www.linqingan.com/resources)
- [站内搜索](https://www.linqingan.com/search)
- [Screeps 术语表](https://www.linqingan.com/glossary)
- [Screeps 错误码查询](https://www.linqingan.com/screeps-errors)
- [公开项目](https://www.linqingan.com/projects)

## 当前内容

- 12 篇连续组织的 Screeps 新手文章
- 从新手路线承接到 Memory、角色系统和基础工程的后续内容
- 站内全文搜索
- Screeps 术语表与错误码查询
- 标签归档和项目档案
- 阅读进度、文章目录、代码复制、前后篇和学习路径链接
- RSS、Sitemap、结构化数据和统一 Canonical
- Vercel Web Analytics 与 Speed Insights

## 内容原则

新手文章以解释、介绍和解惑为主，每篇优先解决一个当前会遇到的问题。

复杂机制、自动补员、模块拆分、架构设计和性能分析放入独立的基础工程或专业内容，不继续塞进现有 12 篇新手路线。

文章尽量包含：

- 最小可运行代码；
- 实际返回值或运行现象；
- 常见错误和排查顺序；
- 当前方案的限制；
- 官方参考资料；
- 与前置文章、后续文章、术语和错误码的内部链接。

## 技术栈

- Next.js App Router
- TypeScript
- Markdown 与 gray-matter
- Vercel
- GitHub Actions

## 环境要求

- Node.js 20.9 或更高版本
- npm 10 或更高版本

## 本地启动

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

该命令会执行内容检查、TypeScript 检查、ESLint 和生产构建。

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
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "Memory"
draft: false
featured: false
---
```

## 主要维护位置

1. `content/posts/`：文章内容。
2. `src/lib/beginner-series.ts`：新手学习路线顺序。
3. `src/lib/screeps-glossary.ts`：术语表内容。
4. `src/lib/screeps-errors.ts`：错误码内容。
5. `src/components/article-enhancements.tsx`：文章学习路径、进度和代码复制增强。
6. `src/lib/site.ts`：网站名称、作者、导航和公开链接。
7. `src/app/sitemap.ts`：Sitemap 规则。
8. `scripts/content-check.mjs`：内容完整性与内部链接检查。

## 反馈

发现文章、代码或页面存在问题时，可以在仓库中提交 Issue：

<https://github.com/ubvsuid/linqingan-blog/issues>

迁移旧项目请阅读 `MIGRATION.md`，部署说明请阅读 `DEPLOY.md`。
