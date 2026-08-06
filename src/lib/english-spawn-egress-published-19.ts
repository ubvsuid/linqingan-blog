import {
  englishSpawnEgressBatchNineteenArticles,
} from "@/lib/english-spawn-egress-content-19";

const rawArticle = englishSpawnEgressBatchNineteenArticles[0];
const unsafeDirectionsSnippet = "directions: [...spawn.spawning.directions]";
const safeDirectionsSnippet = `directions: Array.isArray(
      spawn.spawning.directions
    ) && spawn.spawning.directions.length > 0
      ? [...spawn.spawning.directions]
      : [
          TOP,
          TOP_RIGHT,
          RIGHT,
          BOTTOM_RIGHT,
          BOTTOM,
          BOTTOM_LEFT,
          LEFT,
          TOP_LEFT
        ]`;

if (!rawArticle.articleHtml.includes(unsafeDirectionsSnippet)) {
  throw new Error(
    "Spawn egress published normalization could not find the directions snippet",
  );
}

export const englishSpawnEgressPublishedArticle = {
  ...rawArticle,
  title: "Screeps Spawn Exit Blocked: Directions and Egress Recovery",
  articleHtml: rawArticle.articleHtml.replace(
    unsafeDirectionsSnippet,
    safeDirectionsSnippet,
  ),
};
