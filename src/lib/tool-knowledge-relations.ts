import { englishDiscoveryArticles } from "@/lib/english-discovery";
import { getAllPosts } from "@/lib/posts";
import { screepsApiHubs } from "@/lib/screeps-api-hubs";
import { screepsApiReference } from "@/lib/screeps-api-reference";
import { screepsErrorCodes } from "@/lib/screeps-errors";

export type ToolKnowledgeRelationsLocale = "zh" | "en";

export interface ToolKnowledgeRelationLink {
  href: string;
  label: string;
  meta?: string;
}

export interface ToolKnowledgeRelationRecord {
  toolHref: string;
  guides: ToolKnowledgeRelationLink[];
  apiHubs: ToolKnowledgeRelationLink[];
  errors: ToolKnowledgeRelationLink[];
}

function appendUnique(
  target: ToolKnowledgeRelationLink[],
  item: ToolKnowledgeRelationLink | null,
) {
  if (!item || target.some((current) => current.href === item.href)) return;
  target.push(item);
}

export function getToolKnowledgeRelationIndex(
  locale: ToolKnowledgeRelationsLocale,
): ToolKnowledgeRelationRecord[] {
  const postsByHref = new Map(
    getAllPosts().map((post) => [
      `/blog/${post.slug}`,
      { href: `/blog/${post.slug}`, label: post.title },
    ]),
  );
  const englishByHref = new Map(
    englishDiscoveryArticles.map((article) => [
      article.href,
      { href: article.href, label: article.title },
    ]),
  );
  const englishByChinesePath = new Map(
    englishDiscoveryArticles.map((article) => [article.chinesePath, article]),
  );
  const apiById = new Map(screepsApiReference.map((entry) => [entry.id, entry]));
  const errorByName = new Map(screepsErrorCodes.map((error) => [error.name, error]));
  const relations = new Map<string, ToolKnowledgeRelationRecord>();

  for (const hub of screepsApiHubs) {
    for (const tool of hub.tools) {
      const toolHref = locale === "zh" ? tool.zhHref : tool.enHref;
      const relation = relations.get(toolHref) ?? {
        toolHref,
        guides: [],
        apiHubs: [],
        errors: [],
      };

      appendUnique(relation.apiHubs, {
        href:
          locale === "zh"
            ? `/screeps-api/${hub.slug}`
            : `/en/screeps-api/${hub.slug}`,
        label: locale === "zh" ? hub.zhTitle : hub.enTitle,
        meta: hub.objectName,
      });

      for (const entryId of hub.entryIds) {
        const entry = apiById.get(entryId);
        const chineseGuideHref = entry?.guideHref;
        if (!entry || !chineseGuideHref) continue;

        if (locale === "zh") {
          const guide = postsByHref.get(chineseGuideHref);
          appendUnique(
            relation.guides,
            guide
              ? { ...guide, meta: entry.signature }
              : null,
          );
          continue;
        }

        const englishArticle = englishByChinesePath.get(chineseGuideHref);
        const guide = englishArticle ? englishByHref.get(englishArticle.href) : null;
        appendUnique(
          relation.guides,
          guide
            ? { ...guide, meta: entry.signature }
            : null,
        );
      }

      for (const extraGuide of hub.extraGuides ?? []) {
        appendUnique(relation.guides, {
          href: locale === "zh" ? extraGuide.zhHref : extraGuide.enHref,
          label: locale === "zh" ? extraGuide.zhLabel : extraGuide.enLabel,
        });
      }

      for (const errorName of hub.errorNames) {
        const error = errorByName.get(errorName);
        if (!error) continue;
        appendUnique(relation.errors, {
          href: `${locale === "zh" ? "/screeps-errors" : "/en/screeps-errors"}#${error.name.toLowerCase()}`,
          label: error.name,
          meta: String(error.value),
        });
      }

      relations.set(toolHref, relation);
    }
  }

  return [...relations.values()].map((relation) => ({
    ...relation,
    guides: relation.guides.slice(0, 5),
    apiHubs: relation.apiHubs.slice(0, 4),
    errors: relation.errors.slice(0, 6),
  }));
}
