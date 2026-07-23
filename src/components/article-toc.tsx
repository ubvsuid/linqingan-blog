"use client";

import { useEffect, useMemo, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TocGroup {
  parent: TocItem;
  children: TocItem[];
}

export function ArticleToc({ items }: { items: TocItem[] }) {
  const groups = useMemo(() => {
    const next: TocGroup[] = [];
    for (const item of items) {
      if (item.level === 2) next.push({ parent: item, children: [] });
      else if (item.level === 3 && next.length > 0) next[next.length - 1].children.push(item);
    }
    return next;
  }, [items]);
  const [expandedGroup, setExpandedGroup] = useState(groups[0]?.parent.id ?? "");

  useEffect(() => {
    if (groups.length === 0) return;
    const headings = groups
      .flatMap((group) => [group.parent, ...group.children])
      .map((item) => document.getElementById(item.id))
      .filter((heading): heading is HTMLElement => Boolean(heading));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);
        const activeId = visible[0]?.target.id;
        if (!activeId) return;
        const group = groups.find(
          (item) => item.parent.id === activeId || item.children.some((child) => child.id === activeId),
        );
        if (group) setExpandedGroup(group.parent.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 1] },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [groups]);

  if (groups.length <= 1) return null;

  return (
    <details id="article-page-toc" className="article-toc" open={groups.length <= 8}>
      <summary>
        <strong>本文目录</strong>
        <span>{groups.length} 个主要章节</span>
      </summary>
      <ol>
        {groups.map((group) => {
          const expanded = expandedGroup === group.parent.id;
          return (
            <li className={expanded ? "toc-group-active" : undefined} key={group.parent.id}>
              <div className="toc-group-heading">
                <a href={`#${group.parent.id}`}>{group.parent.text}</a>
                {group.children.length > 0 ? (
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={`toc-children-${group.parent.id}`}
                    onClick={() => setExpandedGroup(expanded ? "" : group.parent.id)}
                  >
                    {expanded ? "收起小节" : `${group.children.length} 个小节`}
                  </button>
                ) : null}
              </div>
              {expanded && group.children.length > 0 ? (
                <ol id={`toc-children-${group.parent.id}`}>
                  {group.children.map((child) => (
                    <li key={child.id}><a href={`#${child.id}`}>{child.text}</a></li>
                  ))}
                </ol>
              ) : null}
            </li>
          );
        })}
      </ol>
    </details>
  );
}
