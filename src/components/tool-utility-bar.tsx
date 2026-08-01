"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

interface ToolUtilityBarProps {
  title: string;
  issueUrl: string;
}

function subscribeToLocation() {
  return () => {};
}

function getLocationSnapshot() {
  return window.location.href;
}

function getServerLocationSnapshot() {
  return "";
}

export function ToolUtilityBar({ title, issueUrl }: ToolUtilityBarProps) {
  const [status, setStatus] = useState("");
  const currentUrl = useSyncExternalStore(
    subscribeToLocation,
    getLocationSnapshot,
    getServerLocationSnapshot,
  );
  const hydrated = currentUrl.length > 0;

  const issueHref = useMemo(() => {
    const params = new URLSearchParams({
      title: `工具反馈：${title}`,
      body: `工具：${title}\n地址：${currentUrl || "请粘贴当前页面地址"}\n\n问题描述：\n\n期望结果：`,
    });
    return `${issueUrl}?${params.toString()}`;
  }, [currentUrl, issueUrl, title]);

  async function shareCurrentState() {
    if (!hydrated) {
      setStatus("工具仍在初始化，请稍后重试");
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({ title, url: currentUrl });
        setStatus("已打开系统分享面板");
      } else {
        await navigator.clipboard.writeText(currentUrl);
        setStatus("当前配置链接已复制");
      }
    } catch {
      setStatus("未完成分享");
    }
  }

  function resetTool() {
    if (!hydrated) return;
    window.location.assign(window.location.pathname);
  }

  return (
    <section className="tool-utility-bar" aria-label={`${title}快捷操作`}>
      <div className="tool-utility-steps" aria-label="工具使用流程">
        <span><strong>1</strong> 输入</span>
        <span><strong>2</strong> 查看结果</span>
        <span><strong>3</strong> 核对边界</span>
        <span><strong>4</strong> 分享配置</span>
      </div>
      <div className="tool-utility-actions">
        <button type="button" disabled={!hydrated} onClick={shareCurrentState}>分享当前配置</button>
        <button type="button" disabled={!hydrated} onClick={resetTool}>重置工具</button>
        <a href={issueHref} target="_blank" rel="noreferrer">
          报告问题 ↗
        </a>
      </div>
      <p aria-live="polite">{status}</p>
      <style>{`
        .tool-utility-bar {
          display: grid;
          gap: 14px;
          margin: -24px 0 34px;
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 18px 20px;
          background: var(--surface);
        }
        .tool-utility-steps,
        .tool-utility-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 9px;
        }
        .tool-utility-steps { color: var(--muted); font-size: 12px; }
        .tool-utility-steps span { display: inline-flex; align-items: center; gap: 7px; }
        .tool-utility-steps strong {
          display: grid;
          width: 22px;
          height: 22px;
          place-items: center;
          border: 1px solid var(--border);
          border-radius: 999px;
          color: var(--foreground);
          font-size: 10px;
        }
        .tool-utility-actions button,
        .tool-utility-actions a {
          display: inline-flex;
          min-height: 40px;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 0 14px;
          background: var(--background);
          color: var(--foreground);
          font: inherit;
          font-size: 13px;
          font-weight: 680;
          cursor: pointer;
        }
        .tool-utility-actions button:hover,
        .tool-utility-actions a:hover { border-color: var(--muted); text-decoration: none; }
        .tool-utility-actions button:disabled { cursor: not-allowed; opacity: .5; }
        .tool-utility-bar > p { min-height: 20px; margin: 0; color: var(--muted); font-size: 12px; }
      `}</style>
    </section>
  );
}
