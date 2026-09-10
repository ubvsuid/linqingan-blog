import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const routePath = path.join(root, "src/app/(zh)/api/resolver/event/route.ts");
const failures = [];

if (!fs.existsSync(routePath)) {
  failures.push("Missing Resolver telemetry API route.");
} else {
  const route = fs.readFileSync(routePath, "utf8");
  const smokeBranchIndex = route.indexOf("if (isSmokeRequest(request))");
  const persistenceIndex = route.indexOf("const stored = await persistResolverEvent");

  if (!route.includes('request.headers.get("x-platform-smoke-test") === "1"')) {
    failures.push("Resolver telemetry API must recognize x-platform-smoke-test=1.");
  }
  if (!route.includes("{ stored: false, smoke: true }")) {
    failures.push("Resolver telemetry smoke requests must return an explicit non-persisted smoke response.");
  }
  if (smokeBranchIndex < 0 || persistenceIndex < 0 || smokeBranchIndex > persistenceIndex) {
    failures.push("Resolver telemetry smoke short-circuit must run before persistence.");
  }
  if (!route.includes("status: stored ? 200 : 202")) {
    failures.push("Resolver telemetry API must return 202 when best-effort persistence fails.");
  }
  if (!route.includes('headers: { "Cache-Control": "no-store" }')) {
    failures.push("Resolver telemetry responses must remain no-store.");
  }
}

if (failures.length > 0) {
  console.error(`Resolver telemetry release safety check failed:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(
  "Resolver telemetry release safety check passed: smoke requests are write-free and persistence failures return 202 without blocking the user experience.",
);
