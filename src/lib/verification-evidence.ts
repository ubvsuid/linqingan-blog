import { desc } from "drizzle-orm";

import { getPlatformDatabase } from "@/db/client";
import { verificationEvidence } from "@/db/schema";

export type RuntimeVerificationType = "console" | "live";

export interface PublicVerificationEvidenceRecord {
  id: number;
  articleSlug: string;
  language: string;
  verificationType: RuntimeVerificationType;
  gameTime: number | null;
  shard: string | null;
  roomName: string | null;
  apiName: string | null;
  returnCode: string | null;
  tickStart: number | null;
  tickEnd: number | null;
  evidenceNote: string | null;
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

export async function getPublicVerificationEvidence(
  limit = 500,
): Promise<PublicVerificationEvidenceRecord[]> {
  const db = getPlatformDatabase();
  if (!db) return [];

  try {
    const rows = await db
      .select({
        id: verificationEvidence.id,
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
      })
      .from(verificationEvidence)
      .orderBy(desc(verificationEvidence.verifiedAt))
      .limit(Math.max(1, Math.min(limit, 1000)));

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
  } catch (error) {
    console.warn("Verification evidence database read failed; using Markdown fallback", error);
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
