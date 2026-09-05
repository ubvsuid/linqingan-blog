import fs from "node:fs";
import path from "node:path";

import {
  CONTENT_ID_PATTERN,
  loadContentIdentityRegistry,
} from "./content-identity-registry.mjs";

export const ENGLISH_CONTENT_ID_PATTERN =
  /^en_article_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function field(objectSource, name) {
  const match = objectSource.match(
    new RegExp(`["']?${name}["']?\\s*:\\s*["']([^"']*)["']`),
  );
  return match?.[1] ?? null;
}

function objectFromBrace(source, braceIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = braceIndex; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(braceIndex, index + 1);
    }
  }
  return null;
}

function discoverEnglishModules(completeSource) {
  const modules = new Set(["english-articles"]);
  for (const match of completeSource.matchAll(/from\s+["']\.\/([^"']+)["']/g)) {
    const moduleName = match[1].replace(/\.ts$/, "");
    if (moduleName.startsWith("english-") && moduleName !== "english-articles-complete") {
      modules.add(moduleName);
    }
  }
  return [...modules];
}

function extractEnglishRecords(source, sourceName) {
  const records = [];
  const hrefPattern = /["']?href["']?\s*:\s*["'](\/en\/blog\/[a-z0-9-]+)["']/g;
  for (const match of source.matchAll(hrefPattern)) {
    const brace = source.lastIndexOf("{", match.index);
    const objectSource = brace >= 0 ? objectFromBrace(source, brace) : null;
    if (!objectSource) continue;
    records.push({
      href: match[1],
      chinesePath: field(objectSource, "chinesePath"),
      sourceName,
    });
  }
  return records;
}

export function deriveEnglishContentId(sourceContentId) {
  if (!CONTENT_ID_PATTERN.test(sourceContentId)) {
    throw new Error(`Cannot derive English durable identity from invalid Content Identity: ${sourceContentId}`);
  }
  const englishContentId = `en_${sourceContentId}`;
  if (!ENGLISH_CONTENT_ID_PATTERN.test(englishContentId)) {
    throw new Error(`Derived English durable identity is invalid: ${englishContentId}`);
  }
  return englishContentId;
}

function loadStandaloneEnglishIdentities(root) {
  const relativePath = "content/english-standalone-identities.json";
  const payload = JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
  if (payload?.schemaVersion !== 1 || !Array.isArray(payload.records)) {
    throw new Error(`${relativePath} must use schemaVersion 1 with records[]`);
  }

  const byHref = new Map();
  const ids = new Set();
  for (const record of payload.records) {
    const href = String(record?.href ?? "").trim();
    const contentId = String(record?.contentId ?? "").trim();
    if (!/^\/en\/blog\/[a-z0-9-]+$/.test(href)) {
      throw new Error(`${relativePath} contains an invalid href locator: ${href || "(empty)"}`);
    }
    if (!ENGLISH_CONTENT_ID_PATTERN.test(contentId)) {
      throw new Error(`${relativePath}: ${href} has invalid durable contentId`);
    }
    if (byHref.has(href)) throw new Error(`Duplicate standalone English href locator: ${href}`);
    if (ids.has(contentId)) throw new Error(`Duplicate standalone English contentId: ${contentId}`);
    byHref.set(href, Object.freeze({ href, contentId }));
    ids.add(contentId);
  }
  return byHref;
}

export function loadEnglishContentIdentityReadiness(root = process.cwd()) {
  const completeSource = fs.readFileSync(
    path.join(root, "src/lib/english-articles-complete.ts"),
    "utf8",
  );
  const libRoot = path.join(root, "src/lib");
  const recordsByHref = new Map();

  for (const moduleName of discoverEnglishModules(completeSource)) {
    const sourcePath = path.join(libRoot, `${moduleName}.ts`);
    if (!fs.existsSync(sourcePath)) continue;
    const source = fs.readFileSync(sourcePath, "utf8");
    for (const record of extractEnglishRecords(source, `src/lib/${moduleName}.ts`)) {
      const existing = recordsByHref.get(record.href);
      if (existing && existing.chinesePath !== record.chinesePath) {
        throw new Error(`Conflicting English article locator ownership for ${record.href}`);
      }
      recordsByHref.set(record.href, record);
    }
  }

  const contentIdentities = loadContentIdentityRegistry(root);
  const standaloneByHref = loadStandaloneEnglishIdentities(root);
  const resolved = [];
  const usedIds = new Set();

  for (const record of [...recordsByHref.values()].sort((a, b) => a.href.localeCompare(b.href))) {
    let contentId;
    let sourceContentId = null;
    if (record.chinesePath) {
      if (!/^\/blog\/[a-z0-9-]+$/.test(record.chinesePath)) {
        throw new Error(`${record.href} has invalid Chinese locator ${record.chinesePath}`);
      }
      const slug = record.chinesePath.slice("/blog/".length);
      const identity = contentIdentities.bySlug.get(slug);
      if (!identity) {
        throw new Error(`${record.href} points to Chinese content without permanent identity: ${record.chinesePath}`);
      }
      sourceContentId = identity.contentId;
      contentId = deriveEnglishContentId(identity.contentId);
    } else {
      const standalone = standaloneByHref.get(record.href);
      if (!standalone) {
        throw new Error(`${record.href} is English-original but has no persisted standalone durable identity`);
      }
      contentId = standalone.contentId;
    }

    if (usedIds.has(contentId)) throw new Error(`Duplicate English durable contentId: ${contentId}`);
    usedIds.add(contentId);
    resolved.push(Object.freeze({ ...record, contentId, sourceContentId }));
  }

  const standaloneRecords = resolved.filter((record) => !record.chinesePath);
  const standaloneResolvedHrefs = new Set(standaloneRecords.map((record) => record.href));
  for (const href of standaloneByHref.keys()) {
    if (!standaloneResolvedHrefs.has(href)) {
      throw new Error(`Standalone English identity has no published owner: ${href}`);
    }
  }

  return Object.freeze({
    records: Object.freeze(resolved),
    byHref: new Map(resolved.map((record) => [record.href, record])),
    bilingualRecords: Object.freeze(resolved.filter((record) => Boolean(record.chinesePath))),
    standaloneRecords: Object.freeze(standaloneRecords),
  });
}
