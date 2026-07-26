import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required English interface file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function requireText(relativePath, expected, label) {
  const source = read(relativePath);
  if (source && !source.includes(expected)) failures.push(`Missing ${label} in ${relativePath}`);
}

function forbidText(relativePath, forbidden, label) {
  const source = read(relativePath);
  if (source.includes(forbidden)) failures.push(`Unexpected ${label} in ${relativePath}`);
}

const requiredFiles = [
  "src/app/en/layout.tsx",
  "src/app/en/not-found.tsx",
  "src/app/en/error.tsx",
  "src/app/en/loading.tsx",
  "src/app/en/changelog/page.tsx",
  "src/app/en/roadmap/page.tsx",
  "src/app/en/license/page.tsx",
];
for (const relativePath of requiredFiles) read(relativePath);

requireText("next.config.ts", 'key: "Content-Language", value: "en"', "English Content-Language header");
requireText("src/app/layout.tsx", 'document.documentElement.lang = english ? "en" : "zh-CN"', "pre-content document language selection");
requireText("src/app/layout.tsx", "skip-link-en", "localized English skip link");
forbidText("src/app/layout.tsx", "DocumentLanguage", "post-hydration language component");
requireText("src/app/en/layout.tsx", `${"/en/search?q={search_term_string}"}`, "English SearchAction");
requireText("src/lib/english-metadata.ts", 'applicationName: "Linqingan Screeps Guides & Tools"', "English application metadata");
requireText("src/components/theme-toggle.tsx", "Switch to ${nextTheme} mode", "English theme-toggle label");
requireText("src/app/en/page.tsx", "published English guides", "accurate English publication wording");
forbidText("src/app/en/page.tsx", "verified articles", "ambiguous verified-article wording");
requireText("src/app/en/tools/page.tsx", "SAMPLE OUTPUT", "tool sample-output label");
forbidText("src/app/en/knowledge/page.tsx", "Score {", "public internal article score");
requireText("src/app/en/knowledge/page.tsx", "discovery.difficulty", "knowledge difficulty metadata");
requireText("src/components/english-site-search.tsx", "popularQueries", "popular English searches");
requireText("src/components/english-site-search.tsx", 'event.key !== "/"', "English search keyboard shortcut");
requireText("src/components/site-footer.tsx", "/en/changelog", "English changelog footer link");
requireText("src/components/site-footer.tsx", "/en/roadmap", "English roadmap footer link");
requireText("src/components/site-footer.tsx", "/en/license", "English content-use footer link");
requireText("src/app/sitemap.ts", "/en/changelog", "English changelog Sitemap entry");
requireText("src/app/sitemap.ts", "/en/roadmap", "English roadmap Sitemap entry");
requireText("src/app/sitemap.ts", "/en/license", "English content-use Sitemap entry");

const navigation = read("src/lib/i18n.ts");
if (navigation.includes('{ label: "Home", href: "/en" }')) failures.push("English navigation still duplicates the home logo link.");
if (navigation.includes('{ label: "Topics", href: "/en/tags" }')) failures.push("English navigation still exposes the secondary Topics page as a primary desktop item.");

const home = read("src/app/en/page.tsx");
const taskIndex = home.indexOf('className="english-task-hub"');
const diagramIndex = home.indexOf('className="english-system-visual"');
if (taskIndex < 0 || diagramIndex < 0 || taskIndex > diagramIndex) failures.push("English task navigation must appear before the system diagram.");

for (const relativePath of [
  "src/app/en/not-found.tsx",
  "src/app/en/error.tsx",
  "src/app/en/loading.tsx",
  "src/app/en/changelog/page.tsx",
  "src/app/en/roadmap/page.tsx",
  "src/app/en/license/page.tsx",
]) {
  const source = read(relativePath);
  if (/[一-鿿]/u.test(source)) failures.push(`Chinese interface text found in ${relativePath}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\nEnglish interface check failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log("English interface check passed: language, metadata, error states, hierarchy, navigation, search, tool previews, knowledge metadata, trust pages, and Sitemap entries are present.");
