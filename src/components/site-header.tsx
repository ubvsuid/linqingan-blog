import { SiteHeaderClient } from "@/components/site-header-client";
import { beginnerSeriesSlugs } from "@/lib/beginner-series";
import {
  englishNavigation,
  languageRoutePairs,
} from "@/lib/i18n";
import { knowledgeBaseSlugs } from "@/lib/knowledge-base";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  return (
    <SiteHeaderClient
      chineseNavigation={siteConfig.navigation.map((item) => ({ ...item }))}
      englishNavigation={englishNavigation.map((item) => ({ ...item }))}
      beginnerArticlePaths={beginnerSeriesSlugs.map((slug) => `/blog/${slug}`)}
      knowledgeArticlePaths={knowledgeBaseSlugs.map((slug) => `/blog/${slug}`)}
      languageRoutePairs={Object.entries(languageRoutePairs)}
    />
  );
}
