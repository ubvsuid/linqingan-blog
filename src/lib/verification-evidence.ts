import { and, desc, eq } from "drizzle-orm";

import { getPlatformDatabase } from "@/db/client";
import { verificationEvidence } from "@/db/schema";

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
  id: verificationEvidence.id,
  evidenceKey: verificationEvidence.evidenceKey,
  articleSlug: verificationEvidence.articleSlug,
  language: verificationEvidence.language,
  verificationType: verificationEvidence.verificationType,
  gameTime: verificationEvidence.gameTime,
  shard: verificationEvidence.shard,
  roomName: verificationEvidence.roomName,
  apiName: verificationEvidence.apiName,
  returnCode: verificationEvidence.returnCode,
  tickStart: verificationEvidence.tickStart,
  tickEnd: verificationEvidence.tickEnd,
  evidenceNote: verificationEvidence.evidenceNote,
  verifiedAt: verificationEvidence.verifiedAt,
};

export async function getPublicVerificationEvidence(
  limit = 500,
): Promise<PublicVerificationEvidenceRecord[]> {
  const db = getPlatformDatabase();
  if (!db) return [];

  try {
    const rows = await db
      .select(publicSelection)
      .from(verificationEvidence)
      .where(eq(verificationEvidence.status, "accepted"))
      .orderBy(desc(verificationEvidence.verifiedAt))
      .limit(Math.max(1, Math.min(limit, 1000)));

    return mapPublicRows(rows);
  } catch (error) {
    console.warn("Verification evidence database read failed; using Markdown fallback", error);
    return [];
  }
}

export async function getPublicVerificationEvidenceForArticle(
  articleSlug: string,
  limit = 20,
): Promise<PublicVerificationEvidenceRecord[]> {
  const db = getPlatformDatabase();
  if (!db) return [];

  try {
    const rows = await db
      .select(publicSelection)
      .from(verificationEvidence)
      .where(
        and(
          eq(verificationEvidence.articleSlug, articleSlug),
          eq(verificationEvidence.status, "accepted"),
        ),
      )
      .orderBy(desc(verificationEvidence.verifiedAt))
      .limit(Math.max(1, Math.min(limit, 100)));

    return mapPublicRows(rows);
  } catch (error) {
    console.warn(`Verification evidence read failed for ${articleSlug}; using Markdown-only article state`, error);
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
