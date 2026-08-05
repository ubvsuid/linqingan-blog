import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishEditorialNotifyEvidenceArticle20260805 } from "./english-editorial-notify-evidence-20260805";
import { englishEditorialEventWindowArticle20260805 } from "./english-editorial-event-window-20260805";
import { englishEditorialRoomVisualEvidenceArticle20260805 } from "./english-editorial-roomvisual-evidence-20260805";

const correctedNotifyArticle: EnglishBeginnerArticle = {
  ...englishEditorialNotifyEvidenceArticle20260805,
  verification: [
    ...englishEditorialNotifyEvidenceArticle20260805.verification.slice(0, 2),
    [
      "Official engine",
      "Checked — Game.notify returns OK when the notification intent enters the per-tick queue and ERR_FULL when the 20-intent limit is exhausted",
    ],
    ...englishEditorialNotifyEvidenceArticle20260805.verification.slice(2),
  ],
  articleHtml: englishEditorialNotifyEvidenceArticle20260805.articleHtml
    .replace(
      "The method does not give game code an external inbox receipt.",
      "The engine returns <code>OK</code> when the notification intent enters the per-tick queue and <code>ERR_FULL</code> when that queue is full. Neither code is an external inbox receipt.",
    )
    .replace(
      String.raw`  try {
    Game.notify(
      request.message,
      request.groupInterval
    );
  } catch (error) {
    dispatcher.release(request);
    request.status = 'notification-call-threw-review-required';
    request.lastError = error instanceof Error
      ? error.message
      : String(error);
    return { status: request.status };
  }

  Memory.notificationSubmissions ??= {};`,
      String.raw`  let result;
  try {
    result = Game.notify(
      request.message,
      request.groupInterval
    );
  } catch (error) {
    dispatcher.release(request);
    request.status = 'notification-call-threw-review-required';
    request.lastError = error instanceof Error
      ? error.message
      : String(error);
    return { status: request.status };
  }

  request.lastResult = result;
  if (result !== OK) {
    dispatcher.release(request);
    request.status = 'notification-rejected-review-required';
    return {
      status: request.status,
      result
    };
  }

  Memory.notificationSubmissions ??= {};`,
    )
    .replace(
      String.raw`    payloadDigest: decision.payloadDigest
  };
}</code></pre>`,
      String.raw`    payloadDigest: decision.payloadDigest,
    result
  };
}</code></pre>`,
    )
    .replace(
      String.raw`<tr><td><code>notification-call-threw-review-required</code></td><td>The call site did not complete normally.</td><td>Keep the request disabled and inspect the error.</td></tr>`,
      String.raw`<tr><td><code>notification-call-threw-review-required</code></td><td>The call site did not complete normally.</td><td>Keep the request disabled and inspect the error.</td></tr>
<tr><td><code>notification-rejected-review-required</code></td><td><code>Game.notify()</code> returned a non-OK code such as <code>ERR_FULL</code>.</td><td>Preserve the exact revision and inspect shared call accounting.</td></tr>`,
    ),
};

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
  [correctedNotifyArticle.slug]: correctedNotifyArticle,
  [correctedEventWindowArticle.slug]: correctedEventWindowArticle,
  [correctedRoomVisualArticle.slug]: correctedRoomVisualArticle,
} satisfies Record<string, EnglishBeginnerArticle>;
