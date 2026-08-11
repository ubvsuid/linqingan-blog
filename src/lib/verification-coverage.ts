import type { ScreepsDiagnosticLocale } from "@/lib/screeps-diagnostic-symptoms";

export type VerificationCoveragePriority = "P0" | "P1";
export type VerificationCoverageTargetLevel = "console" | "live-multitick";

export interface VerificationCoveragePlan {
  symptomId: string;
  priority: VerificationCoveragePriority;
  targetLevel: VerificationCoverageTargetLevel;
  primaryErrorNames: readonly string[];
  primaryApiEntryIds: readonly string[];
  zhGoal: string;
  enGoal: string;
  zhNextEvidence: string;
  enNextEvidence: string;
}

export const verificationCoveragePlans: readonly VerificationCoveragePlan[] = [
  {
    symptomId: "creep-not-moving",
    priority: "P0",
    targetLevel: "live-multitick",
    primaryErrorNames: ["ERR_NO_PATH", "ERR_TIRED", "ERR_NOT_IN_RANGE"],
    primaryApiEntryIds: ["creep-move-to", "pathfinder-search"],
    zhGoal: "覆盖 moveTo()、fatigue、无路径与距离分支，并证明后续 tick 的位置或状态变化。",
    enGoal: "Cover moveTo(), fatigue, no-path, and range branches, then verify later-tick position or state changes.",
    zhNextEvidence: "优先捕获真实 moveTo() 返回值、creep.fatigue、起止位置和至少一个后续 tick。",
    enNextEvidence: "Capture the real moveTo() result, creep.fatigue, start/end positions, and at least one later tick.",
  },
  {
    symptomId: "creep-not-harvesting",
    priority: "P1",
    targetLevel: "live-multitick",
    primaryErrorNames: ["ERR_NOT_IN_RANGE", "ERR_INVALID_TARGET", "ERR_NOT_ENOUGH_RESOURCES"],
    primaryApiEntryIds: ["creep-harvest"],
    zhGoal: "覆盖 harvest() 的目标、距离、WORK 部件与资源变化，并验证实际 Store 或 Source 状态。",
    enGoal: "Cover harvest() target, range, WORK-part, and resource branches, then verify Store or Source state changes.",
    zhNextEvidence: "记录 harvest() 返回值、目标类型、WORK 部件、资源量，以及后续 tick 的 Store/Source 变化。",
    enNextEvidence: "Record the harvest() result, target type, WORK parts, resource amount, and later-tick Store/Source changes.",
  },
  {
    symptomId: "spawn-not-spawning",
    priority: "P0",
    targetLevel: "console",
    primaryErrorNames: ["ERR_BUSY", "ERR_NOT_ENOUGH_RESOURCES", "ERR_INVALID_ARGS", "ERR_NAME_EXISTS", "ERR_RCL_NOT_ENOUGH"],
    primaryApiEntryIds: ["spawn-spawn-creep"],
    zhGoal: "先把 spawnCreep() 的高频返回码、dryRun 与真实调用边界做成可复现 Console 证据。",
    enGoal: "First make the high-frequency spawnCreep() return-code, dryRun, and real-call boundaries reproducible in Console evidence.",
    zhNextEvidence: "优先验证 ERR_NOT_ENOUGH_RESOURCES、ERR_NAME_EXISTS、ERR_BUSY 与一次 OK 路径，不扩大成整套 Spawn 队列长期结论。",
    enNextEvidence: "Prioritize ERR_NOT_ENOUGH_RESOURCES, ERR_NAME_EXISTS, ERR_BUSY, and one OK path without generalizing to long-term queue behavior.",
  },
  {
    symptomId: "controller-downgrade",
    priority: "P0",
    targetLevel: "live-multitick",
    primaryErrorNames: ["ERR_NOT_IN_RANGE", "ERR_NOT_ENOUGH_RESOURCES", "ERR_INVALID_TARGET"],
    primaryApiEntryIds: ["creep-upgrade-controller", "link-transfer-energy"],
    zhGoal: "把 Controller、Upgrader、供能 Link/运输与 ticksToDowngrade 放到同一条多 tick 证据链。",
    enGoal: "Put the Controller, Upgrader, Link/hauling supply, and ticksToDowngrade into one multi-tick evidence chain.",
    zhNextEvidence: "记录 upgradeController() 返回值、Upgrader Energy、Controller 进度、ticksToDowngrade 与供能侧状态的连续变化。",
    enNextEvidence: "Record upgradeController() results, Upgrader Energy, Controller progress, ticksToDowngrade, and supply-side state across ticks.",
  },
  {
    symptomId: "link-not-transferring",
    priority: "P0",
    targetLevel: "live-multitick",
    primaryErrorNames: ["ERR_TIRED", "ERR_NOT_ENOUGH_RESOURCES", "ERR_FULL", "ERR_INVALID_TARGET"],
    primaryApiEntryIds: ["link-transfer-energy"],
    zhGoal: "覆盖 cooldown、发送方库存、接收方容量与真实 transferEnergy() 返回值，并验证下一 tick 两端 Store。",
    enGoal: "Cover cooldown, sender stock, receiver capacity, and the real transferEnergy() result, then verify both Stores on the next tick.",
    zhNextEvidence: "优先采集发送 Link/目标 Link 的 Store、cooldown、返回码和下一 tick 状态，避免只靠截图判断。",
    enNextEvidence: "Capture sender/receiver Stores, cooldown, return code, and next-tick state instead of relying on a single screenshot.",
  },
  {
    symptomId: "market-action-failed",
    priority: "P1",
    targetLevel: "console",
    primaryErrorNames: ["ERR_NOT_ENOUGH_RESOURCES", "ERR_INVALID_ARGS"],
    primaryApiEntryIds: ["market-deal", "market-create-order", "terminal-send"],
    zhGoal: "先用受控 Console 场景确认参数、Credits、Terminal 与交易 Energy 成本边界，不把一次交易扩成市场策略结论。",
    enGoal: "Use controlled Console cases to confirm argument, Credits, Terminal, and transaction-Energy boundaries without generalizing one trade into a market strategy claim.",
    zhNextEvidence: "优先采用低风险、可撤销或只读检查；需要真实交易时只验证明确的最小场景并记录限制。",
    enNextEvidence: "Prefer low-risk, reversible, or read-only checks; when a real transaction is required, verify only the smallest explicit case and record limitations.",
  },
  {
    symptomId: "cpu-too-high",
    priority: "P0",
    targetLevel: "live-multitick",
    primaryErrorNames: [],
    primaryApiEntryIds: ["game-cpu-get-used", "pathfinder-search"],
    zhGoal: "用多 tick CPU/bucket 与热点测量证明性能问题和改动效果，而不是用单 tick 总量下结论。",
    enGoal: "Use multi-tick CPU/bucket and hotspot measurements to prove the performance problem and the effect of changes instead of concluding from one tick.",
    zhNextEvidence: "记录 Game.cpu.getUsed() 分段数据、bucket、工作规模与改动前后多个 tick 的对比。",
    enNextEvidence: "Record Game.cpu.getUsed() section measurements, bucket, workload size, and before/after comparisons across multiple ticks.",
  },
  {
    symptomId: "resources-not-moving",
    priority: "P1",
    targetLevel: "live-multitick",
    primaryErrorNames: ["ERR_NOT_ENOUGH_RESOURCES", "ERR_FULL", "ERR_NOT_IN_RANGE", "ERR_NO_PATH", "ERR_TIRED"],
    primaryApiEntryIds: ["creep-withdraw", "creep-transfer", "creep-move-to"],
    zhGoal: "把 withdraw/pickup、移动、transfer 与源/载体/目标 Store 串成完整多 tick 物流证据链。",
    enGoal: "Connect withdraw/pickup, movement, transfer, and source/carrier/destination Stores into one complete multi-tick logistics evidence chain.",
    zhNextEvidence: "分别保存每个动作返回值，并连续记录 source、Creep、destination Store，定位物流链真正断在哪一步。",
    enNextEvidence: "Store each action result separately and track source, Creep, and destination Stores across ticks to locate the broken logistics stage.",
  },
] as const;

export function getVerificationCoveragePlan(symptomId: string): VerificationCoveragePlan | undefined {
  return verificationCoveragePlans.find((plan) => plan.symptomId === symptomId);
}

export function localizeVerificationCoveragePlan(
  plan: VerificationCoveragePlan,
  locale: ScreepsDiagnosticLocale,
) {
  return locale === "en"
    ? { goal: plan.enGoal, nextEvidence: plan.enNextEvidence }
    : { goal: plan.zhGoal, nextEvidence: plan.zhNextEvidence };
}
