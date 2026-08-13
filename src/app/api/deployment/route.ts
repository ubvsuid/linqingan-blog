export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      commitRef: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      environment: process.env.VERCEL_ENV ?? null,
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
