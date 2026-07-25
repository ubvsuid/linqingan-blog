import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishMovementBatchSixArticles as sourceArticles } from "@/lib/english-movement-content-6";

const incompleteRouteCallback = String.raw`<pre><code class="language-javascript">routeCallback(roomName, fromRoomName) {
  if (Memory.routeAvoid?.includes(roomName)) {
    return Infinity;
  }

  if (isPreferredRoom(roomName)) {
    return 1;
  }

  return 2.5;
}</code></pre>`;

const completeRouteOptions = String.raw`<pre><code class="language-javascript">const routeOptions = {
  routeCallback(roomName, fromRoomName) {
    if (Memory.routeAvoid?.includes(roomName)) {
      return Infinity;
    }

    if (isPreferredRoom(roomName)) {
      return 1;
    }

    return 2.5;
  }
};</code></pre>`;

export const englishMovementBatchSixArticles = sourceArticles.map((article) => ({
  ...article,
  articleHtml: article.articleHtml.replace(
    incompleteRouteCallback,
    completeRouteOptions,
  ),
})) satisfies EnglishBeginnerArticle[];

export const englishMovementBatchSixBySlug = Object.fromEntries(
  englishMovementBatchSixArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishMovementBatchSixArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishMovementBatchSixBySlug[slug];
}
