import fs from "node:fs";
import path from "node:path";

const [, , type, title, summary, href = "", label = "查看相关页面"] = process.argv;
const allowedTypes = new Set(["网站", "内容", "工具", "验证", "SEO"]);

if (!allowedTypes.has(type) || !title || !summary) {
  console.error(
    '用法：npm run changelog:add -- "网站|内容|工具|验证|SEO" "标题" "说明" [链接] [链接文字]',
  );
  process.exit(1);
}

function escapeText(value) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

const date = new Date().toISOString().slice(0, 10);
const slug = title
  .normalize("NFKC")
  .toLocaleLowerCase("zh-CN")
  .replace(/[^a-z0-9\u3400-\u9fff]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 48) || "update";
const id = `${date}-${slug}`;
const filePath = path.join(process.cwd(), "src", "lib", "changelog.ts");
const source = fs.readFileSync(filePath, "utf8");
const marker = "export const changelogEntries: ChangelogEntry[] = [\n";

if (!source.includes(marker)) throw new Error("找不到更新日志插入位置");
if (source.includes(`id: "${id}"`)) throw new Error(`日志 ID 已存在：${id}`);

const linkBlock = href
  ? `\n    links: [{ label: "${escapeText(label)}", href: "${escapeText(href)}" }],`
  : "";
const entry = `  {\n    id: "${id}",\n    date: "${date}",\n    type: "${type}",\n    title: "${escapeText(title)}",\n    summary:\n      "${escapeText(summary)}",${linkBlock}\n  },\n`;

fs.writeFileSync(filePath, source.replace(marker, `${marker}${entry}`));
console.log(`已添加更新日志：${id}`);
