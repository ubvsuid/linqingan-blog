import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

function replaceRequired(
  html: string,
  search: string,
  replacement: string,
  label: string,
): string {
  if (!html.includes(search)) {
    throw new Error(`Ninth English editorial finalizer could not find ${label}`);
  }
  return html.replace(search, replacement);
}

export function applyEnglishEditorialNinthFinal20260817(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== "screeps-moveto-not-moving") return article;

  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `function getTargetKey(target) {
  if (!target?.pos) return null;
  return getPositionKey(target.pos);
}`,
    `function getTargetPosition(target) {
  if (target instanceof RoomPosition) {
    return target;
  }

  if (target?.pos instanceof RoomPosition) {
    return target.pos;
  }

  return null;
}

function getTargetKey(target) {
  const pos = getTargetPosition(target);
  return pos ? getPositionKey(pos) : null;
}`,
    "RoomPosition-aware target identity",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `function hasValidRoomPosition(target) {
  return Boolean(
    target
    && target.pos
    && Number.isInteger(target.pos.x)
    && target.pos.x >= 0
    && target.pos.x <= 49
    && Number.isInteger(target.pos.y)
    && target.pos.y >= 0
    && target.pos.y <= 49
    && typeof target.pos.roomName === 'string'
    && target.pos.roomName.length > 0
  );
}`,
    `function hasValidRoomPosition(target) {
  return Boolean(getTargetPosition(target));
}`,
    "movement target validator",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `  const observation = recordMovementObservation(
    creep,
    result
  );

  return {
    status: result === OK ? 'accepted' : 'call-failed',
    tick: Game.time,
    before,
    target: getPositionKey(target.pos),
    range: creep.pos.getRangeTo(target),
    requestedRange: range,
    fatigue: creep.fatigue,
    activeMove: creep.getActiveBodyparts(MOVE),
    result,
    previousPosition: observation.previousKey,
    previousTick: observation.previousTick
  };`,
    `  const observation = recordMovementObservation(
    creep,
    target,
    range,
    result,
    'debugMoveTo'
  );

  return {
    status: result === OK ? 'accepted' : 'call-failed',
    tick: Game.time,
    before,
    target: getTargetKey(target),
    currentRange: creep.pos.getRangeTo(target),
    requestedRange: range,
    fatigue: creep.fatigue,
    activeMove: creep.getActiveBodyparts(MOVE),
    result,
    previousPosition: observation.previousPosition,
    previousTick: observation.previousTick,
    previousAcceptedWithoutProgress:
      observation.previousAcceptedWithoutProgress,
    consecutiveAcceptedStalls:
      observation.consecutiveAcceptedStalls
  };`,
    "debugMoveTo observation call",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p>For a normal Screeps game object, <code>target.pos</code> already follows RoomPosition rules. This guard is useful when your own task system can pass stale, partial, or deserialized target descriptors.</p>`,
    `<p>The wrapper accepts either a real <code>RoomPosition</code> or a game object whose <code>.pos</code> is a <code>RoomPosition</code>. A plain deserialized <code>{x, y, roomName}</code> object is data, not a live RoomPosition; rebuild it with <code>new RoomPosition(x, y, roomName)</code> before using this helper. If your production caller uses the separate numeric <code>x, y</code> overload, normalize those coordinates to a RoomPosition for this diagnostic path.</p>`,
    "movement target scope note",
  );

  return { ...article, articleHtml };
}
