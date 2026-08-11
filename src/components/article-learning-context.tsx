import Link from "next/link";

import { ArticleRuntimeEvidenceCard } from "@/components/article-runtime-evidence-card";
import {
  beginnerSeriesSlugs,
  getBeginnerStageForSlug,
} from "@/lib/beginner-series";
import { getKnowledgeBasePostPosition } from "@/lib/knowledge-base";
import { getAllPosts } from "@/lib/posts";
import { getPublicVerificationEvidenceForArticle } from "@/lib/verification-evidence";

import styles from "./article-learning-context.module.css";

interface ArticleLearningContextProps {
  slug: string;
}

function getKnowledgeStage<T extends { title: string; from: number; to: number }>(
  index: number,
  stages: readonly T[],
): T {
  return stages.find((stage) => index >= stage.from && index < stage.to) ?? stages[stages.length - 1];
}

export async function ArticleLearningContext({ slug }: ArticleLearningContextProps) {
  const postsBySlug = new Map(getAllPosts().map((post) => [post.slug, post]));
  const post = postsBySlug.get(slug);
  const beginnerStage = getBeginnerStageForSlug(slug);
  const beginnerIndex = beginnerSeriesSlugs.indexOf(slug);
  const knowledgePosition = getKnowledgeBasePostPosition(slug);

  const runtimeEvidence =
    post && (post.verification.consoleTested || post.verification.liveTested)
      ? (await getPublicVerificationEvidenceForArticle(slug)).filter((record) =>
          record.verificationType === "live"
            ? post.verification.liveTested
            : post.verification.consoleTested,
        )
      : [];

  let learningContext: React.ReactNode = null;

  if (beginnerStage) {
    const previousSlug = beginnerIndex > 0 ? beginnerSeriesSlugs[beginnerIndex - 1] : null;
    const previousPost = previousSlug ? postsBySlug.get(previousSlug) : null;
    learningContext = (
      <section className={styles.context} aria-label="文章学习信息">
        <dl>
          <div><dt>难度</dt><dd>新手</dd></div>
          <div><dt>适用阶段</dt><dd>第 {beginnerStage.number} 阶段 · {beginnerStage.title}</dd></div>
          <div><dt>路线位置</dt><dd>第 {beginnerIndex + 1} / {beginnerSeriesSlugs.length} 篇</dd></div>
          <div>
            <dt>前置知识</dt>
            <dd>{previousPost ? <Link href={`/blog/${previousPost.slug}`}>{previousPost.title}</Link> : "无硬性前置"}</dd>
          </div>
        </dl>
      </section>
    );
  } else if (knowledgePosition) {
    const stage = getKnowledgeStage(knowledgePosition.index, knowledgePosition.section.stages);
    const stageIndex = knowledgePosition.section.stages.indexOf(stage);
    const difficulty = stageIndex <= 0 ? "基础" : stageIndex === 1 ? "进阶" : "高级";
    const previousPost = knowledgePosition.previousSlug
      ? postsBySlug.get(knowledgePosition.previousSlug)
      : null;

    learningContext = (
      <section className={styles.context} aria-label="文章学习信息">
        <dl>
          <div><dt>难度</dt><dd>{difficulty}</dd></div>
          <div><dt>所属模块</dt><dd><Link href={`/knowledge/${knowledgePosition.section.id}`}>{knowledgePosition.section.title}</Link></dd></div>
          <div><dt>适用阶段</dt><dd>{stage.title}</dd></div>
          <div><dt>模块位置</dt><dd>第 {knowledgePosition.index + 1} / {knowledgePosition.section.slugs.length} 篇</dd></div>
          <div className={styles.prerequisite}>
            <dt>前置知识</dt>
            <dd>{previousPost ? <Link href={`/blog/${previousPost.slug}`}>{previousPost.title}</Link> : "已完成新手路线即可开始"}</dd>
          </div>
        </dl>
      </section>
    );
  }

  if (!learningContext && runtimeEvidence.length === 0) return null;

  return (
    <>
      {learningContext}
      <ArticleRuntimeEvidenceCard evidence={runtimeEvidence} locale="zh" />
    </>
  );
}
