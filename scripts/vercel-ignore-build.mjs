const productionBranch = "clean-blog-v1";
const branch = process.env.VERCEL_GIT_COMMIT_REF?.trim() ?? "";

if (!branch) {
  console.log("[vercel-ignore] VERCEL_GIT_COMMIT_REF is unavailable; allowing the build so a legitimate deployment is not blocked.");
  process.exit(1);
}

if (branch === productionBranch) {
  console.log(`[vercel-ignore] allowing Production branch ${productionBranch}.`);
  process.exit(1);
}

console.log(`[vercel-ignore] ignoring automatic Git build for non-production branch ${branch}.`);
process.exit(0);
