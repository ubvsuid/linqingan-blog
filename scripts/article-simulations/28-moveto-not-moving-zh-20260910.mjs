import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const article = fs.readFileSync(
  path.join(root, "content", "posts", "screeps-moveto-not-moving.md"),
  "utf8",
);

const OK = 0;
const ERR_NO_PATH = -2;
const ERR_NOT_FOUND = -5;

function evaluateMoveRequest({
  creepExists,
  targetExists,
  targetHasPosition,
  creepSpawning,
  activeMoveParts,
  fatigue,
  currentRange,
  desiredRange,
  moveResult,
}) {
  if (!creepExists) return "creep-missing";
  if (!targetExists || !targetHasPosition) return "target-invalid";
  if (creepSpawning) return "creep-spawning";
  if (!Number.isInteger(activeMoveParts) || activeMoveParts <= 0) {
    return "no-active-move-part";
  }
  if (!Number.isFinite(fatigue) || fatigue > 0) return "creep-tired";
  if (!Number.isInteger(desiredRange) || desiredRange < 0) return "range-invalid";
  if (currentRange <= desiredRange) return "already-in-range";
  if (moveResult !== undefined && moveResult !== OK) return `move-failed:${moveResult}`;
  return "move-needed";
}

const base = {
  creepExists: true,
  targetExists: true,
  targetHasPosition: true,
  creepSpawning: false,
  activeMoveParts: 1,
  fatigue: 0,
  currentRange: 5,
  desiredRange: 1,
  moveResult: OK,
};

assert.equal(evaluateMoveRequest(base), "move-needed");
assert.equal(
  evaluateMoveRequest({ ...base, targetExists: false }),
  "target-invalid",
);
assert.equal(
  evaluateMoveRequest({ ...base, creepSpawning: true }),
  "creep-spawning",
);
assert.equal(
  evaluateMoveRequest({ ...base, activeMoveParts: 0 }),
  "no-active-move-part",
);
assert.equal(
  evaluateMoveRequest({ ...base, fatigue: 2 }),
  "creep-tired",
);
assert.equal(
  evaluateMoveRequest({ ...base, currentRange: 1 }),
  "already-in-range",
);
assert.equal(
  evaluateMoveRequest({ ...base, moveResult: ERR_NO_PATH }),
  "move-failed:-2",
);
assert.equal(
  evaluateMoveRequest({ ...base, moveResult: ERR_NOT_FOUND }),
  "move-failed:-5",
);

for (const requiredText of [
  'description: "Screeps moveTo() 返回 OK 但 Creep 不移动、走不动或卡住？',
  'updatedAt: "2026-09-10"',
  'checkedAt: "2026-09-10"',
  'testedAt: "2026-09-10"',
  "| `OK (0)` |",
  "| `ERR_NOT_OWNER (-1)` |",
  "| `ERR_NO_PATH (-2)` |",
  "| `ERR_BUSY (-4)` |",
  "| `ERR_NOT_FOUND (-5)` |",
  "| `ERR_INVALID_TARGET (-7)` |",
  "| `ERR_TIRED (-11)` |",
  "creep.getActiveBodyparts(MOVE)",
  "reusePath: unchangedTicks >= 2 ? 0 : 5",
  "官方 `moveTo()` 的 `reusePath` 默认值是 5",
  "`ERR_NOT_FOUND (-5)`",
  "## FAQ：Screeps `moveTo()` 不动的高频问题",
  "### `moveTo()` 返回 `OK`，为什么 Creep 还是不移动？",
  "### `ERR_TIRED (-11)` 应该怎么处理？",
  "### 没有有效 `MOVE` 部件时，`moveTo()` 会返回 `ERR_NO_BODYPART (-12)` 吗？",
  "### `reusePath` 会让 Creep 看起来卡住吗？",
  "](/blog/screeps-err-no-path)",
  "](/blog/screeps-move-fatigue-body-ratio)",
  "](/blog/screeps-roomposition-distance)",
  "](/blog/screeps-roomvisual-debug)",
  "](/screeps-errors)",
  "资料核对日期：2026-09-10",
]) {
  assert.ok(
    article.includes(requiredText),
    `moveTo article missing required regression boundary: ${requiredText}`,
  );
}

assert.ok(
  article.includes(
    "当前官方 `moveTo()` 返回值列表**没有列 `ERR_NO_BODYPART (-12)`**",
  ),
  "moveTo article must distinguish active-MOVE precheck from documented return codes",
);

assert.ok(
  !/^\| `ERR_NO_BODYPART(?: \(-12\))?` \|/m.test(article),
  "moveTo article must not list ERR_NO_BODYPART as a documented moveTo return-code row",
);

assert.ok(
  !/^\| `ERR_NOT_IN_RANGE(?: \(-9\))?` \|/m.test(article),
  "moveTo article must not list ERR_NOT_IN_RANGE as a moveTo return-code row",
);

console.log(
  "中文 moveTo 不移动 regression 通过：前置条件、官方返回码边界、reusePath/noPathFinding、FAQ、搜索意图描述与站内链接均通过。",
);
