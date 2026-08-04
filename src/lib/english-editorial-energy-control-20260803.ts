import type { EnglishBeginnerArticle } from "./english-beginner-content";
import { englishControllerDowngradeArticle } from "./english-controller-downgrade-14";
import { englishEditorialEnergyControllerOverride20260803 } from "./editorial/english-editorial-energy-controller-20260803";
import { englishEditorialEnergyLinkOverride20260803 } from "./editorial/english-editorial-energy-link-20260803";
import { englishEditorialEnergySourceOverride20260803 } from "./editorial/english-editorial-energy-source-20260803";
import { englishLinkTransferArticle } from "./english-link-transfer-18";
import { englishSourceSelectionArticle } from "./english-source-selection-18";

export const englishEditorialControllerDowngradeArticle20260803: EnglishBeginnerArticle = {
  ...englishControllerDowngradeArticle,
  ...englishEditorialEnergyControllerOverride20260803,
};

export const englishEditorialLinkTransferArticle20260803: EnglishBeginnerArticle = {
  ...englishLinkTransferArticle,
  ...englishEditorialEnergyLinkOverride20260803,
};

export const englishEditorialSourceSelectionArticle20260803: EnglishBeginnerArticle = {
  ...englishSourceSelectionArticle,
  ...englishEditorialEnergySourceOverride20260803,
};

export const englishEditorialEnergyControlOverrides20260803: Record<
  string,
  EnglishBeginnerArticle
> = Object.fromEntries(
  [
    englishEditorialControllerDowngradeArticle20260803,
    englishEditorialLinkTransferArticle20260803,
    englishEditorialSourceSelectionArticle20260803,
  ].map((article) => [article.slug, article]),
);
