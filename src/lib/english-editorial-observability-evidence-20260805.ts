import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { applyEnglishRoomVisualCtrBatch02A20260909 } from "./english-ctr-roomvisual-20260909";
import { englishEditorialNotifyEvidenceFinalArticle20260805 } from "./english-editorial-notify-evidence-final-20260805";
import { englishEditorialEventWindowFinalArticle20260805 } from "./english-editorial-event-window-final-20260805";
import { englishEditorialRoomVisualEvidenceFinalArticle20260805 } from "./english-editorial-roomvisual-evidence-final-20260805";

const currentRoomVisualArticle = applyEnglishRoomVisualCtrBatch02A20260909(
  englishEditorialRoomVisualEvidenceFinalArticle20260805,
);

export const englishEditorialObservabilityEvidenceOverrides20260805 = {
  [englishEditorialNotifyEvidenceFinalArticle20260805.slug]:
    englishEditorialNotifyEvidenceFinalArticle20260805,
  [englishEditorialEventWindowFinalArticle20260805.slug]:
    englishEditorialEventWindowFinalArticle20260805,
  ...(currentRoomVisualArticle
    ? { [currentRoomVisualArticle.slug]: currentRoomVisualArticle }
    : {}),
} satisfies Record<string, EnglishBeginnerArticle>;
