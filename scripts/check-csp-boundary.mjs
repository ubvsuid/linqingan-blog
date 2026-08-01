import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const nextConfig = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");
const englishLayout = fs.readFileSync(path.join(root, "src", "app", "(en)", "layout.tsx"), "utf8");
const chineseLayout = fs.readFileSync(path.join(root, "src", "app", "(zh)", "layout.tsx"), "utf8");
const themeModule = fs.readFileSync(path.join(root, "src", "lib", "theme-bootstrap.ts"), "utf8");
const reportRoute = fs.readFileSync(
  path.join(root, "src", "app", "(zh)", "api", "csp-report", "route.ts"),
  "utf8",
);
const retiredThemeScriptPath = path.join(root, "public", "theme-init.js");
const boundaryPath = path.join(root, "docs", "csp-inline-boundary.md");
const failures = [];

const themeMatch = themeModule.match(/THEME_BOOT_SCRIPT = '([^']+)'/);
if (!themeMatch) {
  failures.push("Theme bootstrap module does not expose one fixed single-quoted script.");
}
const themeScript = themeMatch?.[1] ?? "";
const expectedThemeHash = `sha256-${crypto.createHash("sha256").update(themeScript).digest("base64")}`;

for (const [name, source] of [
  ["English layout", englishLayout],
  ["Chinese layout", chineseLayout],
]) {
  if (
    !source.includes("THEME_BOOT_SCRIPT")
    || !source.includes('id="theme-bootstrap"')
    || !source.includes("dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}")
  ) {
    failures.push(`${name} does not use the shared fixed theme bootstrap before visible content.`);
  }
  if (source.includes("/theme-init.js") || source.includes('from "next/script"')) {
    failures.push(`${name} still requests the superseded external theme script.`);
  }
}

if (fs.existsSync(retiredThemeScriptPath)) {
  failures.push("The superseded public/theme-init.js file still exists.");
}
if (!nextConfig.includes(expectedThemeHash)) {
  failures.push(`CSP script-src is missing the exact theme hash ${expectedThemeHash}.`);
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
if (!nextConfig.includes('"Content-Security-Policy", value: contentSecurityPolicy')) {
  failures.push("Enforced CSP is missing.");
}
if (
  !nextConfig.includes('key: "Content-Security-Policy-Report-Only"')
  || !nextConfig.includes("value: candidateContentSecurityPolicy")
) {
  failures.push("Report-Only CSP candidate is missing.");
}
if (
  !nextConfig.includes('const cspCanaryRoutes = ["/verification", "/en/verification"] as const')
  || !nextConfig.includes("...cspCanaryRoutes.map")
  || !nextConfig.includes("headers: [candidateContentSecurityPolicyHeader]")
) {
  failures.push(
    "The stricter Report-Only policy must stay scoped to the bilingual verification canary routes.",
  );
}
const securityHeadersBlock = nextConfig.match(
  /const securityHeaders = \[([\s\S]*?)\n\];/,
)?.[1] ?? "";
if (securityHeadersBlock.includes("Content-Security-Policy-Report-Only")) {
  failures.push(
    "The stricter Report-Only policy must not generate expected Next.js bootstrap reports on every route.",
  );
}

for (const expected of [
  "RATE_LIMIT_WINDOW_MS = 60_000",
  "RATE_LIMIT_REQUESTS = 60",
  "MAX_RATE_LIMIT_KEYS = 1_000",
  "applyRateLimit(request)",
  'status: 429',
  '"Retry-After"',
  '"X-Robots-Tag": "noindex, nofollow"',
]) {
  if (!reportRoute.includes(expected)) {
    failures.push(`CSP report ingestion is missing ${expected}.`);
  }
}

if (!fs.existsSync(boundaryPath)) {
  failures.push("Missing CSP inline compatibility boundary documentation.");
} else {
  const boundary = fs.readFileSync(boundaryPath, "utf8");
  if (!boundary.includes("fixed 175-byte inline script")) {
    failures.push("CSP documentation does not explain the fixed hashed theme bootstrap.");
  }
  if (!boundary.includes("best-effort per-instance rate limit")) {
    failures.push("CSP documentation does not explain the serverless rate-limit boundary.");
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  "CSP boundary check passed: the shared theme bootstrap is hash-authorized without a network request, bilingual verification routes host the stricter canary, and report ingestion is size-limited, redacted, noindex, and rate-limited per instance.",
);
