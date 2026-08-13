const baseUrl = process.env.BASE_URL || "https://www.linqingan.com";
const expectedSha = process.env.EXPECTED_DEPLOYMENT_SHA?.trim();
const expectedRef = process.env.EXPECTED_DEPLOYMENT_REF?.trim();
const requiredRef = process.env.REQUIRED_PRODUCTION_REF?.trim() || "clean-blog-v1";

if (!expectedSha) {
  throw new Error("EXPECTED_DEPLOYMENT_SHA is required for the production identity check.");
}

if (!expectedRef) {
  throw new Error("EXPECTED_DEPLOYMENT_REF is required for the production identity check.");
}

if (expectedRef !== requiredRef) {
  throw new Error(`Production deployment came from ${expectedRef}; required branch is ${requiredRef}.`);
}

const response = await fetch(`${baseUrl}/api/deployment`, {
  cache: "no-store",
  headers: { "cache-control": "no-cache" },
});

if (!response.ok) {
  throw new Error(`Deployment identity endpoint returned HTTP ${response.status}.`);
}

const identity = await response.json();

if (identity.commitSha !== expectedSha) {
  throw new Error(
    `Production SHA mismatch: domain reports ${identity.commitSha ?? "missing"}, deployment event reports ${expectedSha}.`,
  );
}

if (identity.commitRef !== requiredRef) {
  throw new Error(
    `Production ref mismatch: domain reports ${identity.commitRef ?? "missing"}, required ${requiredRef}.`,
  );
}

if (identity.environment && identity.environment !== "production") {
  throw new Error(`Production domain reports unexpected Vercel environment ${identity.environment}.`);
}

console.log(`Production identity verified: ${identity.commitRef}@${identity.commitSha}.`);
