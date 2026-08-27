import { desc, eq } from "drizzle-orm";

import { getPlatformDatabase, getPlatformSql } from "@/db/client";
import { publicVerificationEvidence } from "@/db/schema";

export type RuntimeVerificationType = "console" | "live";

export interface PublicVerificationEvidenceRecord {
  id: number;
  evidenceKey: string;
  articleSlug: string;
  language: string;
  verificationType: RuntimeVerificationType;
  gameTime: number | null;
  shard: string | null;
  roomName: string | null;
  apiName: string;
  returnCode: string | null;
  tickStart: number | null;
  tickEnd: number | null;
  evidenceNote: string;
  verifiedAt: string;
}

export interface ArticleEvidenceSummary {
  count: number;
  consoleTested: boolean;
  liveTested: boolean;
  latestVerifiedAt: string;
  latest: PublicVerificationEvidenceRecord;
  environment?: string;
}

let governanceReadiness = {
  checkedAt: 0,
  ready: false,
};

async function isVerificationGovernanceReady(): Promise<boolean> {
  const sql = getPlatformSql();
  if (!sql) return false;

  const now = Date.now();
  if (now - governanceReadiness.checkedAt < 60_000) {
    return governanceReadiness.ready;
  }

  try {
    const [row] = await sql`
      SELECT
        EXISTS (
          SELECT 1
          FROM information_schema.views
          WHERE table_schema = 'public'
            AND table_name = 'verification_evidence_public'
        ) AS ready;
    `;
    governanceReadiness = {
      checkedAt: now,
      ready: Boolean(row?.ready),
    };
  } catch {
    governanceReadiness = {
      checkedAt: now,
      ready: false,
    };
  }

  return governanceReadiness.ready;
}

function isRuntimeVerificationType(value: string): value is RuntimeVerificationType {
  return value === "console" || value === "live";
}

function buildEnvironment(record: PublicVerificationEvidenceRecord): string | undefined {
  return [record.shard, record.roomName].filter(Boolean).join(" · ") || undefined;
}

function mapPublicRows(rows: Array<{
  id: number;
  evidenceKey: string;
  articleSlug: string;
  language: string;
  verificationType: string;
  gameTime: number | null;
  shard: string | null;
  roomName: string | null;
  apiName: string;
  returnCode: string | null;
  tickStart: number | null;
  tickEnd: number | null;
  evidenceNote: string;
  verifiedAt: Date;
}>): PublicVerificationEvidenceRecord[] {
  return rows.flatMap((row) => {
    if (!isRuntimeVerificationType(row.verificationType)) return [];
    return [
      {
        ...row,
        verificationType: row.verificationType,
        verifiedAt: row.verifiedAt.toISOString(),
      } satisfies PublicVerificationEvidenceRecord,
    ];
  });
}

const publicSelection = {
  id: publicVerificationEvidence.id,
  evidenceKey: publicVerificationEvidence.evidenceKey,
  articleSlug: publicVerificationEvidence.articleSlug,
  language: publicVerificationEvidence.language,
  verificationType: publicVerificationEvidence.verificationType,
  gameTime: publicVerificationEvidence.gameTime,
  shard: publicVerificationEvidence.shard,
  roomName: publicVerificationEvidence.roomName,
  apiName: publicVerificationEvidence.apiName,
  returnCode: publicVerificationEvidence.returnCode,
  tickStart: publicVerificationEvidence.tickStart,
  tickEnd: publicVerificationEvidence.tickEnd,
  evidenceNote: publicVerificationEvidence.evidenceNote,
  verifiedAt: publicVerificationEvidence.verifiedAt,
};

export async function getPublicVerificationEvidence(
  limit = 500,
): Promise<PublicVerificationEvidenceRecord[]> {
  const db = getPlatformDatabase();
  if (!db || !(await isVerificationGovernanceReady())) return [];

  try {
    const rows = await db
      .select(publicSelection)
      .from(publicVerificationEvidence)
      .orderBy(desc(publicVerificationEvidence.verifiedAt))
      .limit(Math.max(1, Math.min(limit, 1000)));

    return mapPublicRows(rows);
  } catch {
    console.warn("Verification evidence database read failed; using Markdown fallback.");
    return [];
  }
}

export async function getPublicVerificationEvidenceForArticle(
  articleSlug: string,
  limit = 20,
): Promise<PublicVerificationEvidenceRecord[]> {
  const db = getPlatformDatabase();
  if (!db || !(await isVerificationGovernanceReady())) return [];

  try {
    const rows = await db
      .select(publicSelection)
      .from(publicVerificationEvidence)
      .where(eq(publicVerificationEvidence.articleSlug, articleSlug))
      .orderBy(desc(publicVerificationEvidence.verifiedAt))
      .limit(Math.max(1, Math.min(limit, 100)));

    return mapPublicRows(rows);
  } catch {
    console.warn(`Verification evidence read failed for ${articleSlug}; using Markdown-only article state.`);
    return [];
  }
}

export function summarizeVerificationEvidence(
  records: PublicVerificationEvidenceRecord[],
): Map<string, ArticleEvidenceSummary> {
  const summaries = new Map<string, ArticleEvidenceSummary>();

  for (const record of records) {
    const current = summaries.get(record.articleSlug);
    if (!current) {
      summaries.set(record.articleSlug, {
        count: 1,
        consoleTested: record.verificationType === "console",
        liveTested: record.verificationType === "live",
        latestVerifiedAt: record.verifiedAt,
        latest: record,
        environment: buildEnvironment(record),
      });
      continue;
    }

    current.count += 1;
    current.consoleTested ||= record.verificationType === "console";
    current.liveTested ||= record.verificationType === "live";

    if (record.verifiedAt > current.latestVerifiedAt) {
      current.latestVerifiedAt = record.verifiedAt;
      current.latest = record;
      current.environment = buildEnvironment(record);
    }
  }

  return summaries;
}
