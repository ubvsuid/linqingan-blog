"use client";

import { SpawnCreepExperiment } from "./spawn-creep-experiment";
import styles from "./tick-lab.module.css";
import { TransferExperiment } from "./transfer-experiment";

type TickLabLanguage = "zh" | "en";

interface TickLabProps {
  language: TickLabLanguage;
}

const copy = {
  zh: {
    eyebrow: "TICK LAB · V1",
    title: "把一行 Screeps 代码拆成一个 Tick",
    intro:
      "用受控的 transfer() 与 spawnCreep() 实验，观察 API 返回值、Intent、检查顺序与模型化 Tick 状态之间的区别。",
    modelBadge: "Deterministic educational model",
    modelTitle: "这是教学实验，不是完整 Screeps Engine 模拟器",
    modelBody:
      "当前包含两个经过约束的实验：Creep.transfer() 与 StructureSpawn.spawnCreep()。每个实验都只开放少量可验证变量，并明确保留未建模边界；结果用于解释已核对的 API / Engine 行为，不代表 Live shard 证据。",
  },
  en: {
    eyebrow: "TICK LAB · V1",
    title: "Break one Screeps call into one Tick",
    intro:
      "Use constrained transfer() and spawnCreep() experiments to inspect API return values, intents, check order, and modeled Tick state transitions.",
    modelBadge: "Deterministic educational model",
    modelTitle: "Educational experiments, not a full Screeps Engine simulator",
    modelBody:
      "The lab currently contains two constrained experiments: Creep.transfer() and StructureSpawn.spawnCreep(). Each exposes only a small set of checked variables and keeps unmodeled boundaries explicit; results explain reviewed API / Engine behavior and are not Live shard evidence.",
  },
} as const;

export function TickLab({ language }: TickLabProps) {
  const text = copy[language];

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p className={styles.intro}>{text.intro}</p>
          <div className={styles.modelNote} role="note">
            <span>{text.modelBadge}</span>
            <div>
              <strong>{text.modelTitle}</strong>
              <p>{text.modelBody}</p>
            </div>
          </div>
        </div>
      </section>

      <TransferExperiment language={language} />
      <SpawnCreepExperiment language={language} />
    </main>
  );
}
