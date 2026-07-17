"use client";

import { useMemo, useState } from "react";

import type { ScreepsErrorCode } from "@/lib/screeps-errors";

export function ErrorCodeExplorer({ codes }: { codes: ScreepsErrorCode[] }) {
  const [query, setQuery] = useState("");

  const filteredCodes = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("zh-CN");
    if (!normalized) return codes;

    return codes.filter((code) =>
      [code.name, String(code.value), code.meaning, code.commonCause, code.fix]
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

      <p className="error-count" aria-live="polite">找到 {filteredCodes.length} 个返回值</p>

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
                <div><dt>常见原因</dt><dd>{code.commonCause}</dd></div>
                <div><dt>处理方法</dt><dd>{code.fix}</dd></div>
              </dl>
              {code.example ? <pre><code>{code.example}</code></pre> : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="error-empty"><strong>没有找到对应错误码</strong><p>可以输入名称、数字或问题描述。</p></div>
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
        .error-list pre { overflow-x: auto; margin: 0; border-top: 1px solid var(--border); padding: 22px 26px; background: var(--background); font-size: 13px; line-height: 1.7; }
        .error-empty { border: 1px dashed var(--border); border-radius: 20px; padding: 46px 24px; text-align: center; }
        .error-empty p { margin: 10px 0 0; color: var(--muted); }
        @media (max-width: 700px) { .error-list header, .error-list dl { grid-template-columns: 1fr; } .error-list dl div + div { border-top: 1px solid var(--border); border-left: 0; } }
      `}</style>
    </div>
  );
}
