import { validateContentMetadataSchemaV1 } from "./lib/content-metadata-schema.mjs";

const result = validateContentMetadataSchemaV1(process.cwd());
for (const warning of result.warnings) console.warn(`WARN: ${warning}`);
if (result.errors.length > 0) {
  for (const error of result.errors) console.error(`ERROR: ${error}`);
  console.error(`\nContent Metadata Schema V1 check failed: ${result.errors.length} issue(s).`);
  process.exit(1);
}
console.log(`Content Metadata Schema V1 passed: ${result.publishedCount} published article(s), Knowledge=${result.knowledgeCount}, Beginner=${result.roadmapCount}, locale default=zh-CN.`);
