import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing crawl-hygiene file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function requireText(relativePath, expected, label) {
  const source = read(relativePath);
  if (source && !source.includes(expected)) {
    failures.push(`${relativePath}: missing ${label}`);
  }
}

function requireOccurrences(relativePath, expected, minimum, label) {
  const source = read(relativePath);
  const count = source.split(expected).length - 1;
  if (count < minimum) {
    failures.push(
      `${relativePath}: ${label} must appear at least ${minimum} times; found ${count}`,
    );
  }
}

const header = "src/components/site-header.tsx";
const footer = "src/components/site-footer.tsx";
const postCard = "src/components/post-card.tsx";
const pagination = "src/components/collection-pagination.tsx";
const englishBrowser = "src/components/english-article-browser.tsx";
const siteSearch = "src/components/site-search-v2.tsx";
const englishSiteSearch = "src/components/english-site-search.tsx";
const englishBlog = "src/app/(en)/en/blog/page.tsx";
const englishTagIndex = "src/app/(en)/en/tags/page.tsx";
const englishTag = "src/app/(en)/en/tags/[tag]/page.tsx";
const chineseTagIndex = "src/app/(zh)/tags/page.tsx";
const chineseTag = "src/app/(zh)/tags/[tag]/page.tsx";
const sitemap = "src/lib/sitemaps.ts";

requireOccurrences(header, "prefetch={false}", 3, "utility-link prefetch suppression");
requireOccurrences(footer, "prefetch={false}", 5, "footer-cluster prefetch suppression");
requireOccurrences(postCard, "prefetch={false}", 2, "blog-card prefetch suppression");
requireOccurrences(pagination, "prefetch={false}", 2, "pagination prefetch suppression");
requireOccurrences(englishBrowser, "prefetch={false}", 5, "English result-list prefetch suppression");
requireOccurrences(siteSearch, "prefetch={false}", 3, "Chinese site-search result prefetch suppression");
requireOccurrences(englishSiteSearch, "prefetch={false}", 5, "English site-search result prefetch suppression");
requireOccurrences(englishTagIndex, "prefetch={false}", 1, "English Tag-index prefetch suppression");
requireOccurrences(chineseTagIndex, "prefetch={false}", 1, "Chinese Tag-index prefetch suppression");
requireOccurrences(chineseTag, "prefetch={false}", 2, "Chinese tag-archive prefetch suppression");

requireText(postCard, "getTagArchiveHref(tag, publicTags)", "Tag archive threshold routing");
requireText(englishBlog, "isCleanPagination", "clean pagination boundary");
requireText(englishBlog, '`/en/blog?page=${parsed.page}`', "self-canonical clean pagination");
requireText(englishBlog, "noindex: !isCleanPagination", "filtered-state noindex boundary");
requireText(englishTag, "isCleanPagination", "English Tag clean-pagination boundary");
requireText(englishTag, '`/en/tags/${tag.slug}?page=${parsed.page}`', "English Tag self-canonical pagination");
requireText(englishTag, "index: tag.count >= 3 && isCleanPagination", "English Tag filtered-state noindex boundary");

const sitemapSource = read(sitemap);
for (const forbidden of ["_rsc=", "?difficulty=", "?type=", "?sort=", "?module=", "?q="]) {
  if (sitemapSource.includes(forbidden)) {
    failures.push(`${sitemap}: sitemap source must not emit crawl-state parameter ${forbidden}`);
  }
}

const sourceRoots = [path.join(root, "src"), path.join(root, "next.config.ts")];
const rscPolicyHits = [];

function scanForRscPolicy(target) {
  if (!fs.existsSync(target)) return;
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(target)) {
      scanForRscPolicy(path.join(target, name));
    }
    return;
  }
  if (!/\.(?:ts|tsx|js|mjs)$/.test(target)) return;
  const source = fs.readFileSync(target, "utf8");
  if (source.includes("_rsc")) {
    rscPolicyHits.push(path.relative(root, target));
  }
}

for (const target of sourceRoots) scanForRscPolicy(target);
if (rscPolicyHits.length > 0) {
  failures.push(
    `Do not strip, redirect, or manually govern Next.js _rsc in application code: ${rscPolicyHits.join(", ")}`,
  );
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\nCrawl hygiene check failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  "Crawl hygiene check passed: dense link clusters, bilingual search results, and Tag indexes suppress automatic prefetch; clean English article and Tag pagination are self-canonical; filter states stay non-indexable; Tag thresholds are respected; Sitemap URLs remain clean; and application code does not manually interfere with _rsc.",
);
