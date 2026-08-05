import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishEditorialNotifyEvidenceArticle20260805 } from "./english-editorial-notify-evidence-20260805";
import { englishEditorialEventWindowArticle20260805 } from "./english-editorial-event-window-20260805";
import { englishEditorialRoomVisualEvidenceArticle20260805 } from "./english-editorial-roomvisual-evidence-20260805";

export const englishEditorialObservabilityEvidenceOverrides20260805 = {
  [englishEditorialNotifyEvidenceArticle20260805.slug]:
    englishEditorialNotifyEvidenceArticle20260805,
  [englishEditorialEventWindowArticle20260805.slug]:
    englishEditorialEventWindowArticle20260805,
  [englishEditorialRoomVisualEvidenceArticle20260805.slug]:
    englishEditorialRoomVisualEvidenceArticle20260805,
} satisfies Record<string, EnglishBeginnerArticle>;
