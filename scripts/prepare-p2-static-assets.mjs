import fs from "node:fs";

function patchContentCheck() {
  const filePath = "scripts/content-check.mjs";
  let source = fs.readFileSync(filePath, "utf8");
  const before = `      && !href.startsWith("/blog/page/")\n    ) {`;
  const after = `      && !href.startsWith("/blog/page/")\n      && !href.startsWith("/diagrams/")\n    ) {`;

  if (source.includes(before)) {
    source = source.replace(before, after);
  } else if (!source.includes('!href.startsWith("/diagrams/")')) {
    throw new Error("Unable to add diagram allowance to content check");
  }

  fs.writeFileSync(filePath, source);
}

function patchInternalLinkCheck() {
  const filePath = "scripts/check-internal-links.mjs";
  let source = fs.readFileSync(filePath, "utf8");
  const before = `  if (/^\\/(blog|now|changelog)\\/page\\/[2-9][0-9]*$/.test(href)) return true;\n  return false;`;
  const after = `  if (/^\\/(blog|now|changelog)\\/page\\/[2-9][0-9]*$/.test(href)) return true;\n  if (/^\\/diagrams\\/[a-z0-9-]+\\.svg$/.test(href)) {\n    return fs.existsSync(path.join(root, "public", href.slice(1)));\n  }\n  return false;`;

  if (source.includes(before)) {
    source = source.replace(before, after);
  } else if (!source.includes("/diagrams\\/")) {
    throw new Error("Unable to add diagram asset validation to internal link check");
  }

  source = source.replace(
    `  "/tools/creep-body-calculator",\n  "/verification",`,
    `  "/tools/creep-body-calculator",\n  "/tools/room-diagnostics",\n  "/verification",`,
  );

  fs.writeFileSync(filePath, source);
}

function patchRouteCheck() {
  const filePath = "scripts/check-routes.mjs";
  let source = fs.readFileSync(filePath, "utf8");

  source = source.replace(
    `  "/tools/creep-body-calculator",\n  "/verification",`,
    `  "/tools/creep-body-calculator",\n  "/tools/room-diagnostics",\n  "/verification",`,
  );

  const routeHelperAnchor = `]);\n\nfor (const fileName of files) {`;
  const routeHelper = `]);\n\nfunction isExistingPublicDiagram(href) {\n  return /^\\/diagrams\\/[a-z0-9-]+\\.svg$/.test(href)\n    && fs.existsSync(path.join(root, "public", href.slice(1)));\n}\n\nfor (const fileName of files) {`;
  if (source.includes(routeHelperAnchor)) {
    source = source.replace(routeHelperAnchor, routeHelper);
  } else if (!source.includes("function isExistingPublicDiagram")) {
    throw new Error("Unable to add public diagram helper to route check");
  }

  const linkConditionBefore = `      !knownRoutes.has(href) &&\n      !href.startsWith("/blog/page/") &&`;
  const linkConditionAfter = `      !knownRoutes.has(href) &&\n      !isExistingPublicDiagram(href) &&\n      !href.startsWith("/blog/page/") &&`;
  if (source.includes(linkConditionBefore)) {
    source = source.replace(linkConditionBefore, linkConditionAfter);
  } else if (!source.includes("!isExistingPublicDiagram(href)")) {
    throw new Error("Unable to add diagram validation to route links");
  }

  source = source.replace(
    `  ["/tools/creep-body-calculator", "src/app/tools/creep-body-calculator/page.tsx"],\n  ["/verification",`,
    `  ["/tools/creep-body-calculator", "src/app/tools/creep-body-calculator/page.tsx"],\n  ["/tools/room-diagnostics", "src/app/tools/room-diagnostics/page.tsx"],\n  ["/verification",`,
  );

  fs.writeFileSync(filePath, source);
}

patchContentCheck();
patchInternalLinkCheck();
patchRouteCheck();
console.log("P2 public diagrams and diagnostics route registered with all link and route checks.");
