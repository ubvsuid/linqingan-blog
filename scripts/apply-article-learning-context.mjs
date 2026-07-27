import fs from "node:fs";

const filePath = "src/app/(zh)/blog/[slug]/page.tsx";
let source = fs.readFileSync(filePath, "utf8");

if (!source.includes('import { ArticleLearningContext } from "@/components/article-learning-context";')) {
  source = source.replace(
    'import { ArticleFeedback } from "@/components/article-feedback";',
    'import { ArticleFeedback } from "@/components/article-feedback";\nimport { ArticleLearningContext } from "@/components/article-learning-context";',
  );
}

if (!source.includes("<ArticleLearningContext slug={post.slug}")) {
  source = source.replace(
    `          </header>

          <section className="verification-status"`,
    `          </header>

          <ArticleLearningContext slug={post.slug} />

          <section className="verification-status"`,
  );
}

fs.writeFileSync(filePath, source);
console.log("Article difficulty, stage and prerequisite context applied.");
