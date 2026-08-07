import Link from "next/link";

import { Container } from "@/components/container";
import { createPageMetadata } from "@/lib/metadata";

import styles from "./verification.module.css";

export const metadata = createPageMetadata({
  title: "文章验证方法",
  description:
    "说明临清安网站如何区分官方文档核对、JavaScript 语法检查、离线模拟、Screeps Console 与真实主循环验证。",
  path: "/verification",
});

const verificationLevels = [
  {
    number: "01",
    title: "官方文档已核对",
    status: "docsChecked",
    description:
      "核对相关对象、方法、常量、参数和返回值是否与 Screeps 官方文档一致。它能确认 API 用法，但不能证明代码已经在某个具体房间运行。",
  },
  {
    number: "02",
    title: "JavaScript 语法已检查",
    status: "syntaxChecked",
    description:
      "把文章中的 JavaScript 代码块交给语法检查器解析，排除括号、字符串、对象字面量和模块导出等基础语法错误。语法通过不等于游戏逻辑一定正确。",
  },
  {
    number: "03",
    title: "离线模拟已通过",
    status: "offlineSimulation",
    description:
      "使用简化的 Screeps Mock 或普通对象模拟多个输入、对象缺失、距离不足、Store 变化和常见返回码。它适合发现分支和状态问题，但不能替代官方服务器环境。",
  },
  {
    number: "04",
    title: "Screeps Console 已验证",
    status: "consoleTested",
    description:
      "在真实 Screeps Console 中执行对应代码，并保存实际返回值或对象状态。它只能证明被执行的片段和当时环境，不能自动代表整篇文章全部代码。",
  },
  {
    number: "05",
    title: "真实主循环已验证",
    status: "liveTested",
    description:
      "把代码放进真实主循环，观察多个 tick 中的行为、状态切换和异常情况。只有获得持续运行证据后，才会把这一项标记为已验证。",
  },
];

const principles = [
  "不把离线模拟写成官方服务器实测。",
  "不把单次 Console 返回值扩大成长期稳定结论。",
  "没有真实日志时明确写成待环境验证。",
  "验证状态按文章和代码片段分别判断，不用一次测试覆盖全部文章。",
];

export default function VerificationPage() {
  return (
    <main className="page-shell verification-page">
      <Container>
        <nav className={styles.breadcrumb} aria-label="面包屑">
          <Link href="/knowledge">知识库</Link>
          <span aria-hidden="true">/</span>
          <span>验证方法</span>
        </nav>

        <header className={`page-header ${styles.header}`}>
          <p className="eyebrow">VERIFICATION</p>
          <h1>文章验证方法</h1>
          <p>
            网站把“资料核对”“语法通过”“模拟可运行”和“真实服务器验证”分开记录，避免把不同强度的证据混在一起。
          </p>
        </header>

        <section className={styles.levels} aria-labelledby="verification-levels-title">
          <div className={styles.sectionHeading}>
            <p className="eyebrow">LEVELS</p>
            <h2 id="verification-levels-title">五种验证状态</h2>
          </div>
          <ol>
            {verificationLevels.map((level) => (
              <li key={level.status}>
                <span>{level.number}</span>
                <div>
                  <p>{level.status}</p>
                  <h3>{level.title}</h3>
                  <p>{level.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.principles} aria-labelledby="verification-principles-title">
          <div className={styles.sectionHeading}>
            <p className="eyebrow">BOUNDARIES</p>
            <h2 id="verification-principles-title">验证边界</h2>
          </div>
          <ul>
            {principles.map((principle) => (
              <li key={principle}>{principle}</li>
            ))}
          </ul>
        </section>

        <section className={styles.next} aria-labelledby="verification-next-title">
          <div>
            <p className="eyebrow">CONTINUE</p>
            <h2 id="verification-next-title">继续查看</h2>
            <p>
              阅读文章时，可以把验证状态、测试环境和正文中的限制说明放在一起判断；也可以直接查看已经获得 Console 或真实主循环证据的内容。
            </p>
          </div>
          <div>
            <Link href="/verified">查看最近验证 →</Link>
            <Link href="/beginner">进入新手路线 →</Link>
            <Link href="/knowledge">浏览知识模块 →</Link>
            <Link href="/tools/creep-body-calculator">使用已验证工具 →</Link>
          </div>
        </section>
      </Container>
    </main>
  );
}
