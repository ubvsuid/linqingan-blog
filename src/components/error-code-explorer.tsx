"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { ScreepsErrorCode } from "@/lib/screeps-errors";

export function ErrorCodeExplorer({ codes }: { codes: ScreepsErrorCode[] }) {
  const [query, setQuery] = useState("");

  const filteredCodes = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("zh-CN");
    if (!normalized) return codes;

    return codes.filter((code) =>
      [
        code.name,
        String(code.value),
        code.meaning,
        code.commonCause,
        code.fix,
        ...(code.operations ?? []),
        ...(code.checks ?? []),
      ]
        .join(" ")
        .toLocaleLowerCase("zh-CN")
        .includes(normalized),
    );
  }, [codes, query]);

  return (
    <div className="error-explorer">
      <label className="error-search">
        <span>搜索错误码</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="输入 -9、ERR_NOT_IN_RANGE、能量不足……"
        />
      </label>

      <p className="error-count" aria-live="polite">
        找到 {filteredCodes.length} 个返回值
      </p>

      {filteredCodes.length > 0 ? (
        <div className="error-list">
          {filteredCodes.map((code) => (
            <article key={code.name} id={code.name.toLowerCase()}>
              <header>
                <div>
                  <span>返回值 {code.value}</span>
                  <h2>{code.name}</h2>
                </div>
                <p>{code.meaning}</p>
              </header>

              <dl>
                <div>
                  <dt>常见原因</dt>
                  <dd>{code.commonCause}</dd>
                </div>
                <div>
                  <dt>处理方法</dt>
                  <dd>{code.fix}</dd>
                </div>
              </dl>

              {code.operations && code.operations.length > 0 ? (
                <section className="error-detail-section" aria-label="常见返回场景">
                  <h3>常见返回场景</h3>
                  <div className="error-operation-list">
                    {code.operations.map((operation) => (
                      <code key={operation}>{operation}</code>
                    ))}
                  </div>
                </section>
              ) : null}

              {code.checks && code.checks.length > 0 ? (
                <section className="error-detail-section" aria-label="排查顺序">
                  <h3>建议排查顺序</h3>
                  <ol>
                    {code.checks.map((check) => (
                      <li key={check}>{check}</li>
                    ))}
                  </ol>
                </section>
              ) : null}

              {code.wrongExample || code.example ? (
                <section className="error-code-comparison" aria-label="代码示例">
                  {code.wrongExample ? (
                    <div>
                      <h3>未处理返回值</h3>
                      <pre>
                        <code>{code.wrongExample}</code>
                      </pre>
                    </div>
                  ) : null}
                  {code.example ? (
                    <div>
                      <h3>推荐处理方式</h3>
                      <pre>
                        <code>{code.example}</code>
                      </pre>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {code.related && code.related.length > 0 ? (
                <nav className="error-related-links" aria-label="相关内容">
                  <span>相关内容</span>
                  <div>
                    {code.related.map((item) => (
                      <Link key={item.href} href={item.href}>
                        {item.label} →
                      </Link>
                    ))}
                  </div>
                </nav>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="error-empty">
          <strong>没有找到对应错误码</strong>
          <p>可以输入名称、数字或问题描述。</p>
        </div>
      )}

      <style>{`
        .error-explorer { display: grid; gap: 24px; }
        .error-search { display: grid; gap: 8px; border: 1px solid var(--border); border-radius: 20px; padding: 22px; background: var(--surface); color: var(--muted); font-size: 13px; }
        .error-search input { min-height: 52px; border: 1px solid var(--border); border-radius: 14px; padding: 0 16px; background: var(--background); color: var(--foreground); font: inherit; outline: none; }
        .error-search input:focus { border-color: var(--foreground); box-shadow: 0 0 0 3px color-mix(in srgb, var(--foreground) 10%, transparent); }
        .error-count { margin: 0; color: var(--muted); font-size: 13px; }
        .error-list { display: grid; gap: 18px; }
        .error-list article { scroll-margin-top: 120px; overflow: hidden; border: 1px solid var(--border); border-radius: 20px; background: var(--surface); }
        .error-list header { display: grid; grid-template-columns: minmax(240px, .65fr) minmax(0, 1fr); gap: 32px; align-items: end; padding: 26px; border-bottom: 1px solid var(--border); }
        .error-list header span { color: var(--muted); font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: 12px; }
        .error-list h2 { margin: 8px 0 0; font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: clamp(22px, 3vw, 32px); }
        .error-list header p { margin: 0; color: var(--muted); line-height: 1.7; }
        .error-list dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0; }
        .error-list dl div { padding: 24px 26px; }
        .error-list dl div + div { border-left: 1px solid var(--border); }
        .error-list dt { color: var(--muted); font-size: 12px; }
        .error-list dd { margin: 10px 0 0; line-height: 1.7; }
        .error-detail-section { border-top: 1px solid var(--border); padding: 24px 26px; }
        .error-detail-section h3, .error-code-comparison h3 { margin: 0; font-size: 15px; }
        .error-operation-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        .error-operation-list code { border: 1px solid var(--border); border-radius: 999px; padding: 6px 11px; background: var(--background); font-size: 12px; }
        .error-detail-section ol { display: grid; gap: 10px; margin: 16px 0 0; padding-left: 22px; color: var(--muted); line-height: 1.7; }
        .error-code-comparison { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-top: 1px solid var(--border); }
        .error-code-comparison > div { min-width: 0; padding: 24px 26px; }
        .error-code-comparison > div + div { border-left: 1px solid var(--border); }
        .error-code-comparison pre, .error-list > article > pre { overflow-x: auto; margin: 14px 0 0; border: 1px solid var(--border); border-radius: 12px; padding: 16px; background: var(--background); font-size: 12px; line-height: 1.65; }
        .error-list > article > pre { margin: 0; border: 0; border-top: 1px solid var(--border); border-radius: 0; padding: 22px 26px; }
        .error-related-links { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 20px; border-top: 1px solid var(--border); padding: 22px 26px; }
        .error-related-links > span { color: var(--muted); font-size: 12px; }
        .error-related-links > div { display: flex; flex-wrap: wrap; gap: 10px 20px; font-weight: 650; }
        .error-empty { border: 1px dashed var(--border); border-radius: 20px; padding: 46px 24px; text-align: center; }
        .error-empty p { margin: 10px 0 0; color: var(--muted); }
        @media (max-width: 700px) {
          .error-list header, .error-list dl, .error-code-comparison { grid-template-columns: 1fr; }
          .error-list dl div + div, .error-code-comparison > div + div { border-top: 1px solid var(--border); border-left: 0; }
          .error-related-links { grid-template-columns: 1fr; gap: 10px; }
        }
      `}</style>
    </div>
  );
}
