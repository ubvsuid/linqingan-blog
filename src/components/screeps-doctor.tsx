"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getProblemResolverDeepLink } from "@/lib/problem-resolver";
import {
  diagnoseCreepHarvestDoctor,
  diagnoseCreepMovementDoctor,
  diagnoseSpawnDoctor,
  SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS,
  type ScreepsDoctorDiagnosis,
} from "@/lib/screeps-doctor";
import { parseScreepsDoctorLaunchSymptom } from "@/lib/screeps-doctor-launcher";
import { trackScreepsDoctorEvent } from "@/lib/screeps-doctor-telemetry-client";

import styles from "./screeps-doctor.module.css";

type Locale = "zh" | "en";
type DoctorSymptom = ScreepsDoctorDiagnosis["symptom"];
type SnapshotSource = "manual" | "example" | "edited-example";
type LocalizedCopy = { zh: string; en: string };

const CAPTURE_COPY = {
  zh: {
    entry: "如何采集 Snapshot", prompt: "没有 Snapshot？展开查看如何从游戏中读取这些值。",
    introduction: "打开 Screeps World/MMO，确认当前 shard、房间和要检查的对象。只在游戏内 Console 或当前对象信息中读取下列事实；不要执行游戏动作或修改 Memory。名称和 object ID 仅用于游戏内定位，不要加入 Snapshot。",
    freshness: "尽量使用同一 tick 的观察。状态改变后重新采集，不要拼接旧数据。查不到对象时先核对名称、ID 和 shard；无法确认可见性时停止填写，不要猜测。",
    unknown: "不知道不等于 false 或 0；只有指定字段允许 null。可见对象的必需事实读不齐时，重新观察，不要用 null 掩盖未知。",
    format: "使用 JSON 双引号，不写注释、尾逗号、undefined 或额外字段。所有规定字段都必须保留。",
    mistakes: "常见填写错误", verification: "诊断后如何复核", exampleTitle: "合法示例（演示数据）",
    example: "演示数据：不代表你的游戏状态。", editedExample: "已编辑示例：请确认每个值来自实际观察。",
    boundary: "通过格式校验或消除一个阻断，不等于游戏动作已成功。按 Fix / Verify 重新观察；必要时继续 Resolver，读取已有真实调用的结果和后续 tick 状态，不要为了验证而额外执行动作。",
    privacy: "Snapshot 仅在当前浏览器本地解析，不随 URL 或产品事件发送。无需 Token、Cookie、代码或 Memory。Session Verification 不会成为公开 Runtime Evidence。",
  },
  en: {
    entry: "How to capture a Snapshot", prompt: "No Snapshot yet? Expand to learn where these values come from.",
    introduction: "Open Screeps World/MMO and confirm the current shard, room, and object. Read only the facts below from the in-game Console or current object information; do not issue actions or change Memory; names and object IDs are only for locating objects in your game. Leave them out of the Snapshot.",
    freshness: "Use observations from the same tick where possible. Capture again when the state changes; do not combine stale readings. Check the name, ID, and shard if lookup fails. Stop rather than guessing if visibility itself is unknown.",
    unknown: "Unknown does not mean false or zero. Only specified fields allow null. Capture again if required facts for a visible object are unavailable; do not hide uncertainty with null.",
    format: "Use JSON double quotes, no comments, trailing commas, undefined, or extra fields. Keep every required field.",
    mistakes: "Common mistakes", verification: "Verify after diagnosis", exampleTitle: "Valid example (demonstration data)",
    example: "Demonstration data: not your game state.", editedExample: "Edited example: confirm every value against your observations.",
    boundary: "Passing validation or removing a blocker does not prove an action succeeded. Follow Fix / Verify and capture again. Continue in Resolver with an existing real call's result and subsequent tick state when needed; do not issue another action just to verify.",
    privacy: "The Snapshot is parsed locally in this browser and is not sent in URLs or product events. No Token, Cookie, code, or Memory is required. Session Verification never becomes public Runtime Evidence.",
  },
} as const;

type CaptureGuidance = {
  steps: LocalizedCopy;
  fields: readonly { path: string; values: string; description: LocalizedCopy }[];
  mistakes: LocalizedCopy;
  verify: LocalizedCopy;
};

const CAPTURE_GUIDANCE: Record<DoctorSymptom, CaptureGuidance> = {
  "spawn-not-working": {
    steps: { zh: "先确认房间，再确认该房间中的目标 Spawn。读取当前能量、ownership 和生产状态。bodyCost 来自本次计划生成的 body；计划未知时填 null。", en: "Confirm the room, then its selected Spawn. Read current energy, ownership, and spawning state. bodyCost belongs to the intended body; use null if that body is unknown." },
    fields: [
      { path: "version", values: "1", description: { zh: "固定为数字 1。", en: "Always the number 1." } },
      { path: "symptom", values: '"spawn-not-working"', description: { zh: "必须匹配所选症状。", en: "Must match the selected symptom." } },
      { path: "room.visible", values: "true / false", description: { zh: "Game.rooms[房间名] 中是否有当前房间对象；先确认名称和 shard。", en: "Whether Game.rooms[roomName] contains the current room object; confirm the name and shard first." } },
      { path: "room.energyAvailable", values: "integer ≥ 0 / null", description: { zh: "读取 room.energyAvailable：当前可用能量，不是 energyCapacityAvailable 或 Storage 能量。房间不可见时必须为 null；可见时必须提供整数。", en: "Read room.energyAvailable: available energy, not energyCapacityAvailable or Storage energy. Use null only when the room is unavailable; a visible room requires an integer." } },
      { path: "spawn.visible", values: "true / false", description: { zh: "当前能否取得目标 Spawn 对象。房间不可见时必须为 false；不要根据旧地图推断。", en: "Whether the selected Spawn object is currently available. Must be false when its room is unavailable; do not infer from an old map." } },
      { path: "spawn.owned", values: "true / false / null", description: { zh: "读取 spawn.my；Spawn 可见时必须为布尔值，不可见时必须为 null。", en: "Read spawn.my. A visible Spawn requires a boolean; an unavailable Spawn requires null." } },
      { path: "spawn.spawning", values: "true / false / null", description: { zh: "spawn.spawning 有生产对象时为 true，空闲时为 false；不可见时为 null。不要复制整个生产对象。", en: "Use true when spawn.spawning contains a spawning object, false when idle, and null when unavailable. Do not paste the object." } },
      { path: "spawn.remainingTime", values: "integer ≥ 1 / null", description: { zh: "生产中读取 spawn.spawning.remainingTime，必须是正整数；空闲或不可见时必须为 null，不能填 0。", en: "While spawning, read spawn.spawning.remainingTime as a positive integer. Use null when idle or unavailable, never zero." } },
      { path: "request.bodyCost", values: "integer ≥ 1 / null", description: { zh: "仅对已知计划 body 按部件成本求和；不是房间容量或已有 Creep 成本。未知时填 null，不要猜测。", en: "Sum part costs only for a known intended body, not room capacity or an existing Creep. Use null when unknown; do not guess." } },
    ],
    mistakes: { zh: "不要把容量当作能量、把 spawning 对象当作布尔值，或把示例的 bodyCost 当作实际值。不可见 Spawn 的 owned、spawning、remainingTime 必须全部为 null。", en: "Do not substitute capacity for energy, paste a spawning object as a boolean, or treat the example bodyCost as real. An unavailable Spawn requires null owned, spawning, and remainingTime." },
    verify: { zh: "busy 时等待本次生产结束后重新采集；能量阻断时实施你选择的修复，再比较新能量与已知 bodyCost。阻断消失仍不等于生成成功。", en: "Capture again once spawning finishes. After your chosen energy fix, compare fresh energy with the known bodyCost. Removing a blocker still does not prove spawning succeeded." },
  },
  "creep-not-moving": {
    steps: { zh: "选择不移动的那个 Creep，读取 my、fatigue 和当前可用 MOVE 数量。不要用角色名称或初始 body 配置推断当前能力。", en: "Select the Creep that is not moving. Read my, fatigue, and its current active MOVE count. Do not infer capability from its role name or original body." },
    fields: [
      { path: "version", values: "1", description: { zh: "固定为数字 1。", en: "Always the number 1." } },
      { path: "symptom", values: '"creep-not-moving"', description: { zh: "必须匹配所选症状。", en: "Must match the selected symptom." } },
      { path: "creep.visible", values: "true / false", description: { zh: "当前能否取得目标 Creep；自己的 Creep 可用 Game.creeps[名称] 定位。查不到时先核对对象和 shard。", en: "Whether the selected Creep is available. Locate your own Creep with Game.creeps[name]; confirm the object and shard if lookup fails." } },
      { path: "creep.owned", values: "true / false / null", description: { zh: "读取 creep.my；可见时必须为布尔值，不可见时为 null。", en: "Read creep.my. Use a boolean when visible, null when unavailable." } },
      { path: "creep.fatigue", values: "integer ≥ 0 / null", description: { zh: "读取 creep.fatigue，不是 CPU 或其他 cooldown。可见时必须提供整数；不可见时为 null。0 必须是实际观察值。", en: "Read creep.fatigue, not CPU or another cooldown. A visible Creep requires an integer; an unavailable Creep requires null. Zero must be observed." } },
      { path: "creep.activeMoveParts", values: "integer ≥ 0 / null", description: { zh: "读取标准 API 的 creep.getActiveBodyparts(MOVE)，完全损坏的 MOVE 不计入。可见时必须提供整数；不可见时为 null。", en: "Read the standard API's creep.getActiveBodyparts(MOVE); fully damaged MOVE parts do not count. Use an integer when visible, null when unavailable." } },
    ],
    mistakes: { zh: "不可见 Creep 的 owned、fatigue、activeMoveParts 必须全部为 null。可见时不能用 null 或猜测的 0 补齐；不要填写字符串数字或原始 MOVE 数量。", en: "An unavailable Creep requires null owned, fatigue, and activeMoveParts. Do not fill visible facts with null or a guessed zero, string numbers, or original MOVE counts." },
    verify: { zh: "fatigue 恢复到 0 后重新采集；没有 MOVE 时，处理能力问题后重新采集。fatigue=0 且有 MOVE 仍不能证明移动成功，需观察后续 tick 的位置变化。", en: "Capture again when fatigue reaches zero or after restoring MOVE capability. Zero fatigue and active MOVE parts do not prove movement; check position on a subsequent tick." },
  },
  "creep-not-harvesting": {
    steps: { zh: "选择采集 Creep 和它实际尝试采集的目标，分别确认可见性。不要替换成另一个目标，也不要根据 Memory 猜测。仅当两个对象都可取得时判断距离。", en: "Select the harvesting Creep and its actual intended target. Confirm each object's availability. Do not substitute another target or guess from saved role state. Determine range only when both objects are available." },
    fields: [
      { path: "version", values: "1", description: { zh: "固定为数字 1。", en: "Always the number 1." } },
      { path: "symptom", values: '"creep-not-harvesting"', description: { zh: "必须匹配所选症状。", en: "Must match the selected symptom." } },
      { path: "creep.visible", values: "true / false", description: { zh: "当前能否取得所选采集 Creep；先确认对象和 shard。", en: "Whether the selected harvesting Creep is available; confirm the object and shard first." } },
      { path: "creep.owned", values: "true / false / null", description: { zh: "读取 creep.my；可见时为实际布尔值，不可见时为 null。", en: "Read creep.my: an observed boolean when visible, null when unavailable." } },
      { path: "creep.activeWorkParts", values: "integer ≥ 0 / null", description: { zh: "读取标准 API 的 creep.getActiveBodyparts(WORK)，完全损坏的 WORK 不计入。可见时必须提供整数；不可见时为 null。", en: "Read the standard API's creep.getActiveBodyparts(WORK); fully damaged WORK parts do not count. Use an integer when visible, null when unavailable." } },
      { path: "target.visible", values: "true / false", description: { zh: "当前能否取得实际采集目标。确认目标后可用 Game.getObjectById 定位；ID 留在游戏内。资源耗尽不等于不可见。", en: "Whether the actual harvest target is available. After confirming it, use Game.getObjectById to locate it; keep the ID in-game. Depleted does not mean invisible." } },
      { path: "target.inRange", values: "true / false / null", description: { zh: "两者都可见时，只读检查 creep.pos.inRangeTo(target.pos, 1)。任一不可见时必须为 null，而不是 false；两者可见时必须为布尔值。", en: "When both are visible, read creep.pos.inRangeTo(target.pos, 1). If either is unavailable, use null, not false. Both visible requires a boolean." } },
    ],
    mistakes: { zh: "不可见 Creep 的 owned、activeWorkParts 为 null。不要猜距离、使用初始 WORK 数量或新增 targetId、returnCode、energy 等字段。", en: "An unavailable Creep requires null owned and activeWorkParts. Do not guess range, use original WORK counts, or add targetId, returnCode, energy, or other fields." },
    verify: { zh: "处理移动或 WORK 能力问题后重新采集。可见、有 WORK 且在距离内仍不足以证明采集成功；继续 Resolver，以已有真实调用结果和后续状态变化复核。", en: "Capture again after resolving movement or WORK capability. Visibility, active WORK, and valid range do not prove harvesting succeeded; continue in Resolver with an existing real call result and subsequent state change." },
  },
};

function nextSnapshotSource(source: SnapshotSource, value: string): SnapshotSource {
  if (!value.trim()) return "manual";
  return source === "manual" ? "manual" : "edited-example";
}

const SNAPSHOT_ERROR_COPY: Record<string, LocalizedCopy> = {
  "Snapshot must be valid JSON.": { zh: "请使用合法 JSON：双引号、无注释、无尾逗号。", en: "Use valid JSON: double quotes, no comments, and no trailing commas." },
  "snapshot must be an object.": { zh: "Snapshot 必须是 JSON 对象，不能是数组或单个值。", en: "The Snapshot must be a JSON object, not an array or single value." },
  "snapshot.version must be 1.": { zh: "version 必须为数字 1，不是字符串。", en: "version must be the number 1, not a string." },
  "Snapshot exceeds 4096 characters.": { zh: "Snapshot 最多 4096 字符；只保留规定字段。", en: "Keep the Snapshot within 4096 characters and include only supported fields." },
  "Hidden rooms must use null energyAvailable.": { zh: "room.visible 为 false 时，room.energyAvailable 必须为 null。", en: "When room.visible is false, room.energyAvailable must be null." },
  "A Spawn cannot be visible when its room is not visible.": { zh: "房间不可见时，spawn.visible 必须为 false。", en: "When the room is unavailable, spawn.visible must be false." },
  "Visible rooms must include energyAvailable.": { zh: "room.visible 为 true 时，必须提供实际 room.energyAvailable 整数。", en: "A visible room requires an observed integer room.energyAvailable." },
  "Non-visible Spawns must use null owned, spawning, and remainingTime values.": { zh: "Spawn 不可见时，owned、spawning、remainingTime 必须全部为 null。", en: "An unavailable Spawn requires null owned, spawning, and remainingTime." },
  "Visible Spawns must include owned and spawning booleans.": { zh: "可见 Spawn 必须提供实际 owned 和 spawning 布尔值。", en: "A visible Spawn requires observed owned and spawning booleans." },
  "A spawning Spawn must include remainingTime.": { zh: "生产中必须提供实际 remainingTime 正整数。", en: "A spawning Spawn requires an observed positive integer remainingTime." },
  "An idle Spawn must use null remainingTime.": { zh: "空闲 Spawn 的 remainingTime 必须为 null，不能为 0。", en: "An idle Spawn requires null remainingTime, not zero." },
  "Non-visible Creeps must use null owned, fatigue, and activeMoveParts values.": { zh: "Creep 不可见时，owned、fatigue、activeMoveParts 必须全部为 null。", en: "An unavailable Creep requires null owned, fatigue, and activeMoveParts." },
  "Visible Creeps must include owned, fatigue, and activeMoveParts values.": { zh: "可见 Creep 必须提供实际 owned、fatigue、activeMoveParts。", en: "A visible Creep requires observed owned, fatigue, and activeMoveParts." },
  "Non-visible Creeps must use null owned and activeWorkParts values.": { zh: "Creep 不可见时，owned 和 activeWorkParts 必须为 null。", en: "An unavailable Creep requires null owned and activeWorkParts." },
  "Visible Creeps must include owned and activeWorkParts values.": { zh: "可见 Creep 必须提供实际 owned 和 activeWorkParts。", en: "A visible Creep requires observed owned and activeWorkParts." },
  "inRange must be null unless both the Creep and harvest target are visible.": { zh: "Creep 或目标不可见时，target.inRange 必须为 null，而不是 false。", en: "If either object is unavailable, target.inRange must be null, not false." },
  "Visible Creep and target snapshots must include inRange.": { zh: "Creep 和目标都可见时，target.inRange 必须为实际布尔值。", en: "When both objects are visible, target.inRange requires an observed boolean." },
};

function getSnapshotErrorHelp(message: string, locale: Locale): string {
  const known = Object.hasOwn(SNAPSHOT_ERROR_COPY, message) ? SNAPSHOT_ERROR_COPY[message] : undefined;
  if (known) return known[locale];
  const fallback = locale === "zh" ? "无法解释此错误。请按当前症状的字段说明重新检查；不要猜测或上传输入。" : "This error could not be classified. Check the current symptom's field guidance; do not guess or upload your input.";
  const fieldPaths = new Set(Object.values(CAPTURE_GUIDANCE).flatMap((guide) => guide.fields.map((field) => `snapshot.${field.path}`)));
  const path = message.slice(0, message.indexOf(" "));
  if (fieldPaths.has(path)) {
    if (message === `${path} is required.`) return locale === "zh" ? `${path} 是必需字段，请补齐。` : `${path} is required; include this field.`;
    if (/^snapshot\.[\w.]+ must be a boolean(?: or null)?\.$/.test(message)) return locale === "zh" ? `${path} 必须为布尔值${message.includes("or null") ? "或允许的 null" : ""}，不能是字符串；具体 null 条件见字段说明。` : `${path} requires a boolean${message.includes("or null") ? " or permitted null" : ""}, not a string. Check the field's null conditions.`;
    if (/^snapshot\.[\w.]+ must be an integer >= [01] or null\.$/.test(message)) return locale === "zh" ? `${path} 必须为整数（至少 ${message.includes(">= 1") ? "1" : "0"}）或允许的 null；不要用 0 代替未知。` : `${path} requires an integer (at least ${message.includes(">= 1") ? "1" : "0"}) or permitted null. Do not substitute zero for unknown.`;
    if (path === "snapshot.symptom" && /^snapshot\.symptom must be (spawn-not-working|creep-not-moving|creep-not-harvesting)\.$/.test(message)) return locale === "zh" ? "symptom 必须匹配当前选择的症状。" : "symptom must match the currently selected symptom.";
  }
  if (/^snapshot\.[\s\S]+ is not allowed\.$/.test(message)) return locale === "zh" ? "存在额外字段。仅保留当前症状规定的字段，不要加入名称、ID 或代码。" : "An extra field was rejected. Keep only this symptom's supported fields; leave out names, IDs, and code.";
  if (/^snapshot\.(room|spawn|request|creep|target) (is required|must be an object)\.$/.test(message)) return locale === "zh" ? `${path} 必须存在且为 JSON 对象。` : `${path} must be present and be a JSON object.`;
  return fallback;
}

const SAMPLE_SNAPSHOTS: Record<DoctorSymptom, string> = {
  "spawn-not-working": JSON.stringify({ version: 1, symptom: "spawn-not-working", room: { visible: true, energyAvailable: 300 }, spawn: { visible: true, owned: true, spawning: false, remainingTime: null }, request: { bodyCost: 350 } }, null, 2),
  "creep-not-moving": JSON.stringify({ version: 1, symptom: "creep-not-moving", creep: { visible: true, owned: true, fatigue: 6, activeMoveParts: 2 } }, null, 2),
  "creep-not-harvesting": JSON.stringify({ version: 1, symptom: "creep-not-harvesting", creep: { visible: true, owned: true, activeWorkParts: 2 }, target: { visible: true, inRange: false } }, null, 2),
};

const SYMPTOM_LABELS: Record<DoctorSymptom, { zh: string; en: string }> = {
  "spawn-not-working": { zh: "Spawn 不工作", en: "Spawn not working" },
  "creep-not-moving": { zh: "Creep 不移动", en: "Creep not moving" },
  "creep-not-harvesting": { zh: "Creep 不采集", en: "Creep not harvesting" },
};

const COPY = {
  zh: {
    eyebrow: "READ-ONLY SNAPSHOT", title: "Screeps Doctor V2",
    intro: "选择一个已支持的症状并粘贴严格的 V1 Snapshot。Doctor 只在浏览器本地解析结构化事实，复用现有 Resolver / Diagnostics / API canonical ID 做确定性判断；不会执行 Screeps 动作、写 Memory 或上传 Snapshot。",
    symptom: "选择症状", label: "Snapshot JSON", placeholder: "粘贴所选症状的 version=1 Snapshot JSON", sample: "载入示例", diagnose: "开始诊断", clear: "清空",
    limit: `最多 ${SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS} 个字符；未知字段会被拒绝。`, error: "Snapshot 未通过严格校验", observed: "Observed facts", diagnosis: "Diagnosis", fix: "Fix", verify: "Verify", classification: "分类", confidence: "置信边界", canonical: "Canonical handoff",
    sessionOnly: "Session Verification 仅用于当前会话复核，不会成为 public Runtime Evidence。", links: "继续使用现有真值入口", resolver: "Problem Resolver", diagnostics: "Diagnostics", api: "Screeps API", tickLab: "Tick Lab",
  },
  en: {
    eyebrow: "READ-ONLY SNAPSHOT", title: "Screeps Doctor V2",
    intro: "Choose a supported symptom and paste a strict V1 Snapshot. Doctor parses structured facts locally in the browser and reuses canonical Resolver / Diagnostics / API IDs for deterministic diagnosis. It does not execute Screeps actions, write Memory, or upload the Snapshot.",
    symptom: "Choose a symptom", label: "Snapshot JSON", placeholder: "Paste a version=1 Snapshot for the selected symptom", sample: "Load example", diagnose: "Diagnose", clear: "Clear",
    limit: `Maximum ${SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS} characters; unknown fields are rejected.`, error: "Snapshot failed strict validation", observed: "Observed facts", diagnosis: "Diagnosis", fix: "Fix", verify: "Verify", classification: "Classification", confidence: "Confidence boundary", canonical: "Canonical handoff",
    sessionOnly: "Session Verification is only for this diagnostic session and never becomes public Runtime Evidence.", links: "Continue with existing truth sources", resolver: "Problem Resolver", diagnostics: "Diagnostics", api: "Screeps API", tickLab: "Tick Lab",
  },
} as const;

const RECOMMENDATIONS: Record<ScreepsDoctorDiagnosis["fix"]["recommendationId"], { zh: string; en: string }> = {
  "restore-room-visibility": { zh: "先恢复或确认房间视野，再重新采集 Snapshot；当前数据不足以判断 Spawn 故障。", en: "Restore or confirm room vision, then capture a new Snapshot; the current facts cannot establish a Spawn failure." },
  "select-visible-spawn": { zh: "确认选择的是当前可见房间中的真实 Spawn，然后重新采集。", en: "Select a real Spawn in the currently visible room, then capture the Snapshot again." },
  "select-owned-spawn": { zh: "改用你拥有的 Spawn；只读 Snapshot 已直接观察到 ownership 阻断。", en: "Use a Spawn you own; the read-only Snapshot directly observed an ownership blocker." },
  "wait-for-current-spawn": { zh: "当前 Spawn 正在生产。等待本次 spawning 完成后重新采集，不要把 busy 误判成 broken。", en: "The Spawn is currently producing. Wait until spawning completes and resnapshot instead of treating busy as broken." },
  "reduce-body-or-refill-energy": { zh: "已知 bodyCost 高于当前可用能量：降低 body 成本或补足房间能量，再重新采集。", en: "The known bodyCost exceeds available room energy. Reduce the body cost or refill energy, then resnapshot." },
  "capture-return-code-in-canonical-resolver": { zh: "只读事实无法证明精确调用失败。进入 canonical Resolver，采集真实 spawnCreep 返回值后再继续；Doctor 本身不会调用 spawnCreep。", en: "Read-only facts cannot prove the exact call failure. Continue in the canonical Resolver and capture the real spawnCreep return value; Doctor itself never calls spawnCreep." },
  "select-visible-creep": { zh: "先确认目标 Creep 当前真实可见，再重新采集 Snapshot；不可见对象不足以证明移动故障。", en: "Confirm the target Creep is currently visible, then capture again; an invisible object cannot establish a movement failure." },
  "select-owned-creep": { zh: "改用你拥有并控制的 Creep；当前 Snapshot 已直接观察到 ownership 阻断。", en: "Use a Creep you own and control; the current Snapshot directly observed an ownership blocker." },
  "restore-active-move-parts-or-replace-creep": { zh: "当前没有可用 MOVE 部件。先恢复可用 MOVE 能力或替换该 Creep，再重新采集；Doctor 不会自动修改 Creep。", en: "There are no active MOVE parts. Restore usable MOVE capability or replace the Creep, then capture again; Doctor does not modify the Creep." },
  "wait-for-fatigue-recovery": { zh: "fatigue 当前大于 0。等待恢复到 0 后重新采集，不要把冷却状态误判成寻路故障。", en: "Fatigue is above zero. Wait for it to recover to zero and resnapshot instead of treating cooldown as a pathfinding failure." },
  "capture-movement-return-code-in-canonical-resolver": { zh: "可见、owned、有 MOVE 且 fatigue=0 仍不能证明精确失败原因。进入 canonical Resolver，保存真实 moveTo/move 返回值后继续。", en: "Visible, owned, active MOVE capability, and zero fatigue still do not prove the exact failure. Continue in the canonical Resolver and capture the real moveTo/move result." },
  "select-visible-harvest-creep": { zh: "先确认待采集的 Creep 当前真实可见，再重新采集 Snapshot；不可见对象不足以判断采集故障。", en: "Confirm the harvesting Creep is currently visible, then capture again; an invisible object cannot establish a harvest failure." },
  "select-owned-harvest-creep": { zh: "改用你拥有并控制的 Creep，再重新采集；Doctor 不会把非 owned 对象当作有效采集执行者。", en: "Use a Creep you own and control, then capture again; Doctor does not treat a non-owned object as a valid harvesting actor." },
  "restore-active-work-parts-or-replace-creep": { zh: "当前没有可用 WORK 部件。修复角色编成或替换该 Creep 后重新采集；Doctor 不会自动修改 Creep。", en: "There are no active WORK parts. Fix the role body or replace the Creep, then capture again; Doctor does not modify the Creep." },
  "select-visible-harvest-target": { zh: "先重新获取一个当前可见的采集目标，再采集 Snapshot；Doctor 不会根据不可见或失效对象猜目标类型。", en: "Reacquire a currently visible harvest target before capturing again; Doctor does not guess target semantics from an invisible or stale object." },
  "move-into-harvest-range": { zh: "只读 Snapshot 已确认目标不在执行距离内。先处理移动并重新采集；如果移动本身失败，转到 Creep movement Resolver，而不是猜采集返回码。", en: "The read-only Snapshot confirms the target is out of action range. Resolve movement and capture again; if movement itself fails, use the Creep movement Resolver instead of guessing a harvest return code." },
  "capture-harvest-return-code-in-canonical-resolver": { zh: "可见、owned、有 WORK、目标可见且已进入距离，仍不足以区分资源不足、无效目标或已接受动作。进入 canonical Resolver，保存真实 harvest 返回值后继续；Doctor 本身不会执行采集动作。", en: "Visible, owned, active WORK capability, a visible target, and valid range still cannot distinguish depleted resource, invalid target, or an accepted action. Continue in the canonical Resolver and capture the real harvest return value; Doctor itself never executes the action." },
};

const VERIFICATION: Record<ScreepsDoctorDiagnosis["verification"]["nextCheckId"], { zh: string; en: string }> = {
  "resnapshot-visible-room": { zh: "房间重新可见后再采集 Snapshot。", en: "Capture a new Snapshot after room vision is restored." },
  "resnapshot-visible-spawn": { zh: "确认 Spawn 可见后重新采集。", en: "Capture again after the Spawn is visible." },
  "resnapshot-owned-spawn": { zh: "切换到 owned Spawn 后重新采集。", en: "Capture again after selecting an owned Spawn." },
  "resnapshot-until-idle": { zh: "等待 Spawn idle 后重新采集。", en: "Capture again once the Spawn becomes idle." },
  "resnapshot-energy-threshold": { zh: "能量达到 bodyCost 阈值后重新采集。", en: "Capture again when available energy reaches the bodyCost threshold." },
  "continue-canonical-resolver": { zh: "继续 canonical Resolver，并以真实返回值复核。", en: "Continue in the canonical Resolver and verify with the real return value." },
  "resnapshot-visible-creep": { zh: "确认 Creep 可见后重新采集。", en: "Capture again after the Creep is visible." },
  "resnapshot-owned-creep": { zh: "切换到 owned Creep 后重新采集。", en: "Capture again after selecting an owned Creep." },
  "resnapshot-active-move-parts": { zh: "确认存在可用 MOVE 部件后重新采集。", en: "Capture again after confirming at least one active MOVE part." },
  "resnapshot-until-fatigue-zero": { zh: "等待 fatigue=0 后重新采集。", en: "Capture again after fatigue reaches zero." },
  "continue-movement-resolver": { zh: "继续 Creep movement Resolver，并以真实 moveTo/move 返回值复核。", en: "Continue in the Creep movement Resolver and verify with the real moveTo/move result." },
  "resnapshot-visible-harvest-creep": { zh: "确认采集 Creep 可见后重新采集。", en: "Capture again after the harvesting Creep is visible." },
  "resnapshot-owned-harvest-creep": { zh: "切换到 owned Creep 后重新采集。", en: "Capture again after selecting an owned Creep." },
  "resnapshot-active-work-parts": { zh: "确认至少存在一个可用 WORK 部件后重新采集。", en: "Capture again after confirming at least one active WORK part." },
  "resnapshot-visible-harvest-target": { zh: "重新获取可见采集目标后再采集。", en: "Capture again after reacquiring a visible harvest target." },
  "resnapshot-harvest-range": { zh: "进入采集距离后重新采集 Snapshot。", en: "Capture again after entering harvest range." },
  "continue-harvest-resolver": { zh: "继续 Creep harvest Resolver，并以真实 harvest 返回值复核。", en: "Continue in the Creep harvest Resolver and verify with the real harvest return value." },
};

export function ScreepsDoctor({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  const captureCopy = CAPTURE_COPY[locale];
  const prefix = locale === "en" ? "/en" : "";
  const [symptom, setSymptom] = useState<DoctorSymptom>("spawn-not-working");
  const [snapshot, setSnapshot] = useState("");
  const [snapshotSource, setSnapshotSource] = useState<SnapshotSource>("manual");
  const [diagnosis, setDiagnosis] = useState<ScreepsDoctorDiagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const requestedSymptom = parseScreepsDoctorLaunchSymptom(new URLSearchParams(window.location.search).get("doctor"));
    if (!requestedSymptom) return;

    const frameId = window.requestAnimationFrame(() => {
      setSymptom(requestedSymptom);
      setSnapshot("");
      setSnapshotSource("manual");
      setDiagnosis(null);
      setError(null);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  function selectSymptom(nextSymptom: DoctorSymptom) {
    trackScreepsDoctorEvent({
      eventName: "doctor_vertical_selected",
      symptom: nextSymptom,
      locale,
      source: "doctor_ui",
    });
    setSymptom(nextSymptom);
    setSnapshot("");
    setSnapshotSource("manual");
    setDiagnosis(null);
    setError(null);
  }

  function runDiagnosis() {
    try {
      let result: ScreepsDoctorDiagnosis;
      if (symptom === "spawn-not-working") result = diagnoseSpawnDoctor(snapshot);
      else if (symptom === "creep-not-moving") result = diagnoseCreepMovementDoctor(snapshot);
      else result = diagnoseCreepHarvestDoctor(snapshot);
      setDiagnosis(result);
      setError(null);
      trackScreepsDoctorEvent({
        eventName: "doctor_diagnosis_completed",
        symptom: result.symptom,
        locale,
        source: "doctor_ui",
        diagnosisId: result.classification,
      });
    } catch (cause) {
      setDiagnosis(null);
      setError(cause instanceof Error ? cause.message : "Invalid Snapshot.");
    }
  }

  function clear() {
    setSnapshot("");
    setSnapshotSource("manual");
    setDiagnosis(null);
    setError(null);
  }

  function editSnapshot(value: string) {
    setSnapshot(value);
    setSnapshotSource((source) => nextSnapshotSource(source, value));
    setDiagnosis(null);
    setError(null);
  }

  return (
    <section id="screeps-doctor" className={styles.doctor} aria-labelledby="screeps-doctor-title">
      <div className={styles.header}>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="screeps-doctor-title">{copy.title}</h2>
        <p>{copy.intro}</p>
      </div>

      <fieldset className={styles.symptoms}>
        <legend>{copy.symptom}</legend>
        <div>
          {(Object.keys(SYMPTOM_LABELS) as DoctorSymptom[]).map((item) => (
            <button key={item} type="button" className={item === symptom ? styles.activeSymptom : styles.symptomButton} aria-pressed={item === symptom} onClick={() => selectSymptom(item)}>
              {SYMPTOM_LABELS[item][locale]}
            </button>
          ))}
        </div>
      </fieldset>

      <p className={styles.hint}>{captureCopy.prompt}</p>
      <details className={styles.captureHelp}>
        <summary>{captureCopy.entry}</summary>
        <div className={styles.captureBody}>
          <p>{captureCopy.introduction}</p>
          <p>{CAPTURE_GUIDANCE[symptom].steps[locale]}</p>
          <p>{captureCopy.freshness}</p>
          <p>{captureCopy.unknown}</p>
          <p>{captureCopy.format}</p>
          <dl className={styles.captureFields}>
            {CAPTURE_GUIDANCE[symptom].fields.map((field) => (
              <div key={field.path}>
                <dt><code>{field.path}</code> <span>{field.values}</span></dt>
                <dd>{field.description[locale]}</dd>
              </div>
            ))}
          </dl>
          <h3>{captureCopy.mistakes}</h3>
          <p>{CAPTURE_GUIDANCE[symptom].mistakes[locale]}</p>
          <h3>{captureCopy.exampleTitle}</h3>
          <pre><code>{SAMPLE_SNAPSHOTS[symptom]}</code></pre>
          <h3>{captureCopy.verification}</h3>
          <p>{CAPTURE_GUIDANCE[symptom].verify[locale]}</p>
          <p>{captureCopy.boundary}</p>
          <p>{captureCopy.privacy}</p>
        </div>
      </details>

      <label className={styles.label} htmlFor="screeps-doctor-snapshot">{copy.label}</label>
      <textarea id="screeps-doctor-snapshot" className={styles.textarea} value={snapshot} onChange={(event) => editSnapshot(event.target.value)} placeholder={copy.placeholder} spellCheck={false} maxLength={SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS} rows={14} aria-describedby={`screeps-doctor-limit${snapshotSource !== "manual" ? " screeps-doctor-example" : ""}`} />
      <p id="screeps-doctor-limit" className={styles.hint}>{copy.limit}</p>
      {snapshotSource !== "manual" ? <p id="screeps-doctor-example" className={styles.exampleNotice} role="status">{snapshotSource === "example" ? captureCopy.example : captureCopy.editedExample}</p> : null}
      <div className={styles.actions}>
        <button type="button" onClick={runDiagnosis} disabled={!snapshot.trim()}>{copy.diagnose}</button>
        <button type="button" className={styles.secondary} onClick={() => { setSnapshot(SAMPLE_SNAPSHOTS[symptom]); setSnapshotSource("example"); setDiagnosis(null); setError(null); }}>{copy.sample}</button>
        <button type="button" className={styles.secondary} onClick={clear}>{copy.clear}</button>
      </div>

      {error ? <div className={styles.error} role="alert"><strong>{copy.error}</strong><p>{getSnapshotErrorHelp(error, locale)}</p></div> : null}

      {diagnosis ? (
        <div className={styles.result} aria-live="polite">
          {snapshotSource !== "manual" ? <p className={styles.exampleNotice}>{snapshotSource === "example" ? captureCopy.example : captureCopy.editedExample}</p> : null}
          <div className={styles.card}><h3>{copy.observed}</h3><ul>{diagnosis.observations.map((observation) => <li key={observation}><code>{observation}</code></li>)}</ul></div>
          <div className={styles.card}>
            <h3>{copy.diagnosis}</h3>
            <dl>
              <div><dt>{copy.classification}</dt><dd><code>{diagnosis.classification}</code></dd></div>
              <div><dt>{copy.confidence}</dt><dd><code>{diagnosis.confidence}</code></dd></div>
              <div><dt>{copy.canonical}</dt><dd><code>{diagnosis.canonical.resolverFlowId}</code>{diagnosis.canonical.resolverStepId ? <> · <code>{diagnosis.canonical.resolverStepId}</code></> : null}{diagnosis.canonical.resolverOutcomeId ? <> · <code>{diagnosis.canonical.resolverOutcomeId}</code></> : null}<> · <code>{diagnosis.canonical.diagnosticSymptomId}</code></></dd></div>
            </dl>
          </div>
          <div className={styles.card}><h3>{copy.fix}</h3><p>{RECOMMENDATIONS[diagnosis.fix.recommendationId][locale]}</p><code>{diagnosis.fix.recommendationId}</code></div>
          <div className={styles.card}><h3>{copy.verify}</h3><p>{VERIFICATION[diagnosis.verification.nextCheckId][locale]}</p><p className={styles.boundary}><strong>{copy.sessionOnly}</strong></p></div>
          <div className={styles.handoffs}>
            <strong>{copy.links}</strong>
            <div>
              {/* A fresh document clears any previous Resolver flow and step state. */}
              <a
                href={getProblemResolverDeepLink(diagnosis.canonical.resolverFlowId, locale) ?? `${prefix}/resolver`}
                onClick={(event) => {
                  trackScreepsDoctorEvent({
                    eventName: "doctor_resolver_handoff_clicked",
                    symptom: diagnosis.symptom,
                    locale,
                    source: "doctor_result",
                    flowId: diagnosis.canonical.resolverFlowId,
                  });
                  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  const target = new URL(event.currentTarget.href);
                  if (target.pathname === window.location.pathname && target.search === window.location.search) {
                    event.preventDefault();
                    window.location.hash = target.hash;
                    window.location.reload();
                  }
                }}
              >
                {copy.resolver}
              </a>
              <Link href={`${prefix}/diagnostics`}>{copy.diagnostics}</Link>
              <Link href={`${prefix}/screeps-api#${diagnosis.canonical.apiEntryId}`}>{copy.api}</Link>
              {diagnosis.symptom === "spawn-not-working" ? <Link href={`${prefix}/tick-lab`}>{copy.tickLab}</Link> : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
