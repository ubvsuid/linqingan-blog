import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const nextConfig = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");
const englishLayout = fs.readFileSync(path.join(root, "src", "app", "(en)", "layout.tsx"), "utf8");
const chineseLayout = fs.readFileSync(path.join(root, "src", "app", "(zh)", "layout.tsx"), "utf8");
const themeScriptPath = path.join(root, "public", "theme-init.js");
const boundaryPath = path.join(root, "docs", "csp-inline-boundary.md");
const failures = [];

for (const [name, source] of [
  ["English layout", englishLayout],
  ["Chinese layout", chineseLayout],
]) {
  if (!source.includes('src="/theme-init.js"') || !source.includes('strategy="beforeInteractive"')) {
    failures.push(`${name} does not load the external theme initializer before hydration.`);
  }
  if (source.includes("themeBootScript")) {
    failures.push(`${name} still contains the inline theme initializer.`);
  }
}

if (!fs.existsSync(themeScriptPath)) {
  failures.push("Missing public/theme-init.js.");
}

if (!nextConfig.includes("createCandidateContentSecurityPolicy")) {
  failures.push("CSP candidate policy is not built independently.");
}
if (!nextConfig.includes("directive.replace(\" 'unsafe-inline'\", \"\")")) {
  failures.push("Report-Only script policy does not remove unsafe-inline.");
}
if (!nextConfig.includes("\"style-src-attr 'none'\"")) {
  failures.push("Report-Only style policy does not reject inline style attributes.");
}
if (
  !nextConfig.includes('source: "/theme-init.js"')
  || !nextConfig.includes("stale-while-revalidate=604800")
) {
  failures.push("External theme initializer is missing its bounded cache policy.");
}
if (!nextConfig.includes('"Content-Security-Policy", value: contentSecurityPolicy')) {
  failures.push("Enforced CSP is missing.");
}
if (
  !nextConfig.includes('key: "Content-Security-Policy-Report-Only"')
  || !nextConfig.includes("value: candidateContentSecurityPolicy")
) {
  failures.push("Report-Only CSP candidate is missing.");
}
for (const canaryRoute of ["/verification", "/en/verification"]) {
  if (
    !nextConfig.includes(`source: "${canaryRoute}"`)
    || !nextConfig.includes("headers: [candidateContentSecurityPolicyHeader]")
  ) {
    failures.push(
      `The stricter Report-Only policy must include the low-volume canary route ${canaryRoute}.`,
    );
  }
}
const securityHeadersBlock = nextConfig.match(
  /const securityHeaders = \[([\s\S]*?)\n\];/,
)?.[1] ?? "";
if (securityHeadersBlock.includes("Content-Security-Policy-Report-Only")) {
  failures.push(
    "The stricter Report-Only policy must not generate expected Next.js bootstrap reports on every route.",
  );
}
if (!fs.existsSync(boundaryPath)) {
  failures.push("Missing CSP inline compatibility boundary documentation.");
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  "CSP boundary check passed: theme boot is external and the stricter candidate is scoped to the Chinese and English verification canary routes.",
);
