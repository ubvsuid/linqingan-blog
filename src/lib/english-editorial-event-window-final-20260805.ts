import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishEditorialEventWindowArticle20260805 } from "./english-editorial-event-window-20260805";

export const englishEditorialEventWindowFinalArticle20260805: EnglishBeginnerArticle = {
  ...englishEditorialEventWindowArticle20260805,
  articleHtml: englishEditorialEventWindowArticle20260805.articleHtml
    .replace(
      String.raw`function detectEventWindowGap(
  roomName,
  currentEventTick
) {
  const latest = Memory.roomEventLatest?.[roomName];

  if (!Number.isInteger(latest)) {
    return {
      status: 'first-observed-window',
      missingTicks: []
    };
  }

  if (currentEventTick === latest + 1) {
    return {
      status: 'continuous-window',
      missingTicks: []
    };
  }

  const missingTicks = [];
  for (
    let tick = latest + 1;
    tick &lt; currentEventTick;
    tick += 1
  ) {
    missingTicks.push(tick);
  }

  return {
    status: 'non-replayable-gap-observed',
    missingTicks
  };
}`,
      String.raw`function detectEventWindowGap(
  roomName,
  currentEventTick
) {
  const latest = Memory.roomEventLatest?.[roomName];

  if (!Number.isInteger(latest)) {
    return {
      status: 'first-observed-window',
      missingFrom: null,
      missingTo: null,
      missingCount: 0,
      sampleTicks: [],
      sampleTruncated: false
    };
  }

  if (currentEventTick === latest + 1) {
    return {
      status: 'continuous-window',
      missingFrom: null,
      missingTo: null,
      missingCount: 0,
      sampleTicks: [],
      sampleTruncated: false
    };
  }

  const missingFrom = latest + 1;
  const missingTo = currentEventTick - 1;
  const missingCount = Math.max(
    0,
    missingTo - missingFrom + 1
  );
  const sampleCount = Math.min(20, missingCount);
  const sampleTicks = Array.from(
    { length: sampleCount },
    (_, index) =&gt; missingFrom + index
  );

  return {
    status: 'non-replayable-gap-observed',
    missingFrom,
    missingTo,
    missingCount,
    sampleTicks,
    sampleTruncated: missingCount &gt; sampleTicks.length
  };
}`,
    )
    .replace(
      "A gap record is honest evidence that the project did not ingest those ticks. Do not fill the gap with empty arrays, current objects, or later summaries.",
      "A gap record is honest evidence that the project did not ingest that exact range. Keep the inclusive range and count, plus at most 20 sample ticks; do not allocate an unbounded array or fill the gap with empty windows, current objects, or later summaries.",
    )
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
    )
    .replace(
      String.raw`    gapStatus: gap.status,
    missingTicks: gap.missingTicks,`,
      String.raw`    gapStatus: gap.status,
    missingFrom: gap.missingFrom,
    missingTo: gap.missingTo,
    missingCount: gap.missingCount,
    missingTickSample: gap.sampleTicks,
    missingTickSampleTruncated: gap.sampleTruncated,`,
    )
    .replace(
      "<tr><td><code>non-replayable-gap-observed</code></td><td>One or more event ticks were skipped.</td><td>Keep the exact missing tick numbers.</td></tr>",
      "<tr><td><code>non-replayable-gap-observed</code></td><td>One or more event ticks were skipped.</td><td>Keep the exact inclusive range and count, with a bounded sample.</td></tr>",
    ),
};
