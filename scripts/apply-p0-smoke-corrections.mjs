import fs from "node:fs";

const filePath = "scripts/smoke-test.mjs";
let source = fs.readFileSync(filePath, "utf8");

const oldChecks = `  ["/blog/screeps-memory-basics", ["Screeps Memory 是什么", "本文最后测试于 2026 年 7 月"]],
  ["/blog/screeps-creep-withdraw-container-energy", ["Creep.withdraw 怎么用", "资料核对日期：2026-07-18"]],
  ["/blog/screeps-tower-auto-attack-hostiles", ["Tower 怎么自动攻击敌人", "资料核对日期：2026-07-18"]],
  ["/blog/screeps-controller-activate-safe-mode", ["Safe Mode 怎么开启", "资料核对日期：2026-07-18"]],
  ["/blog/screeps-spawn-renew-creep", ["renewCreep() 怎么用", "资料核对日期：2026-07-18"]],
  ["/blog/screeps-dynamic-creep-body-energy", ["离线模拟结果", "Node.js 24 离线模拟", "真实 Screeps Console 与主循环仍待环境验证"]],
  ["/blog/screeps-clean-dead-creep-memory", ["离线模拟结果", "删除 2 个死亡名称", "真实 Screeps Console 与主循环仍待环境验证"]],
  ["/blog/screeps-construction-site-progress", ["离线模拟结果", "超过总量保护", "仍为待环境验证"]],
  ["/blog/screeps-tower-repair-threshold", ["为什么要先检查敌人", "离线模拟结果", "真实 Tower 行为"]],
  ["/blog/screeps-spawn-emergency-recovery", ["离线模拟结果", "Energy 为 200", "多 tick 恢复过程仍待环境验证"]],
  ["/blog/screeps-game-get-object-by-id", ["Game.getObjectById() 怎么配合 Memory 保存目标", "Game.getObjectById API", "null"]],
  ["/blog/screeps-power-spawn-process-power", ["processPower() 怎么处理 Power", "Screeps Console", "待测试"]],`;

const newChecks = `  ["/blog/screeps-memory-basics", ["Screeps Memory 是什么", "离线验证环境", "Screeps Console", "待测试"]],
  ["/blog/screeps-creep-withdraw-container-energy", ["withdraw()", "验证状态", "离线验证环境"]],
  ["/blog/screeps-tower-auto-attack-hostiles", ["Tower 怎么自动攻击敌人", "FIND_HOSTILE_CREEPS", "离线验证环境"]],
  ["/blog/screeps-controller-activate-safe-mode", ["activateSafeMode()", "验证状态", "离线验证环境"]],
  ["/blog/screeps-spawn-renew-creep", ["renewCreep()", "验证状态", "离线验证环境"]],
  ["/blog/screeps-dynamic-creep-body-energy", ["离线模拟结果", "Node.js 24 离线模拟", "Screeps Console", "待测试"]],
  ["/blog/screeps-clean-dead-creep-memory", ["离线模拟结果", "Memory.creeps", "Screeps Console", "待测试"]],
  ["/blog/screeps-construction-site-progress", ["离线模拟结果", "progressTotal", "离线验证环境"]],
  ["/blog/screeps-tower-repair-threshold", ["FIND_HOSTILE_CREEPS", "离线模拟结果", "Tower Energy"]],
  ["/blog/screeps-spawn-emergency-recovery", ["离线模拟结果", "200 Energy", "dryRun"]],
  ["/blog/screeps-game-get-object-by-id", ["Game.getObjectById()", "Memory", "null"]],
  ["/blog/screeps-power-spawn-process-power", ["processPower()", "Screeps Console", "待测试"]],`;

if (source.includes(oldChecks)) {
  source = source.replace(oldChecks, newChecks);
} else if (!source.includes(newChecks)) {
  throw new Error("Unable to replace stale article smoke assertions");
}

const oldPhraseGuard = `  if (body.includes("林清安")) {
    failures.push(\`${"${pathname}"}: 仍然出现旧姓名“林清安”\`);
  }`;
const newPhraseGuard = `  if (body.includes("林清安")) {
    failures.push(\`${"${pathname}"}: 仍然出现旧姓名“林清安”\`);
  }

  if (pathname.startsWith("/blog/") && body.includes("本文最后测试于")) {
    failures.push(\`${"${pathname}"}: 仍然使用可能误导的“本文最后测试于”表述\`);
  }`;

if (source.includes(oldPhraseGuard)) {
  source = source.replace(oldPhraseGuard, newPhraseGuard);
} else if (!source.includes("仍然使用可能误导的“本文最后测试于”表述")) {
  throw new Error("Unable to add the stale verification phrase guard");
}

fs.writeFileSync(filePath, source);
console.log("P0 smoke assertions updated.");
