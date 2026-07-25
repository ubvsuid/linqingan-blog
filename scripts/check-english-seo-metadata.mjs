import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const libDirectory = path.join(root, "src", "lib");
const registryFiles = fs.readdirSync(libDirectory)
  .filter((name) =>
    name === "english-articles.ts"
    || /^english-[a-z0-9-]+-registry-\d+\.ts$/.test(name)
  )
  .sort();
const failures = [];
const records = [];

const fieldPatterns = {
  href: /["']?href["']?\s*:\s*["'](\/en\/blog\/[a-z0-9-]+)["']/g,
  title: /["']?title["']?\s*:\s*["']([^"']+)["']/g,
  description: /["']?description["']?\s*:\s*["']([^"']+)["']/g,
  primaryKeyword: /["']?primaryKeyword["']?\s*:\s*["']([^"']+)["']/g,
  searchIntent: /["']?searchIntent["']?\s*:\s*["']([^"']+)["']/g,
  status: /["']?status["']?\s*:\s*["']([^"']+)["']/g,
  finalScore: /["']?finalScore["']?\s*:\s*(\d+)/g,
};

for (const fileName of registryFiles) {
  const source = fs.readFileSync(
    path.join(libDirectory, fileName),
    "utf8",
  );
  const values = Object.fromEntries(
    Object.entries(fieldPatterns).map(([field, pattern]) => [
      field,
      [...source.matchAll(pattern)].map((match) => match[1]),
    ]),
  );
  const count = values.href.length;

  for (const [field, fieldValues] of Object.entries(values)) {
    if (fieldValues.length !== count) {
      failures.push(
        `${fileName}: ${field} 数量 ${fieldValues.length} 与 href 数量 ${count} 不一致`,
      );
    }
  }

  if (Object.values(values).some((fieldValues) => fieldValues.length !== count)) {
    continue;
  }

  for (let index = 0; index < count; index += 1) {
    records.push({
      fileName,
      href: values.href[index],
      title: values.title[index].trim(),
      description: values.description[index].trim(),
      primaryKeyword: values.primaryKeyword[index].trim(),
      searchIntent: values.searchIntent[index].trim(),
      status: values.status[index].trim(),
      finalScore: Number(values.finalScore[index]),
    });
  }
}

function reportDuplicates(field, label) {
  const grouped = new Map();

  for (const record of records) {
    const normalized = record[field].toLocaleLowerCase("en-US");
    const existing = grouped.get(normalized) || [];
    existing.push(record.href);
    grouped.set(normalized, existing);
  }

  for (const [value, hrefs] of grouped) {
    if (hrefs.length > 1) {
      failures.push(`${label}重复 “${value}”: ${hrefs.join(", ")}`);
    }
  }
}

reportDuplicates("title", "英文标题");
reportDuplicates("primaryKeyword", "英文主关键词");
reportDuplicates("searchIntent", "英文搜索意图");

for (const record of records) {
  if (record.status !== "published") {
    failures.push(`${record.href}: status 必须为 published，实际 ${record.status}`);
  }

  if (!Number.isInteger(record.finalScore) || record.finalScore < 96 || record.finalScore > 100) {
    failures.push(`${record.href}: finalScore 超出 96–100，实际 ${record.finalScore}`);
  }

  if (record.title.length < 20 || record.title.length > 110) {
    failures.push(`${record.href}: title 长度 ${record.title.length} 超出 20–110`);
  }

  if (record.description.length < 80 || record.description.length > 360) {
    failures.push(`${record.href}: description 长度 ${record.description.length} 超出 80–360`);
  }

  if (record.primaryKeyword.length < 8 || record.primaryKeyword.length > 100) {
    failures.push(`${record.href}: primaryKeyword 长度 ${record.primaryKeyword.length} 超出 8–100`);
  }

  if (record.searchIntent.length < 30 || record.searchIntent.length > 220) {
    failures.push(`${record.href}: searchIntent 长度 ${record.searchIntent.length} 超出 30–220`);
  }

  const slug = record.href.slice("/en/blog/".length);
  if (!/^screeps-[a-z0-9-]+$/.test(slug)) {
    failures.push(`${record.href}: 英文 slug 不符合 screeps-* 规范`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`ERROR: ${failure}`);
  }
  console.error(`\n英文 SEO 元数据治理检查失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(
  `英文 SEO 元数据治理检查通过：${records.length} 篇文章的标题、描述、主关键词、搜索意图、发布状态与评分完整且唯一。`,
);
