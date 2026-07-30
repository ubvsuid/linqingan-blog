import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const prioritiesPath = path.join(root, "src/data/english-evidence-priorities.json");
const sourceRoot = path.join(root, "src/lib");
const evidencePagePath = path.join(root, "src/app/(en)/en/evidence/page.tsx");
const evidenceStatusRoutePath = path.join(root, "src/app/(en)/en/evidence/status.json/route.ts");
const evidenceTemplatePath = path.join(root, ".github/ISSUE_TEMPLATE/live-evidence.yml");

const priorities = JSON.parse(fs.readFileSync(prioritiesPath, "utf8"));

if (!Array.isArray(priorities) || priorities.length < 1) {
  throw new Error("Expected at least one English evidence priority.");
}

const allowedStatuses = new Set(["needed", "submitted", "under-review", "accepted"]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const today = new Date().toISOString().slice(0, 10);

function isValidDate(value) {
  if (!datePattern.test(value ?? "")) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime())
    && parsed.toISOString().slice(0, 10) === value;
}

function requireNonFutureDate(value, label, href) {
  if (!isValidDate(value) || value > today) {
    throw new Error(`A valid, non-future ${label} date is required for ${href}.`);
  }
}

const hrefs = new Set();
for (const item of priorities) {
  if (!item || typeof item !== "object") throw new Error("Each evidence priority must be an object.");
  if (typeof item.href !== "string" || !item.href.startsWith("/en/blog/")) throw new Error(`Invalid evidence href: ${item.href}`);
  if (hrefs.has(item.href)) throw new Error(`Duplicate evidence priority: ${item.href}`);
  hrefs.add(item.href);
  if (typeof item.title !== "string" || item.title.trim() === "") throw new Error(`Evidence title is required for ${item.href}.`);
  if (!allowedStatuses.has(item.status)) throw new Error(`Invalid evidence status "${item.status}" for ${item.href}.`);
  requireNonFutureDate(item.lastReviewedAt, "lastReviewedAt", item.href);
  if (
    !Array.isArray(item.requestedEvidence)
    || item.requestedEvidence.length < 2
    || item.requestedEvidence.some((requirement) => typeof requirement !== "string" || requirement.trim() === "")
  ) {
    throw new Error(`At least two non-empty evidence requirements are needed for ${item.href}.`);
  }

  if (item.status === "submitted" || item.status === "under-review") {
    if (typeof item.submissionUrl !== "string" || !/^https:\/\/github\.com\/ubvsuid\/linqingan-blog\/issues\/\d+$/.test(item.submissionUrl)) {
      throw new Error(`${item.status} evidence must link to its repository issue for ${item.href}.`);
    }
    requireNonFutureDate(item.submittedAt, "submittedAt", item.href);
    if (item.submittedAt > item.lastReviewedAt) {
      throw new Error(`${item.status} evidence cannot be reviewed before it is submitted for ${item.href}.`);
    }
  }

  if (item.status === "accepted") {
    if (typeof item.submissionUrl !== "string" || !/^https:\/\/github\.com\/ubvsuid\/linqingan-blog\/issues\/\d+$/.test(item.submissionUrl)) {
      throw new Error(`Accepted evidence must link to its repository provenance issue for ${item.href}.`);
    }
    requireNonFutureDate(item.submittedAt, "submittedAt", item.href);
    requireNonFutureDate(item.observedAt, "observedAt", item.href);
    requireNonFutureDate(item.acceptedAt, "acceptedAt", item.href);
    if (item.observedAt > item.acceptedAt || item.submittedAt > item.acceptedAt) {
      throw new Error(`Accepted evidence must be observed and submitted no later than acceptance for ${item.href}.`);
    }
    if (item.acceptedAt > item.lastReviewedAt) {
      throw new Error(`Accepted evidence cannot be reviewed before acceptance for ${item.href}.`);
    }
    for (const field of ["testEnvironment", "tickRange", "limitations"]) {
      if (typeof item[field] !== "string" || item[field].trim() === "") {
        throw new Error(`Accepted evidence must include ${field} for ${item.href}.`);
      }
    }
    if (
      !Array.isArray(item.evidenceLinks)
      || item.evidenceLinks.length < 1
      || item.evidenceLinks.some((url) => typeof url !== "string" || !/^https:\/\//.test(url))
    ) {
      throw new Error(`Accepted evidence must include at least one HTTPS evidence link for ${item.href}.`);
    }
  }
}

function collectTypeScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(fullPath);
    return entry.isFile() && /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}

const sourceText = collectTypeScriptFiles(sourceRoot)
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");

for (const href of hrefs) {
  const slug = href.split("/").at(-1);
  if (!sourceText.includes(slug)) throw new Error(`Evidence priority does not map to a published English source: ${href}`);
}

const evidencePage = fs.readFileSync(evidencePagePath, "utf8");
const evidenceStatusRoute = fs.readFileSync(evidenceStatusRoutePath, "utf8");
const evidenceTemplate = fs.readFileSync(evidenceTemplatePath, "utf8");

for (const status of allowedStatuses) {
  if (!evidencePage.includes(`"${status}"`)) throw new Error(`Evidence page does not present the "${status}" state.`);
}
for (const acceptedField of ["Accepted scope", "item.testEnvironment", "item.tickRange", "item.evidenceLinks", "item.limitations"]) {
  if (!evidencePage.includes(acceptedField)) throw new Error(`Evidence page does not expose accepted evidence field: ${acceptedField}.`);
}
if (!evidenceStatusRoute.includes("X-Robots-Tag")) throw new Error("Evidence status JSON must remain noindex.");
for (const requiredField of ["Guide URL", "Test environment", "Tick range", "Exact code or action", "Return codes and later-tick observations", "Limitations"]) {
  if (!evidenceTemplate.includes(requiredField)) throw new Error(`Live-evidence issue form is missing "${requiredField}".`);
}

const counts = Object.fromEntries([...allowedStatuses].map((status) => [
  status,
  priorities.filter((item) => item.status === status).length,
]));
console.log(`English evidence priority check passed: ${priorities.length} guides tracked (${JSON.stringify(counts)}).`);
