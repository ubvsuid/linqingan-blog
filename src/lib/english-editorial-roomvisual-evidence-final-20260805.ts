import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishEditorialRoomVisualEvidenceArticle20260805 } from "./english-editorial-roomvisual-evidence-20260805";

export const englishEditorialRoomVisualEvidenceFinalArticle20260805: EnglishBeginnerArticle = {
  ...englishEditorialRoomVisualEvidenceArticle20260805,
  articleHtml: englishEditorialRoomVisualEvidenceArticle20260805.articleHtml.replace(
    "layers.set(layer.layerId, structuredClone(layer));",
    "layers.set(layer.layerId, JSON.parse(JSON.stringify(layer)));",
  ),
};
