import fs from "node:fs";
import path from "node:path";

import { createIsolatedNeon } from "./database-environment-isolation.mjs";

const evidenceKeyPattern = /^EV-[A-F0-9]{20}$/;

export function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for verification evidence maintenance commands.");
  }
  return databaseUrl;
}

export function getEvidenceSql() {
  return createIsolatedNeon(requireDatabaseUrl());
}

export function normalizeEvidenceKey(value) {
  const key = String(value ?? "").trim().toUpperCase();
  if (!evidenceKeyPattern.test(key)) {
    throw new Error("Evidence key must use the EV-<20 hex characters> format.");
  }
  return key;
}

export async function getEvidenceByKey(sql, evidenceKey) {
  const rows = await sql`
    SELECT
      id,
      evidence_key,
      article_slug,
      language,
      verification_type,
      status,
      game_time,
      shard,
      room_name,
      api_name,
      return_code,
      before_state,
      after_state,
      tick_start,
      tick_end,
      evidence_note,
      source_ref,
      reviewed_at,
      review_note,
      accepted_at,
      revoked_at,
      revoked_reason,
      verified_at,
      created_at
    FROM verification_evidence
    WHERE evidence_key = ${evidenceKey}
    LIMIT 1;
  `;
  return rows[0] ?? null;
}

export function getArticlePath(articleSlug) {
  return path.join(process.cwd(), "content", "posts", `${articleSlug}.md`);
}

export function readArticleSource(articleSlug) {
  const articlePath = getArticlePath(articleSlug);
  if (!fs.existsSync(articlePath)) {
    throw new Error(`Article does not exist: ${articleSlug}`);
  }
  return {
    articlePath,
    source: fs.readFileSync(articlePath, "utf8"),
  };
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function replaceVerificationField(block, field, serializedValue) {
  const fieldPattern = new RegExp(`^  ${field}:.*$`, "m");
  if (fieldPattern.test(block)) {
    return block.replace(fieldPattern, `  ${field}: ${serializedValue}`);
  }
  return `${block.trimEnd()}\n  ${field}: ${serializedValue}\n`;
}

export function patchArticleVerification(source, changes) {
  const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) throw new Error("Article frontmatter block is missing.");

  const frontmatter = frontmatterMatch[1];
  const verificationMatch = frontmatter.match(
    /(^verification:\n[\s\S]*?)(?=^[A-Za-z][A-Za-z0-9_-]*:|\s*$)/m,
  );
  if (!verificationMatch) throw new Error("Article verification frontmatter block is missing.");

  let verificationBlock = verificationMatch[1];
  for (const [field, value] of Object.entries(changes)) {
    if (typeof value === "boolean") {
      verificationBlock = replaceVerificationField(verificationBlock, field, value ? "true" : "false");
    } else if (value !== undefined && value !== null) {
      verificationBlock = replaceVerificationField(verificationBlock, field, yamlString(value));
    }
  }

  const nextFrontmatter = frontmatter.replace(verificationMatch[1], verificationBlock);
  return source.replace(frontmatterMatch[0], `---\n${nextFrontmatter}\n---\n`);
}

export function buildEvidenceEnvironment(evidence) {
  return [evidence.shard, evidence.room_name].filter(Boolean).join(" / ") || "Screeps runtime evidence";
}

export function buildAcceptanceChanges(evidence) {
  const testedAt = new Date(evidence.verified_at).toISOString().slice(0, 10);
  const changes = {
    testedAt,
    testEnvironment: buildEvidenceEnvironment(evidence),
    testResult: `Accepted runtime evidence ${evidence.evidence_key}: ${evidence.evidence_note}`,
  };

  if (evidence.verification_type === "live") {
    changes.liveTested = true;
  } else {
    changes.consoleTested = true;
  }
  return changes;
}

export function printEvidenceSummary(evidence) {
  const tickWindow =
    evidence.tick_start !== null && evidence.tick_end !== null
      ? `${evidence.tick_start}-${evidence.tick_end}`
      : "—";
  console.log(`Evidence: ${evidence.evidence_key}`);
  console.log(`Article: ${evidence.article_slug}`);
  console.log(`Type: ${evidence.verification_type}`);
  console.log(`Status: ${evidence.status}`);
  console.log(`API: ${evidence.api_name}`);
  console.log(`Return: ${evidence.return_code ?? "—"}`);
  console.log(`Game.time: ${evidence.game_time ?? "—"}`);
  console.log(`Ticks: ${tickWindow}`);
  console.log(`Environment: ${buildEvidenceEnvironment(evidence)}`);
  console.log(`Source: ${evidence.source_ref}`);
  console.log(`Verified at: ${new Date(evidence.verified_at).toISOString()}`);
  console.log(`Note: ${evidence.evidence_note}`);
}
