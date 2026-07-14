# 从旧主题迁移到 Clean V1

不要在正式分支直接删除旧主题。按照以下顺序操作。

## 1. 备份旧项目

```bash
git status
git add .
git commit -m "chore: backup old blog theme"
git tag before-clean-blog-v1
git switch -c rebuild/clean-blog-v1
```

如果还没有 Git，先复制整个旧项目目录作为备份。

## 2. 需要从旧项目保留的内容

先复制到项目外部的临时目录：

- `.env.local` 中真正需要的环境变量
- `public/` 中的头像、封面、Logo
- 已写好的 Markdown / MDX 文章
- Google、Bing 等站长验证文件
- Analytics 配置
- 域名和 Vercel 项目设置

不要复制旧主题的：

- 旧 `node_modules`
- 旧 `.next`
- 主题组件目录
- 主题 CSS
- 主题专用依赖
- 主题配置文件

## 3. 最安全的替换方式

保留旧项目的 `.git` 目录，然后把旧项目其他代码移出，再把 Clean V1 的文件复制进仓库根目录。

Windows PowerShell 示例：

```powershell
# 在旧项目目录的上一级执行
Rename-Item old-blog old-blog-backup
Copy-Item -Recurse linqingan-blog-clean-v1 old-blog
Copy-Item -Recurse -Force old-blog-backup\.git old-blog\.git
```

也可以在新目录先运行和验证，再把 Vercel 仓库切换到新代码。

## 4. 安装并测试

```bash
npm install
npm run dev
npm run check
```

必须确认 `npm run check` 全部通过后再合并到 `main`。

## 5. 迁移旧文章

将旧文章转换为本项目 frontmatter 格式并放入：

```text
content/posts/
```

图片放入：

```text
public/images/posts/
```

Markdown 中引用：

```md
![图片说明](/images/posts/example.webp)
```

## 6. 部署

```bash
git add .
git commit -m "feat: replace old theme with clean blog"
git push -u origin rebuild/clean-blog-v1
```

先使用 Vercel Preview 检查，再合并到 `main`。

## 7. 回滚

发生问题时：

```bash
git switch main
git reset --hard before-clean-blog-v1
```

如果该标签对应的提交已经推送，优先通过 Git revert 或 Vercel 的旧 Deployment 回滚，避免破坏共享历史。
