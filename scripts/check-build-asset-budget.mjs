import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const nextDirectory = path.join(root, ".next");

const budgets = {
  maxHtmlFileBytes: 750_000,
  maxJsChunkBytes: 600_000,
  maxTotalJsBytes: 3_500_000,
  maxCssFileBytes: 250_000,
  maxTotalCssBytes: 1_000_000,
};

const failures = [];

function collectFiles(directory, extension) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  const queue = [directory];

  while (queue.length > 0) {
    const current = queue.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) queue.push(absolutePath);
      else if (entry.isFile() && entry.name.endsWith(extension)) files.push(absolutePath);
    }
  }

  return files;
}

function sizeOf(filePath) {
  return fs.statSync(filePath).size;
}

function relative(filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, "/");
}

function largest(files) {
  return files
    .map((filePath) => ({ filePath, bytes: sizeOf(filePath) }))
    .sort((left, right) => right.bytes - left.bytes)[0] ?? null;
}

if (!fs.existsSync(nextDirectory)) {
  console.error("Build asset budget check requires an existing .next production build.");
  process.exit(1);
}

const htmlFiles = collectFiles(path.join(nextDirectory, "server", "app"), ".html");
const jsFiles = collectFiles(path.join(nextDirectory, "static", "chunks"), ".js");
const cssFiles = collectFiles(path.join(nextDirectory, "static", "css"), ".css");

if (htmlFiles.length === 0) failures.push("No prerendered HTML files were found in .next/server/app.");
if (jsFiles.length === 0) failures.push("No JavaScript chunks were found in .next/static/chunks.");

const largestHtml = largest(htmlFiles);
const largestJs = largest(jsFiles);
const largestCss = largest(cssFiles);
const totalJsBytes = jsFiles.reduce((sum, filePath) => sum + sizeOf(filePath), 0);
const totalCssBytes = cssFiles.reduce((sum, filePath) => sum + sizeOf(filePath), 0);

if (largestHtml && largestHtml.bytes > budgets.maxHtmlFileBytes) {
  failures.push(
    `Largest prerendered HTML exceeds budget: ${relative(largestHtml.filePath)} ${largestHtml.bytes} > ${budgets.maxHtmlFileBytes} bytes.`,
  );
}
if (largestJs && largestJs.bytes > budgets.maxJsChunkBytes) {
  failures.push(
    `Largest JS chunk exceeds budget: ${relative(largestJs.filePath)} ${largestJs.bytes} > ${budgets.maxJsChunkBytes} bytes.`,
  );
}
if (totalJsBytes > budgets.maxTotalJsBytes) {
  failures.push(`Total static JS exceeds budget: ${totalJsBytes} > ${budgets.maxTotalJsBytes} bytes.`);
}
if (largestCss && largestCss.bytes > budgets.maxCssFileBytes) {
  failures.push(
    `Largest CSS file exceeds budget: ${relative(largestCss.filePath)} ${largestCss.bytes} > ${budgets.maxCssFileBytes} bytes.`,
  );
}
if (totalCssBytes > budgets.maxTotalCssBytes) {
  failures.push(`Total static CSS exceeds budget: ${totalCssBytes} > ${budgets.maxTotalCssBytes} bytes.`);
}

if (failures.length > 0) {
  console.error(`Build asset budget check failed:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

const format = (item) => item ? `${relative(item.filePath)} (${item.bytes} B)` : "none";
console.log(
  [
    "Build asset budget check passed.",
    `HTML: ${htmlFiles.length} files; largest ${format(largestHtml)} / ${budgets.maxHtmlFileBytes} B.`,
    `JS: ${jsFiles.length} chunks; largest ${format(largestJs)} / ${budgets.maxJsChunkBytes} B; total ${totalJsBytes} / ${budgets.maxTotalJsBytes} B.`,
    `CSS: ${cssFiles.length} files; largest ${format(largestCss)} / ${budgets.maxCssFileBytes} B; total ${totalCssBytes} / ${budgets.maxTotalCssBytes} B.`,
  ].join("\n"),
);
