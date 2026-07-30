import evidencePriorities from "@/data/english-evidence-priorities.json";

export const dynamic = "force-static";

const statuses = ["needed", "submitted", "under-review", "accepted"] as const;

export async function GET() {
  const counts = Object.fromEntries(
    statuses.map((status) => [
      status,
      evidencePriorities.filter((item) => item.status === status).length,
    ]),
  );
  const updatedAt = evidencePriorities
    .map((item) => item.lastReviewedAt)
    .sort()
    .at(-1);

  return Response.json(
    {
      schemaVersion: 1,
      updatedAt,
      counts,
      items: evidencePriorities,
      evidenceBoundary:
        "Needed, submitted, and under-review items are not live-tested claims. Only accepted evidence may support a Console-tested or live-room-tested label.",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
        "Content-Language": "en",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
