import Link from "next/link";

import {
  beginnerSeriesSlugs,
  getBeginnerStageForSlug,
} from "@/lib/beginner-series";
import { getKnowledgeBasePostPosition } from "@/lib/knowledge-base";
import { getAllPosts } from "@/lib/posts";

interface ArticleLearningContextProps {
  slug: string;
}

function getKnowledgeStage<T extends { title: string; from: number; to: number }>(
  index: number,
  stages: readonly T[],
): T {
  return stages.find((stage) => index >= stage.from && index < stage.to) ?? stages[stages.length - 1];
}

export function ArticleLearningContext({ slug }: ArticleLearningContextProps) {
  const postsBySlug = new Map(getAllPosts().map((post) => [post.slug, post]));
  const beginnerStage = getBeginnerStageForSlug(slug);
  const beginnerIndex = beginnerSeriesSlugs.indexOf(slug);
  const knowledgePosition = getKnowledgeBasePostPosition(slug);

  if (beginnerStage) {
    const previousSlug = beginnerIndex > 0 ? beginnerSeriesSlugs[beginnerIndex - 1] : null;
    const previousPost = previousSlug ? postsBySlug.get(previousSlug) : null;
    return (
      <section className="article-learning-context" aria-label="文章学习信息">
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
  }

  if (!knowledgePosition) return null;

  const stage = getKnowledgeStage(knowledgePosition.index, knowledgePosition.section.stages);
  const stageIndex = knowledgePosition.section.stages.indexOf(stage);
  const difficulty = stageIndex <= 0 ? "基础" : stageIndex === 1 ? "进阶" : "高级";
  const previousPost = knowledgePosition.previousSlug
    ? postsBySlug.get(knowledgePosition.previousSlug)
    : null;

  return (
    <section className="article-learning-context" aria-label="文章学习信息">
      <dl>
        <div><dt>难度</dt><dd>{difficulty}</dd></div>
        <div><dt>所属模块</dt><dd><Link href={`/knowledge/${knowledgePosition.section.id}`}>{knowledgePosition.section.title}</Link></dd></div>
        <div><dt>适用阶段</dt><dd>{stage.title}</dd></div>
        <div><dt>模块位置</dt><dd>第 {knowledgePosition.index + 1} / {knowledgePosition.section.slugs.length} 篇</dd></div>
        <div className="article-learning-prerequisite">
          <dt>前置知识</dt>
          <dd>{previousPost ? <Link href={`/blog/${previousPost.slug}`}>{previousPost.title}</Link> : "已完成新手路线即可开始"}</dd>
        </div>
      </dl>
      <style>{`
        .article-learning-context {
          margin: -30px 0 46px;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 18px 0;
        }
        .article-learning-context dl {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px 24px;
          margin: 0;
        }
        .article-learning-context dl > div { display: grid; gap: 5px; }
        .article-learning-context dt {
          color: var(--muted);
          font-family: "SFMono-Regular", Consolas, monospace;
          font-size: 10px;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .article-learning-context dd { margin: 0; font-size: 13px; font-weight: 680; line-height: 1.5; }
        .article-learning-prerequisite { grid-column: span 2; }
        @media (max-width: 760px) {
          .article-learning-context dl { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .article-learning-prerequisite { grid-column: 1 / -1; }
        }
        @media (max-width: 460px) {
          .article-learning-context dl { grid-template-columns: 1fr; }
          .article-learning-prerequisite { grid-column: auto; }
        }
      `}</style>
    </section>
  );
}
