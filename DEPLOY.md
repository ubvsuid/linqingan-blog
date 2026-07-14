# 部署与域名

## Vercel

1. 将项目推送到 GitHub。
2. 在 Vercel 导入仓库。
3. Framework Preset 选择 Next.js。
4. Build Command 保持 `next build`。
5. 添加 `linqingan.com` 和 `www.linqingan.com`。
6. 将 `linqingan.com` 设为主域名。
7. 将 `www.linqingan.com` 重定向到主域名。
8. DNS 记录以 Vercel 项目页面实时显示为准。

## 环境变量

生产环境可添加：

```text
NEXT_PUBLIC_SITE_URL=https://linqingan.com
```

代码默认也会使用 `https://linqingan.com`。

## 上线后检查

- `/`
- `/blog`
- `/projects`
- `/now`
- `/about`
- `/feed.xml`
- `/sitemap.xml`
- `/robots.txt`
- 一个不存在的地址是否返回 404
- `www` 是否永久跳转到无 `www`
