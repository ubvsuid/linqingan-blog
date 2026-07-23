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

patchContentCheck();
patchInternalLinkCheck();
console.log("P2 public diagram assets and diagnostics route registered with link checks.");
