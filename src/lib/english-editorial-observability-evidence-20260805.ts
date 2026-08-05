import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishEditorialNotifyEvidenceArticle20260805 } from "./english-editorial-notify-evidence-20260805";
import { englishEditorialEventWindowArticle20260805 } from "./english-editorial-event-window-20260805";
import { englishEditorialRoomVisualEvidenceArticle20260805 } from "./english-editorial-roomvisual-evidence-20260805";

const correctedEventWindowArticle: EnglishBeginnerArticle = {
  ...englishEditorialEventWindowArticle20260805,
  articleHtml: englishEditorialEventWindowArticle20260805.articleHtml
    .replace(
      String.raw`function classifyHistoricalTarget(
  targetId,
  eventTick,
  snapshot
) {`,
      String.raw`function classifyHistoricalTarget(
  targetId,
  roomName,
  eventTick,
  snapshot
) {`,
    )
    .replace(
      "snapshot?.roomName === snapshot?.roomName",
      "snapshot?.roomName === roomName",
    )
    .replace(
      String.raw`event.data.targetId,
          eventTick,
          ownershipSnapshot`,
      String.raw`event.data.targetId,
          roomName,
          eventTick,
          ownershipSnapshot`,
    ),
};

const correctedRoomVisualArticle: EnglishBeginnerArticle = {
  ...englishEditorialRoomVisualEvidenceArticle20260805,
  articleHtml: englishEditorialRoomVisualEvidenceArticle20260805.articleHtml.replace(
    "layers.set(layer.layerId, structuredClone(layer));",
    "layers.set(layer.layerId, JSON.parse(JSON.stringify(layer)));",
  ),
};

export const englishEditorialObservabilityEvidenceOverrides20260805 = {
  [englishEditorialNotifyEvidenceArticle20260805.slug]:
    englishEditorialNotifyEvidenceArticle20260805,
  [correctedEventWindowArticle.slug]: correctedEventWindowArticle,
  [correctedRoomVisualArticle.slug]: correctedRoomVisualArticle,
} satisfies Record<string, EnglishBeginnerArticle>;
