import fs from "node:fs";
import path from "node:path";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function normalizeKeyword(value) {
  return String(value ?? "").normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeKeywordLoose(value) {
  return normalizeKeyword(value).replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

export function normalizePagePath(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw, "https://www.linqingan.com");
    let pathname = decodeURI(url.pathname || "/");
    pathname = pathname.replace(/\/{2,}/g, "/");
    if (pathname.length > 1) pathname = pathname.replace(/\/+$/, "");
    return pathname || "/";
  } catch {
    const pathname = raw.split(/[?#]/, 1)[0].trim();
    if (!pathname) return "";
    const withSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
    return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
  }
}

function addUnique(map, key, asset) {
  if (!key) return;
  const current = map.get(key);
  if (!current) map.set(key, asset);
  else if (Array.isArray(current)) current.push(asset);
  else map.set(key, [current, asset]);
}

function uniqueAsset(value) {
  return value && !Array.isArray(value) ? value : null;
}

export function loadContentAssetIndex(root = process.cwd()) {
  const knowledgePath = path.join(root, "src", "generated", "knowledge-article-registry.json");
  const roadmapPath = path.join(root, "src", "generated", "beginner-roadmap-registry.json");
  const knowledge = readJson(knowledgePath);
  const roadmap = readJson(roadmapPath);

  const assets = [
    ...knowledge.map((record) => ({
      slug: record.slug,
      href: `/blog/${record.slug}`,
      system: "knowledge",
      nodeType: "article",
      module: record.knowledge.module,
      stage: record.knowledge.stage,
      difficulty: record.knowledge.difficulty,
      ownerKeyword: record.seo.primaryKeyword,
      keywordRole: record.seo.keywordRole,
      searchIntent: record.seo.searchIntent,
      metadataSource: record.source,
    })),
    ...roadmap.map((record) => ({
      slug: record.slug,
      href: `/blog/${record.slug}`,
      system: "roadmap",
      nodeType: "article",
      module: record.roadmap.id,
      stage: record.roadmap.stage,
      difficulty: record.roadmap.difficulty,
      ownerKeyword: record.seo.primaryKeyword,
      keywordRole: record.seo.keywordRole,
      searchIntent: record.seo.searchIntent,
      metadataSource: record.source,
    })),
  ];

  const byPath = new Map();
  const byStrictKeyword = new Map();
  const byLooseKeyword = new Map();
  for (const asset of assets) {
    byPath.set(asset.href, asset);
    if (asset.keywordRole === "owner") {
      addUnique(byStrictKeyword, normalizeKeyword(asset.ownerKeyword), asset);
      addUnique(byLooseKeyword, normalizeKeywordLoose(asset.ownerKeyword), asset);
    }
  }

  return {
    assets,
    resolvePage(value) {
      const pathname = normalizePagePath(value);
      return pathname ? byPath.get(pathname) ?? null : null;
    },
    resolveQuery(value) {
      const strict = uniqueAsset(byStrictKeyword.get(normalizeKeyword(value)));
      if (strict) return { asset: strict, source: "owner-keyword-exact" };
      const loose = uniqueAsset(byLooseKeyword.get(normalizeKeywordLoose(value)));
      if (loose) return { asset: loose, source: "owner-keyword-normalized" };
      return { asset: null, source: null };
    },
  };
}
