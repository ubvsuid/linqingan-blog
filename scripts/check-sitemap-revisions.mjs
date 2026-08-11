import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const registryPath = path.join(root, "src", "data", "static-page-revisions.json");
const sitemapPath = path.join(root, "src", "lib", "sitemaps.ts");
const policyPath = path.join(root, "docs", "sitemap-lastmod-policy.md");

const requiredPaths = [
  "/",
  "/beginner",
  "/blog",
  "/knowledge",
  "/screeps-api",
  "/screeps-api/creep",
  "/screeps-api/room",
  "/screeps-api/structure-spawn",
  "/screeps-api/controller",
  "/screeps-api/market",
  "/tools",
  "/tools/creep-body-calculator",
  "/tools/room-diagnostics",
  "/tools/market-terminal-cost-calculator",
  "/tools/controller-downgrade-planner",
  "/tools/lab-reaction-boost-planner",
  "/tools/spawn-queue-replacement-planner",
  "/tools/hauling-throughput-planner",
  "/tools/tower-damage-heal-repair-calculator",
  "/glossary",
  "/screeps-errors",
  "/verification",
  "/verified",
  "/tags",
  "/now",
  "/changelog",
  "/about",
  "/en",
  "/en/beginner",
  "/en/blog",
  "/en/knowledge",
  "/en/screeps-api",
  "/en/screeps-api/creep",
  "/en/screeps-api/room",
  "/en/screeps-api/structure-spawn",
  "/en/screeps-api/controller",
  "/en/screeps-api/market",
  "/en/tags",
  "/en/tools",
  "/en/tools/creep-body-calculator",
  "/en/tools/room-diagnostics",
  "/en/tools/market-terminal-cost-calculator",
  "/en/tools/controller-downgrade-planner",
  "/en/tools/lab-reaction-boost-planner",
  "/en/tools/spawn-queue-replacement-planner",
  "/en/tools/hauling-throughput-planner",
  "/en/tools/tower-damage-heal-repair-calculator",
  "/en/screeps-errors",
  "/en/glossary",
  "/en/verification",
  "/en/verified",
  "/en/evidence",
  "/en/about",
  "/en/changelog",
  "/en/roadmap",
  "/en/license",
];

const failures = [];
const revisions = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const today = new Date();
today.setUTCHours(23, 59, 59, 999);

for (const pathname of requiredPaths) {
  const value = revisions[pathname];
  if (!value) {
    failures.push(`Missing static page revision: ${pathname}`);
    continue;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    failures.push(`Revision must use YYYY-MM-DD: ${pathname} -> ${value}`);
    continue;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime())) {
    failures.push(`Revision is not a valid date: ${pathname} -> ${value}`);
  } else if (parsed.getTime() > today.getTime()) {
    failures.push(`Revision cannot be in the future: ${pathname} -> ${value}`);
  }
}

for (const pathname of Object.keys(revisions)) {
  if (!requiredPaths.includes(pathname)) {
    failures.push(`Untracked registry route: ${pathname}`);
  }
}

const sitemapSource = fs.readFileSync(sitemapPath, "utf8");
const compactSitemapSource = sitemapSource.replace(/\s+/g, "");
for (const requiredText of [
  "getStaticPageLastModified",
  "latestSiteAuditEntry.date",
  "screepsApiHubSlugs",
  'staticPageEntry("/",[...allPostDates,latestSiteAuditEntry.date])',
  'staticPageEntry("/screeps-api"',
  'staticPageEntry("/verified"',
  'staticPageEntry("/tools"',
  'staticPageEntry("/en/blog"',
  'staticPageEntry("/en/screeps-api"',
  'staticPageEntry("/en/verified"',
  'staticPageEntry("/en/evidence"',
  '"/tools/spawn-queue-replacement-planner"',
  '"/tools/hauling-throughput-planner"',
  '"/tools/tower-damage-heal-repair-calculator"',
  '"/en/tools/spawn-queue-replacement-planner"',
  '"/en/tools/hauling-throughput-planner"',
  '"/en/tools/tower-damage-heal-repair-calculator"',
]) {
  if (!compactSitemapSource.includes(requiredText.replace(/\s+/g, ""))) {
    failures.push(`Sitemap does not use the revision registry: ${requiredText}`);
  }
}

if (!compactSitemapSource.includes("constchangelogDates=[latestSiteAuditEntry.date,")) {
  failures.push("Changelog sitemap lastmod must include the latest site audit entry date.");
}

for (const obsoleteField of ["changeFrequency:", "priority:"]) {
  if (sitemapSource.includes(obsoleteField)) {
    failures.push(`Sitemap retains obsolete field: ${obsoleteField}`);
  }
}

if (!fs.existsSync(policyPath)) {
  failures.push("Missing sitemap lastmod maintenance policy.");
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  `Sitemap revision check passed: ${requiredPaths.length} static routes tracked, and homepage/changelog activity dates are data-derived.`,
);
