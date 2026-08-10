"use client";

import { track } from "@vercel/analytics";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import {
  buildIdentityHeaders,
  getSameOriginReferrerPath,
} from "@/lib/browser-identity";

interface ToolUtilityBarProps {
  title: string;
  issueUrl: string;
}

type ToolEventAction = "view" | "use" | "share" | "reset" | "report";

const knownToolIds = new Set([
  "creep-body-calculator",
  "room-diagnostics",
  "market-terminal-cost-calculator",
  "controller-downgrade-planner",
  "lab-reaction-boost-planner",
  "spawn-queue-replacement-planner",
  "hauling-throughput-planner",
  "tower-damage-heal-repair-calculator",
]);

function subscribeToLocation() {
  return () => {};
}

function getLocationSnapshot() {
  return window.location.href;
}

function getServerLocationSnapshot() {
  return "";
}

function readToolId(currentUrl: string): string | null {
  if (!currentUrl) return null;
  try {
    const pathname = new URL(currentUrl).pathname;
    const segments = pathname.split("/").filter(Boolean);
    const toolsIndex = segments.indexOf("tools");
    const candidate = toolsIndex >= 0 ? segments[toolsIndex + 1] : null;
    return candidate && knownToolIds.has(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export function ToolUtilityBar({ title, issueUrl }: ToolUtilityBarProps) {
  const [status, setStatus] = useState("");
  const currentUrl = useSyncExternalStore(
    subscribeToLocation,
    getLocationSnapshot,
    getServerLocationSnapshot,
  );
  const hydrated = currentUrl.length > 0;
  const toolId = readToolId(currentUrl);

  const issueHref = useMemo(() => {
    const params = new URLSearchParams({
      title: `工具反馈：${title}`,
      body: `工具：${title}\n地址：${currentUrl}\n\n问题描述：\n\n期望结果：`,
    });
    return `${issueUrl}?${params.toString()}`;
  }, [currentUrl, issueUrl, title]);

  function recordToolEvent(action: ToolEventAction) {
    if (!toolId) return;

    track("tool_event", {
      tool: toolId,
      action,
    });

    void fetch("/api/tool-event", {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        ...buildIdentityHeaders(),
      },
      body: JSON.stringify({
        toolId,
        action,
        sourcePath:
          getSameOriginReferrerPath() ?? new URL(currentUrl).pathname,
      }),
    }).catch(() => {});
  }

  useEffect(() => {
    if (!hydrated || !toolId) return;

    const viewKey = `linqingan:tool-view:${toolId}`;
    try {
      if (!window.sessionStorage.getItem(viewKey)) {
        window.sessionStorage.setItem(viewKey, "1");
        recordToolEvent("view");
      }
    } catch {
      recordToolEvent("view");
    }

    const useKey = `linqingan:tool-use:${toolId}`;
    const handleInteraction = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".tool-utility-bar")) return;
      if (!target.closest("button, input, select, textarea")) return;

      try {
        if (window.sessionStorage.getItem(useKey)) return;
        window.sessionStorage.setItem(useKey, "1");
      } catch {}

      recordToolEvent("use");
    };

    document.addEventListener("click", handleInteraction, true);
    document.addEventListener("change", handleInteraction, true);

    return () => {
      document.removeEventListener("click", handleInteraction, true);
      document.removeEventListener("change", handleInteraction, true);
    };
  }, [hydrated, toolId]);

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
      recordToolEvent("share");
    } catch {
      setStatus("未完成分享");
    }
  }

  function resetTool() {
    if (!hydrated) return;
    recordToolEvent("reset");
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
        <a
          href={hydrated ? issueHref : undefined}
          aria-disabled={!hydrated}
          tabIndex={hydrated ? undefined : -1}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => {
            if (!hydrated) {
              event.preventDefault();
              return;
            }
            recordToolEvent("report");
          }}
        >
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
        .tool-utility-actions button:disabled,
        .tool-utility-actions a[aria-disabled="true"] { cursor: not-allowed; opacity: .5; }
        .tool-utility-bar > p { min-height: 20px; margin: 0; color: var(--muted); font-size: 12px; }
      `}</style>
    </section>
  );
}
