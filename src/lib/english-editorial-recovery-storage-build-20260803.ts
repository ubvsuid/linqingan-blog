import type { EnglishBeginnerArticle } from "./english-beginner-content";
import { englishConstructionProgressArticle } from "./english-construction-progress-15";
import { englishEditorialRecoveryConstructionOverride20260803 } from "./editorial/english-editorial-recovery-construction-20260803";
import { englishEditorialRecoveryEmergencyOverride20260803 } from "./editorial/english-editorial-recovery-emergency-20260803";
import { englishEditorialRecoveryStorageOverride20260803 } from "./editorial/english-editorial-recovery-storage-20260803";
import { getEnglishSpawnBatchThreeArticle } from "./english-spawn-content-3";
import { englishStorageEnergyArticle } from "./english-storage-energy-12";

const emergencyHarvesterBase = getEnglishSpawnBatchThreeArticle(
  "screeps-emergency-harvester-recovery",
);

if (!emergencyHarvesterBase) {
  throw new Error("Emergency harvester article is not registered");
}

export const englishEditorialEmergencyHarvesterArticle20260803: EnglishBeginnerArticle = {
  ...emergencyHarvesterBase,
  ...englishEditorialRecoveryEmergencyOverride20260803,
};

export const englishEditorialStorageEnergyArticle20260803: EnglishBeginnerArticle = {
  ...englishStorageEnergyArticle,
  ...englishEditorialRecoveryStorageOverride20260803,
};

export const englishEditorialConstructionProgressArticle20260803: EnglishBeginnerArticle = {
  ...englishConstructionProgressArticle,
  ...englishEditorialRecoveryConstructionOverride20260803,
};

export const englishEditorialRecoveryStorageBuildOverrides20260803: Record<
  string,
  EnglishBeginnerArticle
> = Object.fromEntries(
  [
    englishEditorialEmergencyHarvesterArticle20260803,
    englishEditorialStorageEnergyArticle20260803,
    englishEditorialConstructionProgressArticle20260803,
  ].map((article) => [article.slug, article]),
);
