"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  getProblemResolverStep,
  problemResolverFlows,
  type ProblemResolverLocale,
} from "@/lib/problem-resolver";

import styles from "./problem-resolver.module.css";

export function ProblemResolver({ locale }: { locale: ProblemResolverLocale }) {
  const isEnglish = locale === "en";
  const [flowId, setFlowId] = useState(problemResolverFlows[0].flowId);
  const flow = useMemo(() => problemResolverFlows.find((item) => item.flowId === flowId) ?? problemResolverFlows[0], [flowId]);
  const [stepId, setStepId] = useState(flow.startStepId);
  const [history, setHistory] = useState<string[]>([]);
  const step = getProblemResolverStep(flow, stepId) ?? getProblemResolverStep(flow, flow.startStepId);

  function chooseFlow(nextFlowId: string) {
    const nextFlow = problemResolverFlows.find((item) => item.flowId === nextFlowId) ?? problemResolverFlows[0];
    setFlowId(nextFlow.flowId);
    setStepId(nextFlow.startStepId);
    setHistory([]);
  }

  function chooseNext(nextStepId: string) {
    setHistory((items) => [...items, stepId]);
    setStepId(nextStepId);
  }

  function goBack() {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    setStepId(previous);
  }

  function reset() {
    setStepId(flow.startStepId);
    setHistory([]);
  }

  if (!step) return null;

  const diagnosticHref = `${isEnglish ? "/en/diagnostics" : "/diagnostics"}#${flow.symptomId}`;
  const searchHref = `${isEnglish ? "/en/search" : "/search"}?q=${encodeURIComponent(isEnglish ? flow.enTitle : flow.zhTitle)}`;
  const tickLabHref = isEnglish ? "/en/tick-lab" : "/tick-lab";

  return (
    <section className={styles.shell} aria-labelledby={`problem-resolver-${locale}`}>
      <header className={styles.intro}>
        <div>
          <p className="eyebrow">PROBLEM RESOLVER V1</p>
          <h2 id={`problem-resolver-${locale}`}>{isEnglish ? "Turn symptoms into the next concrete check" : "把现象变成下一步具体检查"}</h2>
          <p>{isEnglish ? "The resolver owns only deterministic questions and branch logic. API, guide, tool, and accepted Runtime Evidence relationships remain owned by the existing Diagnostic Center." : "Resolver 只负责确定性问题与分支逻辑。API、教程、工具与 accepted Runtime Evidence 的关系仍由现有故障诊断中心负责。"}</p>
        </div>
        <span>{problemResolverFlows.length} {isEnglish ? "guided flows" : "条引导流程"}</span>
      </header>

      <nav className={styles.flowTabs} aria-label={isEnglish ? "Problem resolver flows" : "问题解决流程"}>
        {problemResolverFlows.map((item) => (
          <button key={item.flowId} type="button" aria-pressed={item.flowId === flow.flowId} onClick={() => chooseFlow(item.flowId)}>
            {isEnglish ? item.enTitle : item.zhTitle}
          </button>
        ))}
      </nav>

      <article className={styles.panel}>
        <header className={styles.flowHeader}>
          <span>{isEnglish ? "CURRENT PROBLEM" : "当前问题"}</span>
          <h3>{isEnglish ? flow.enTitle : flow.zhTitle}</h3>
          <p>{isEnglish ? flow.enSummary : flow.zhSummary}</p>
        </header>

        {step.kind === "question" ? (
          <div className={styles.question}>
            <p className={styles.stepCount}>{isEnglish ? `Check ${history.length + 1}` : `检查 ${history.length + 1}`}</p>
            <h4>{isEnglish ? step.enPrompt : step.zhPrompt}</h4>
            {(isEnglish ? step.enHelp : step.zhHelp) ? <p className={styles.help}>{isEnglish ? step.enHelp : step.zhHelp}</p> : null}
            <div className={styles.options}>
              {step.options.map((option) => (
                <button key={option.id} type="button" onClick={() => chooseNext(option.nextStepId)}>
                  {isEnglish ? option.enLabel : option.zhLabel}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.outcome} aria-live="polite">
            <p className={styles.resultLabel}>{isEnglish ? "RESOLVED BRANCH" : "已定位分支"}</p>
            <h4>{isEnglish ? step.enTitle : step.zhTitle}</h4>
            {step.returnCodeName ? <code>{step.returnCodeName}</code> : null}
            <p>{isEnglish ? step.enExplanation : step.zhExplanation}</p>
            <h5>{isEnglish ? "What to do next" : "下一步怎么做"}</h5>
            <ol>{(isEnglish ? step.enFixes : step.zhFixes).map((fix) => <li key={fix}>{fix}</li>)}</ol>
            <div className={styles.actions}>
              <Link href={diagnosticHref}>{isEnglish ? "Open the full diagnostic path" : "打开完整诊断路径"} →</Link>
              <Link href={searchHref}>{isEnglish ? "Search related site knowledge" : "搜索相关站内知识"} →</Link>
              {step.tickLab ? <Link href={tickLabHref}>{isEnglish ? "Try the modeled case in Tick Lab" : "在 Tick Lab 尝试模型场景"} →</Link> : null}
            </div>
          </div>
        )}

        <footer className={styles.controls}>
          <button type="button" onClick={goBack} disabled={history.length === 0}>{isEnglish ? "Back" : "上一步"}</button>
          <button type="button" onClick={reset}>{isEnglish ? "Restart this flow" : "重新开始本流程"}</button>
        </footer>
      </article>
    </section>
  );
}
