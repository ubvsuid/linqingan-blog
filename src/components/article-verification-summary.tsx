import { formatDate } from "@/lib/date";

interface ArticleVerificationSummaryProps {
  docsChecked: boolean;
  syntaxChecked: boolean;
  consoleTested: boolean;
  liveTested: boolean;
  checkedAt: string;
  testEnvironment?: string;
  testedAt?: string;
  testResult?: string;
}

function status(value: boolean, done: string, pending: string) {
  return value ? done : pending;
}

export function ArticleVerificationSummary({
  docsChecked,
  syntaxChecked,
  consoleTested,
  liveTested,
  checkedAt,
  testEnvironment,
  testedAt,
  testResult,
}: ArticleVerificationSummaryProps) {
  return (
    <details className="article-verification-summary">
      <summary>
        <span className="eyebrow">VERIFICATION</span>
        <strong>
          文档{status(docsChecked, "已核对", "待核对")} · 语法
          {status(syntaxChecked, "已检查", "待检查")} · Console
          {status(consoleTested, "已测试", "待测试")} · 主循环
          {status(liveTested, "已验证", "待验证")}
        </strong>
        <span className="verification-toggle-label">查看验证详情</span>
      </summary>
      <dl>
        <div><dt>官方文档</dt><dd>{status(docsChecked, "已核对", "待核对")}</dd></div>
        <div><dt>JavaScript 语法</dt><dd>{status(syntaxChecked, "已检查", "待检查")}</dd></div>
        <div><dt>Screeps Console</dt><dd>{status(consoleTested, "已测试", "待测试")}</dd></div>
        <div><dt>真实主循环</dt><dd>{status(liveTested, "已验证", "待验证")}</dd></div>
        <div><dt>最后核对</dt><dd>{formatDate(checkedAt)}</dd></div>
        {testEnvironment ? <div><dt>测试环境</dt><dd>{testEnvironment}</dd></div> : null}
        {testedAt ? <div><dt>测试日期</dt><dd>{formatDate(testedAt)}</dd></div> : null}
        {testResult ? <div className="verification-wide"><dt>测试结果</dt><dd>{testResult}</dd></div> : null}
      </dl>
    </details>
  );
}
