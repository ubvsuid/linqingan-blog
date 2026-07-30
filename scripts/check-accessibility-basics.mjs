import fs from "node:fs";
import path from "node:path";

const failures = [];
const root = process.cwd();
const layouts = [
  fs.readFileSync(path.join(root, "src/app/(zh)/layout.tsx"), "utf8"),
  fs.readFileSync(path.join(root, "src/app/(en)/layout.tsx"), "utf8"),
];
const globals = fs.readFileSync(path.join(root, "src/app/globals.css"), "utf8");
const manualReviewTemplate = fs.readFileSync(
  path.join(root, ".github/ISSUE_TEMPLATE/accessibility-review.yml"),
  "utf8",
);
const manualTestMatrix = fs.readFileSync(
  path.join(root, "docs/manual-accessibility-test-matrix.md"),
  "utf8",
);

if (layouts.some((layout) => !layout.includes('className="skip-link"'))) failures.push("A root layout is missing a skip link.");
if (!globals.includes(":focus-visible")) failures.push("Global focus-visible styles are missing.");
if (!globals.includes("prefers-reduced-motion")) failures.push("Reduced-motion handling is missing.");

for (const phrase of ["Pass", "Fail", "Blocked", "Not applicable", "Test date", "Reviewer", "200% zoom", "screen reader"]) {
  if (!manualReviewTemplate.includes(phrase)) failures.push(`Manual accessibility issue form is missing "${phrase}".`);
}
const performedChecks = manualReviewTemplate.match(/id: checks[\s\S]*?(?=\n  - type:)/)?.[0] ?? "";
if (performedChecks.includes("required: true")) {
  failures.push("Manual checks must not be required as if every test had already passed.");
}
for (const phrase of ["NVDA", "VoiceOver", "TalkBack", "320 CSS pixels", "Forced colors", "Blocked", "retest"]) {
  if (!manualTestMatrix.includes(phrase)) failures.push(`Manual accessibility matrix is missing "${phrase}".`);
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (/\.(tsx|jsx)$/.test(entry.name)) {
      const source = fs.readFileSync(fullPath, "utf8");
      if (/tabIndex=\{?[1-9]/.test(source)) failures.push(`${path.relative(root, fullPath)} uses a positive tabIndex.`);
      const rawImages = [...source.matchAll(/<img\b[^>]*>/g)];
      for (const match of rawImages) {
        if (!/\balt=/.test(match[0])) failures.push(`${path.relative(root, fullPath)} contains an img without alt.`);
      }
    }
  }
}

walk(path.join(root, "src"));

if (failures.length > 0) {
  console.error(`Accessibility baseline check failed:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log("Accessibility baseline check passed.");
