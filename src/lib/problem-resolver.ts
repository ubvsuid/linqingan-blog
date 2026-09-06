export type ProblemResolverLocale = "zh" | "en";

export interface ProblemResolverOption {
  id: string;
  zhLabel: string;
  enLabel: string;
  nextStepId: string;
}

export interface ProblemResolverQuestionStep {
  kind: "question";
  stepId: string;
  zhPrompt: string;
  enPrompt: string;
  zhHelp?: string;
  enHelp?: string;
  options: readonly ProblemResolverOption[];
}

export interface ProblemResolverOutcomeStep {
  kind: "outcome";
  stepId: string;
  zhTitle: string;
  enTitle: string;
  zhExplanation: string;
  enExplanation: string;
  zhFixes: readonly string[];
  enFixes: readonly string[];
  diagnosticSymptomId: string;
  returnCodeName?: string;
  tickLab?: boolean;
}

export type ProblemResolverStep = ProblemResolverQuestionStep | ProblemResolverOutcomeStep;

export interface ProblemResolverFlow {
  flowId: string;
  symptomId: string;
  zhTitle: string;
  enTitle: string;
  zhSummary: string;
  enSummary: string;
  startStepId: string;
  steps: readonly ProblemResolverStep[];
}

export const problemResolverFlows: readonly ProblemResolverFlow[] = [
  {
    flowId: "spawn-not-working",
    symptomId: "spawn-not-spawning",
    zhTitle: "Spawn 不工作",
    enTitle: "Spawn is not working",
    zhSummary: "先判断 Spawn 是否忙，再用 spawnCreep(..., { dryRun: true }) 的真实返回码进入确定分支。",
    enSummary: "Check whether the Spawn is busy, then use the real spawnCreep(..., { dryRun: true }) return code to choose the branch.",
    startStepId: "spawn-busy",
    steps: [
      {
        kind: "question",
        stepId: "spawn-busy",
        zhPrompt: "spawn.spawning 当前有值吗？",
        enPrompt: "Does spawn.spawning currently have a value?",
        options: [
          { id: "yes", zhLabel: "是，正在生产", enLabel: "Yes, it is spawning", nextStepId: "spawn-out-busy" },
          { id: "no", zhLabel: "否，Spawn 空闲", enLabel: "No, the Spawn is idle", nextStepId: "spawn-dryrun" },
        ],
      },
      {
        kind: "question",
        stepId: "spawn-dryrun",
        zhPrompt: "spawnCreep(..., { dryRun: true }) 返回什么？",
        enPrompt: "What does spawnCreep(..., { dryRun: true }) return?",
        zhHelp: "先 dryRun，不要为了诊断额外创建 Creep。",
        enHelp: "Use dryRun first; do not create an extra Creep just to diagnose the problem.",
        options: [
          { id: "ok", zhLabel: "OK (0)", enLabel: "OK (0)", nextStepId: "spawn-out-ok" },
          { id: "name", zhLabel: "ERR_NAME_EXISTS (-3)", enLabel: "ERR_NAME_EXISTS (-3)", nextStepId: "spawn-out-name" },
          { id: "energy", zhLabel: "ERR_NOT_ENOUGH_RESOURCES (-6)", enLabel: "ERR_NOT_ENOUGH_RESOURCES (-6)", nextStepId: "spawn-out-energy" },
          { id: "args", zhLabel: "ERR_INVALID_ARGS (-10)", enLabel: "ERR_INVALID_ARGS (-10)", nextStepId: "spawn-out-args" },
          { id: "rcl", zhLabel: "ERR_RCL_NOT_ENOUGH (-14)", enLabel: "ERR_RCL_NOT_ENOUGH (-14)", nextStepId: "spawn-out-rcl" },
          { id: "other", zhLabel: "其他 / 还没保存返回值", enLabel: "Other / not captured yet", nextStepId: "spawn-out-capture" },
        ],
      },
      { kind: "outcome", stepId: "spawn-out-busy", zhTitle: "Spawn 正忙", enTitle: "The Spawn is busy", zhExplanation: "当前 Spawn 已有 spawning 状态，新的生产请求应等待现有生产结束。", enExplanation: "The Spawn already has an active spawning state, so a new production request must wait.", zhFixes: ["读取 spawn.spawning.remainingTime。", "不要在同一 Spawn 忙碌时反复提交同一个生产请求。", "需要并行产能时，再评估第二个 Spawn 或队列调度。"], enFixes: ["Read spawn.spawning.remainingTime.", "Do not repeatedly submit the same request while this Spawn is busy.", "If parallel capacity is required, evaluate another Spawn or queue scheduling."], diagnosticSymptomId: "spawn-not-spawning", returnCodeName: "ERR_BUSY", tickLab: true },
      { kind: "outcome", stepId: "spawn-out-ok", zhTitle: "参数可以被接受", enTitle: "The request can be accepted", zhExplanation: "dryRun 返回 OK，说明当前参数和可见状态没有阻止请求。下一步检查正式调用是否真的执行，以及是否被你的调度条件跳过。", enExplanation: "dryRun returned OK, so the current arguments and visible state do not block the request. Next verify that the real call actually runs and is not skipped by your scheduler.", zhFixes: ["保存正式 spawnCreep() 返回值。", "确认生产代码分支在这一 tick 真的被执行。", "下一 tick 检查 spawn.spawning 和 Game.creeps[name]。"], enFixes: ["Capture the real spawnCreep() return value.", "Confirm the production branch actually executes on this tick.", "On the next tick inspect spawn.spawning and Game.creeps[name]."], diagnosticSymptomId: "spawn-not-spawning", tickLab: true },
      { kind: "outcome", stepId: "spawn-out-name", zhTitle: "Creep 名称冲突", enTitle: "Creep name collision", zhExplanation: "ERR_NAME_EXISTS 表示这个名字已经存在。", enExplanation: "ERR_NAME_EXISTS means the requested name is already in use.", zhFixes: ["创建前检查 Game.creeps[name]。", "使用稳定且唯一的命名规则。", "不要靠不断重试同一个名字解决冲突。"], enFixes: ["Check Game.creeps[name] before spawning.", "Use a stable unique naming scheme.", "Do not solve the collision by retrying the same name."], diagnosticSymptomId: "spawn-not-spawning", returnCodeName: "ERR_NAME_EXISTS", tickLab: true },
      { kind: "outcome", stepId: "spawn-out-energy", zhTitle: "当前可用 Energy 不足", enTitle: "Not enough available Energy", zhExplanation: "请求身体成本超过了当前可用 Energy，或当前 API 需要的资源不足。", enExplanation: "The requested body cost exceeds currently available Energy, or the API lacks a required resource.", zhFixes: ["比较 body 成本与 room.energyAvailable。", "必要时缩小 body，或等待 Extension / Spawn 补充 Energy。", "不要只看 energyCapacityAvailable；生产使用的是当前可用 Energy。"], enFixes: ["Compare body cost with room.energyAvailable.", "Use a smaller body or wait for Extensions / Spawn Energy to refill.", "Do not rely on energyCapacityAvailable; spawning uses currently available Energy."], diagnosticSymptomId: "spawn-not-spawning", returnCodeName: "ERR_NOT_ENOUGH_RESOURCES", tickLab: true },
      { kind: "outcome", stepId: "spawn-out-args", zhTitle: "生产参数无效", enTitle: "Invalid spawn arguments", zhExplanation: "ERR_INVALID_ARGS 指向 body、name、directions 或 opts 等输入本身。", enExplanation: "ERR_INVALID_ARGS points to body, name, directions, opts, or another request argument.", zhFixes: ["打印 body、name 和 opts 的真实值。", "确认 body 非空、部件合法且数量不超过限制。", "逐项缩小参数，直到 dryRun 返回不同结果。"], enFixes: ["Print the actual body, name, and opts values.", "Confirm the body is non-empty, parts are valid, and limits are respected.", "Reduce the request to a minimal valid shape until dryRun changes."], diagnosticSymptomId: "spawn-not-spawning", returnCodeName: "ERR_INVALID_ARGS", tickLab: true },
      { kind: "outcome", stepId: "spawn-out-rcl", zhTitle: "RCL / 结构激活条件不足", enTitle: "RCL / structure activation limit", zhExplanation: "ERR_RCL_NOT_ENOUGH 表示当前 Controller 等级或结构激活条件不允许这个操作。", enExplanation: "ERR_RCL_NOT_ENOUGH means the current Controller level or structure activation state does not permit the operation.", zhFixes: ["检查 room.controller.level。", "检查 Spawn 是否处于当前 RCL 的有效结构配额内。", "不要为了验证而主动降级、unclaim 或破坏房间。"], enFixes: ["Check room.controller.level.", "Confirm the Spawn is active within the current RCL structure limits.", "Do not downgrade, unclaim, or damage a room just to reproduce this state."], diagnosticSymptomId: "spawn-not-spawning", returnCodeName: "ERR_RCL_NOT_ENOUGH", tickLab: true },
      { kind: "outcome", stepId: "spawn-out-capture", zhTitle: "先保存真实返回值", enTitle: "Capture the real return value first", zhExplanation: "没有返回码时无法区分参数、Energy、名称、RCL 或调度问题。", enExplanation: "Without the return value you cannot distinguish argument, Energy, name, RCL, or scheduling failures.", zhFixes: ["先运行 dryRun 并记录结果。", "同时记录 spawn.spawning 与 room.energyAvailable。", "拿到真实值后重新进入这个流程。"], enFixes: ["Run dryRun and record its result.", "Record spawn.spawning and room.energyAvailable at the same time.", "Re-enter this flow with the actual result."], diagnosticSymptomId: "spawn-not-spawning", tickLab: true },
    ],
  },
  {
    flowId: "creep-not-moving",
    symptomId: "creep-not-moving",
    zhTitle: "Creep 不移动",
    enTitle: "Creep is not moving",
    zhSummary: "先看 fatigue，再看 moveTo() 的真实返回值，区分冷却、无路径、目标无效和代码未执行。",
    enSummary: "Check fatigue first, then the real moveTo() result to separate fatigue, no-path, invalid-target, and skipped-code cases.",
    startStepId: "move-fatigue",
    steps: [
      { kind: "question", stepId: "move-fatigue", zhPrompt: "creep.fatigue > 0 吗？", enPrompt: "Is creep.fatigue > 0?", options: [{ id: "yes", zhLabel: "是", enLabel: "Yes", nextStepId: "move-out-tired" }, { id: "no", zhLabel: "否", enLabel: "No", nextStepId: "move-result" }] },
      { kind: "question", stepId: "move-result", zhPrompt: "本 tick 的 moveTo() / move() 返回什么？", enPrompt: "What did moveTo() / move() return this tick?", options: [{ id: "ok", zhLabel: "OK (0)", enLabel: "OK (0)", nextStepId: "move-out-ok" }, { id: "path", zhLabel: "ERR_NO_PATH (-2)", enLabel: "ERR_NO_PATH (-2)", nextStepId: "move-out-path" }, { id: "target", zhLabel: "ERR_INVALID_TARGET (-7)", enLabel: "ERR_INVALID_TARGET (-7)", nextStepId: "move-out-target" }, { id: "unknown", zhLabel: "没保存 / 其他", enLabel: "Not captured / other", nextStepId: "move-out-capture" }] },
      { kind: "outcome", stepId: "move-out-tired", zhTitle: "fatigue 阻止移动", enTitle: "Fatigue is blocking movement", zhExplanation: "fatigue 大于 0 时，Creep 需要先恢复。", enExplanation: "A Creep with fatigue above zero must recover before moving.", zhFixes: ["等待下一 tick 并继续读取 fatigue。", "检查 MOVE 与负重比例。", "如果频繁发生，检查道路和身体设计。"], enFixes: ["Wait for later ticks and keep reading fatigue.", "Inspect MOVE-to-weight ratio.", "If this happens often, inspect roads and body design."], diagnosticSymptomId: "creep-not-moving", returnCodeName: "ERR_TIRED" },
      { kind: "outcome", stepId: "move-out-ok", zhTitle: "移动意图已被接受", enTitle: "The movement intent was accepted", zhExplanation: "OK 不保证你这一刻看到坐标立刻改变；还要在后续 tick 核对位置。", enExplanation: "OK means the intent was accepted; verify the actual position on a later tick.", zhFixes: ["下一 tick 对比 creep.pos。", "确认没有后续逻辑覆盖目标。", "如果持续原地，记录连续多 tick 的返回值与位置。"], enFixes: ["Compare creep.pos on the next tick.", "Confirm later logic is not replacing the target.", "If it remains stuck, record return values and positions across multiple ticks."], diagnosticSymptomId: "creep-not-moving" },
      { kind: "outcome", stepId: "move-out-path", zhTitle: "没有找到可用路径", enTitle: "No usable path was found", zhExplanation: "ERR_NO_PATH 指向地形、出口、range、CostMatrix 或 roomCallback 约束。", enExplanation: "ERR_NO_PATH points to terrain, exits, range, CostMatrix data, or roomCallback constraints.", zhFixes: ["确认目标位置和期望 range。", "检查墙、出口和 CostMatrix。", "如果用了 roomCallback，确认没有错误拒绝房间。"], enFixes: ["Confirm target position and desired range.", "Inspect walls, exits, and CostMatrix data.", "If using roomCallback, confirm it does not reject required rooms."], diagnosticSymptomId: "creep-not-moving", returnCodeName: "ERR_NO_PATH" },
      { kind: "outcome", stepId: "move-out-target", zhTitle: "目标无效", enTitle: "The target is invalid", zhExplanation: "ERR_INVALID_TARGET 表示传入的目标不能用于当前移动请求。", enExplanation: "ERR_INVALID_TARGET means the supplied target cannot be used for this movement request.", zhFixes: ["打印目标对象。", "检查缓存 ID 是否已经失效。", "确认传入 RoomPosition 或有效目标对象。"], enFixes: ["Print the target object.", "Check whether a cached ID has become stale.", "Pass a valid RoomPosition or target object."], diagnosticSymptomId: "creep-not-moving", returnCodeName: "ERR_INVALID_TARGET" },
      { kind: "outcome", stepId: "move-out-capture", zhTitle: "先保存移动返回值", enTitle: "Capture the movement result", zhExplanation: "只看 Creep 没动无法区分路径、fatigue、目标和代码分支。", enExplanation: "A stationary Creep alone does not distinguish path, fatigue, target, or control-flow problems.", zhFixes: ["把 moveTo() 结果保存到变量并输出。", "同时记录 creep.fatigue 和目标位置。", "拿到值后重跑判断。"], enFixes: ["Store and print the moveTo() result.", "Record creep.fatigue and target position too.", "Run the resolver again with those values."], diagnosticSymptomId: "creep-not-moving" },
    ],
  },
  {
    flowId: "creep-not-harvesting",
    symptomId: "creep-not-harvesting",
    zhTitle: "Creep 不采集",
    enTitle: "Creep is not harvesting",
    zhSummary: "用 harvest() 返回值区分距离、目标、资源与 WORK 部件问题。",
    enSummary: "Use the harvest() return value to separate range, target, resource, and WORK-part problems.",
    startStepId: "harvest-result",
    steps: [
      { kind: "question", stepId: "harvest-result", zhPrompt: "creep.harvest(target) 返回什么？", enPrompt: "What does creep.harvest(target) return?", options: [{ id: "ok", zhLabel: "OK (0)", enLabel: "OK (0)", nextStepId: "harvest-out-ok" }, { id: "range", zhLabel: "ERR_NOT_IN_RANGE (-9)", enLabel: "ERR_NOT_IN_RANGE (-9)", nextStepId: "harvest-out-range" }, { id: "empty", zhLabel: "ERR_NOT_ENOUGH_RESOURCES (-6)", enLabel: "ERR_NOT_ENOUGH_RESOURCES (-6)", nextStepId: "harvest-out-empty" }, { id: "target", zhLabel: "ERR_INVALID_TARGET (-7)", enLabel: "ERR_INVALID_TARGET (-7)", nextStepId: "harvest-out-target" }, { id: "body", zhLabel: "ERR_NO_BODYPART (-12)", enLabel: "ERR_NO_BODYPART (-12)", nextStepId: "harvest-out-body" }, { id: "other", zhLabel: "没保存 / 其他", enLabel: "Not captured / other", nextStepId: "harvest-out-capture" }] },
      { kind: "outcome", stepId: "harvest-out-ok", zhTitle: "采集动作已接受", enTitle: "The harvest action was accepted", zhExplanation: "OK 后应在后续 tick 看 Creep Store 或目标资源变化。", enExplanation: "After OK, verify the Creep Store or target resource on a later tick.", zhFixes: ["下一 tick 检查 creep.store。", "检查后续角色逻辑是否立刻切换状态。", "如果资源进入后又消失，继续查 transfer / drop 等后续动作。"], enFixes: ["Inspect creep.store on the next tick.", "Check whether role logic immediately changes state.", "If resource appears then disappears, inspect later transfer / drop actions."], diagnosticSymptomId: "creep-not-harvesting" },
      { kind: "outcome", stepId: "harvest-out-range", zhTitle: "距离不足", enTitle: "The target is out of range", zhExplanation: "harvest() 需要 Creep 在目标可执行范围内。", enExplanation: "harvest() requires the Creep to be within action range.", zhFixes: ["只有收到 ERR_NOT_IN_RANGE 时再 moveTo(target)。", "下一 tick 重新调用 harvest()。", "记录 moveTo() 的返回值，避免把移动失败误判成采集失败。"], enFixes: ["Call moveTo(target) when harvest returns ERR_NOT_IN_RANGE.", "Retry harvest() on the next tick.", "Capture moveTo() too so movement failure is not mistaken for harvest failure."], diagnosticSymptomId: "creep-not-harvesting", returnCodeName: "ERR_NOT_IN_RANGE" },
      { kind: "outcome", stepId: "harvest-out-empty", zhTitle: "目标资源不足", enTitle: "The target lacks harvestable resource", zhExplanation: "目标当前没有足够资源可供这次动作。", enExplanation: "The target currently lacks enough harvestable resource for this action.", zhFixes: ["读取 Source.energy / Mineral.mineralAmount 等真实状态。", "等待资源恢复或切换目标。", "不要把空 Source 当作路径或角色状态 Bug。"], enFixes: ["Read Source.energy / Mineral.mineralAmount or the relevant state.", "Wait for regeneration or switch targets.", "Do not treat an empty Source as a path or role-state bug."], diagnosticSymptomId: "creep-not-harvesting", returnCodeName: "ERR_NOT_ENOUGH_RESOURCES" },
      { kind: "outcome", stepId: "harvest-out-target", zhTitle: "采集目标无效", enTitle: "Invalid harvest target", zhExplanation: "目标类型不适用于 harvest()，或缓存对象已经失效。", enExplanation: "The object is not harvestable by harvest(), or a cached target is stale.", zhFixes: ["打印目标对象和 id。", "确认目标是当前 API 支持的资源对象。", "失效后重新 find / getObjectById。"], enFixes: ["Print the target object and id.", "Confirm the target type is supported by harvest().", "Reacquire stale targets with find / getObjectById."], diagnosticSymptomId: "creep-not-harvesting", returnCodeName: "ERR_INVALID_TARGET" },
      { kind: "outcome", stepId: "harvest-out-body", zhTitle: "没有有效 WORK 部件", enTitle: "No active WORK part", zhExplanation: "Creep 缺少执行 harvest() 所需的有效 WORK。", enExplanation: "The Creep lacks an active WORK part required by harvest().", zhFixes: ["检查 creep.getActiveBodyparts(WORK)。", "检查身体是否从一开始就没有 WORK，或 WORK 已被摧毁。", "调整下一只 Creep 的 body。"], enFixes: ["Check creep.getActiveBodyparts(WORK).", "Determine whether WORK was never present or has been destroyed.", "Adjust the next Creep body."], diagnosticSymptomId: "creep-not-harvesting", returnCodeName: "ERR_NO_BODYPART" },
      { kind: "outcome", stepId: "harvest-out-capture", zhTitle: "先保存 harvest() 返回值", enTitle: "Capture harvest() first", zhExplanation: "没有返回值就无法可靠区分距离、目标、资源和身体部件。", enExplanation: "Without the return value you cannot reliably distinguish range, target, resource, and body-part failures.", zhFixes: ["保存 creep.harvest(target) 返回值。", "同时记录 target 和 active WORK。", "拿到值后重新进入流程。"], enFixes: ["Capture creep.harvest(target).", "Record target and active WORK count too.", "Re-enter the flow with the actual result."], diagnosticSymptomId: "creep-not-harvesting" },
    ],
  },
  {
    flowId: "creep-not-upgrading",
    symptomId: "controller-downgrade",
    zhTitle: "Creep 不升级 Controller",
    enTitle: "Creep is not upgrading the Controller",
    zhSummary: "先检查 Energy 与距离，再用 upgradeController() 返回值确认目标和身体条件。",
    enSummary: "Check Energy and range first, then use upgradeController() to confirm target and body conditions.",
    startStepId: "upgrade-energy",
    steps: [
      { kind: "question", stepId: "upgrade-energy", zhPrompt: "Creep 当前有 RESOURCE_ENERGY 吗？", enPrompt: "Does the Creep currently have RESOURCE_ENERGY?", options: [{ id: "no", zhLabel: "没有", enLabel: "No", nextStepId: "upgrade-out-energy" }, { id: "yes", zhLabel: "有", enLabel: "Yes", nextStepId: "upgrade-range" }] },
      { kind: "question", stepId: "upgrade-range", zhPrompt: "Creep 到 Controller 的 range <= 3 吗？", enPrompt: "Is the Creep within range 3 of the Controller?", options: [{ id: "no", zhLabel: "否", enLabel: "No", nextStepId: "upgrade-out-range" }, { id: "yes", zhLabel: "是", enLabel: "Yes", nextStepId: "upgrade-result" }] },
      { kind: "question", stepId: "upgrade-result", zhPrompt: "upgradeController(controller) 返回什么？", enPrompt: "What does upgradeController(controller) return?", options: [{ id: "ok", zhLabel: "OK (0)", enLabel: "OK (0)", nextStepId: "upgrade-out-ok" }, { id: "target", zhLabel: "ERR_INVALID_TARGET (-7)", enLabel: "ERR_INVALID_TARGET (-7)", nextStepId: "upgrade-out-target" }, { id: "body", zhLabel: "ERR_NO_BODYPART (-12)", enLabel: "ERR_NO_BODYPART (-12)", nextStepId: "upgrade-out-body" }, { id: "other", zhLabel: "其他 / 没保存", enLabel: "Other / not captured", nextStepId: "upgrade-out-capture" }] },
      { kind: "outcome", stepId: "upgrade-out-energy", zhTitle: "Upgrader 没有 Energy", enTitle: "The Upgrader has no Energy", zhExplanation: "没有 Energy 时无法产生升级进度。", enExplanation: "Without Energy, the Upgrader cannot produce upgrade progress.", zhFixes: ["检查 creep.store.getUsedCapacity(RESOURCE_ENERGY)。", "检查 withdraw / harvest / Link / hauling 的上游供能。", "恢复 Energy 后再测 upgradeController() 返回值。"], enFixes: ["Check creep.store.getUsedCapacity(RESOURCE_ENERGY).", "Inspect upstream withdraw / harvest / Link / hauling supply.", "After restoring Energy, capture upgradeController() again."], diagnosticSymptomId: "controller-downgrade", returnCodeName: "ERR_NOT_ENOUGH_RESOURCES" },
      { kind: "outcome", stepId: "upgrade-out-range", zhTitle: "距离 Controller 太远", enTitle: "The Controller is out of range", zhExplanation: "upgradeController() 的有效范围是 3。", enExplanation: "upgradeController() requires range 3.", zhFixes: ["移动到 Controller range 3 内。", "下一 tick 再调用 upgradeController()。", "同时记录 moveTo() 返回值。"], enFixes: ["Move within range 3 of the Controller.", "Call upgradeController() again on the next tick.", "Capture moveTo() too."], diagnosticSymptomId: "controller-downgrade", returnCodeName: "ERR_NOT_IN_RANGE" },
      { kind: "outcome", stepId: "upgrade-out-ok", zhTitle: "升级动作已被接受", enTitle: "The upgrade action was accepted", zhExplanation: "OK 后需要在后续 tick 看 Controller progress 与 Creep Energy 是否变化。", enExplanation: "After OK, inspect Controller progress and Creep Energy on a later tick.", zhFixes: ["比较 controller.progress。", "确认 Energy 按预期减少。", "如果升级量仍异常，再检查 active WORK 数量和每 tick 调度。"], enFixes: ["Compare controller.progress.", "Confirm Energy decreases as expected.", "If throughput is still wrong, inspect active WORK and per-tick scheduling."], diagnosticSymptomId: "controller-downgrade" },
      { kind: "outcome", stepId: "upgrade-out-target", zhTitle: "Controller 目标无效", enTitle: "Invalid Controller target", zhExplanation: "传入对象不是当前可升级的 Controller，或引用已经失效。", enExplanation: "The supplied object is not a currently valid Controller target, or the reference is stale.", zhFixes: ["打印 controller 对象。", "使用 creep.room.controller 获取当前房间 Controller。", "跨房间缓存 ID 时重新解析对象。"], enFixes: ["Print the controller object.", "Use creep.room.controller for the current room.", "Re-resolve cached IDs across visibility changes."], diagnosticSymptomId: "controller-downgrade", returnCodeName: "ERR_INVALID_TARGET" },
      { kind: "outcome", stepId: "upgrade-out-body", zhTitle: "没有有效 WORK 部件", enTitle: "No active WORK part", zhExplanation: "升级需要有效 WORK 部件。", enExplanation: "Upgrading requires an active WORK part.", zhFixes: ["检查 creep.getActiveBodyparts(WORK)。", "检查战斗损伤是否摧毁 WORK。", "下一代 Upgrader body 保证有效 WORK。"], enFixes: ["Check creep.getActiveBodyparts(WORK).", "Check whether damage destroyed WORK parts.", "Ensure the next Upgrader body includes sufficient WORK."], diagnosticSymptomId: "controller-downgrade", returnCodeName: "ERR_NO_BODYPART" },
      { kind: "outcome", stepId: "upgrade-out-capture", zhTitle: "先保存 upgradeController() 返回值", enTitle: "Capture upgradeController() first", zhExplanation: "返回值是区分目标、身体、距离和资源问题的最短证据。", enExplanation: "The return value is the shortest evidence for separating target, body, range, and resource failures.", zhFixes: ["保存返回值并打印。", "同 tick 保存 Energy、range、active WORK。", "拿到结果后重新进入流程。"], enFixes: ["Store and print the result.", "Capture Energy, range, and active WORK on the same tick.", "Re-enter this flow with those values."], diagnosticSymptomId: "controller-downgrade" },
    ],
  },
  {
    flowId: "cpu-bucket-abnormal",
    symptomId: "cpu-too-high",
    zhTitle: "CPU / Bucket 异常",
    enTitle: "CPU / Bucket looks abnormal",
    zhSummary: "没有单一返回码；先区分 bucket 压力和代码热点，再决定削减、错峰或延后可选任务。",
    enSummary: "There is no single return code; separate bucket pressure from code hotspots before cutting, staggering, or deferring optional work.",
    startStepId: "cpu-bucket-low",
    steps: [
      { kind: "question", stepId: "cpu-bucket-low", zhPrompt: "Game.cpu.bucket 是否持续低于你的安全阈值？", enPrompt: "Is Game.cpu.bucket persistently below your safety threshold?", zhHelp: "不要用单 tick 波动下结论，至少看一段连续 tick。", enHelp: "Do not conclude from one tick; inspect a run of consecutive ticks.", options: [{ id: "yes", zhLabel: "是，持续偏低", enLabel: "Yes, persistently low", nextStepId: "cpu-hotspot" }, { id: "no", zhLabel: "否，bucket 正常", enLabel: "No, bucket is healthy", nextStepId: "cpu-hotspot" }] },
      { kind: "question", stepId: "cpu-hotspot", zhPrompt: "用 Game.cpu.getUsed() 分段测量后，能定位到明显热点吗？", enPrompt: "After segmenting with Game.cpu.getUsed(), can you identify a clear hotspot?", options: [{ id: "yes", zhLabel: "能定位热点", enLabel: "Yes, there is a hotspot", nextStepId: "cpu-out-hotspot" }, { id: "no", zhLabel: "还不能", enLabel: "Not yet", nextStepId: "cpu-out-measure" }] },
      { kind: "outcome", stepId: "cpu-out-hotspot", zhTitle: "先治理已测量的热点", enTitle: "Fix the measured hotspot first", zhExplanation: "你已经有比“CPU 高”更具体的证据，应该针对这个代码段降低调用频率或成本。", enExplanation: "You now have evidence more specific than 'CPU is high'; reduce cost or frequency in that measured section.", zhFixes: ["优先消除每 tick 全量扫描、重复排序和重复寻路。", "把非关键任务按 tick 错峰或降低频率。", "改动后继续用同一测量点对比。"], enFixes: ["Remove per-tick full scans, repeated sorting, and repeated pathfinding first.", "Stagger or reduce the frequency of noncritical work.", "Keep the same measurement points after changes for comparison."], diagnosticSymptomId: "cpu-too-high", tickLab: true },
      { kind: "outcome", stepId: "cpu-out-measure", zhTitle: "先建立 CPU 分段测量", enTitle: "Add segmented CPU measurement first", zhExplanation: "没有热点数据时，直接优化容易把问题转移而不是解决。", enExplanation: "Without hotspot data, optimization can move the problem instead of solving it.", zhFixes: ["在主要 manager / role 前后读取 Game.cpu.getUsed()。", "同时记录 bucket、房间数、Creep 数和任务规模。", "比较连续多 tick，而不是只看一次峰值。"], enFixes: ["Read Game.cpu.getUsed() before and after major managers / roles.", "Record bucket, room count, Creep count, and workload size.", "Compare consecutive ticks rather than one peak."], diagnosticSymptomId: "cpu-too-high", tickLab: true },
    ],
  },
];

export function getProblemResolverFlow(flowId: string): ProblemResolverFlow | undefined {
  return problemResolverFlows.find((flow) => flow.flowId === flowId);
}

export function getProblemResolverStep(flow: ProblemResolverFlow, stepId: string): ProblemResolverStep | undefined {
  return flow.steps.find((step) => step.stepId === stepId);
}
