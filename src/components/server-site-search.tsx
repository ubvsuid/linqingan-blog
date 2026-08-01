import Link from "next/link";
import { Fragment } from "react";

import type { SearchDocument, SearchDocumentType } from "@/lib/search";

import styles from "./server-search.module.css";

const typeOrder: SearchDocumentType[] = ["文章", "术语", "错误码", "工具", "项目"];
const popularQueries = [
  "Creep 不移动",
  "ERR_NOT_IN_RANGE",
  "Spawn 失败",
  "Memory 保存目标",
  "CPU bucket",
  "Link transferEnergy",
];
const synonymGroups = [
  ["采集", "harvest", "source"],
  ["运输", "搬运", "transfer", "withdraw"],
  ["升级", "upgrade", "upgradecontroller", "controller"],
  ["工地", "建造", "construction", "constructionsite", "build"],
  ["维修", "repair"],
  ["没能量", "能量不足", "err_not_enough_energy"],
  ["距离不足", "够不到", "err_not_in_range"],
  ["身体", "body", "部件", "bodypart", "bodypart_cost"],
  ["移动速度", "走得慢", "fatigue", "move"],
  ["出生", "生成", "spawn", "spawncreep"],
] as const;

function normalize(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("zh-CN");
}

function getTokens(query: string): string[] {
  const normalizedQuery = normalize(query);
  const tokens = new Set(
    normalizedQuery.split(/[^a-z0-9_\u3400-\u9fff]+/).filter(Boolean),
  );

  for (const group of synonymGroups) {
    if (group.some((term) => normalizedQuery.includes(term))) {
      for (const term of group) tokens.add(term);
    }
  }

  return [...tokens];
}

function scoreDocument(document: SearchDocument, tokens: string[]): number {
  if (tokens.length === 0) return 0;

  const title = normalize(document.title);
  const description = normalize(document.description);
  const meta = normalize(document.meta);
  const keywords = normalize(document.keywords.join(" "));
  const text = normalize(document.text);
  let score = 0;

  for (const token of tokens) {
    if (title === token) score += 24;
    else if (title.startsWith(token)) score += 14;
    else if (title.includes(token)) score += 10;
    if (keywords.includes(token)) score += 7;
    if (description.includes(token)) score += 4;
    if (meta.includes(token)) score += 3;
    if (text.includes(token)) score += 1;
  }

  return score;
}

function highlight(text: string, tokens: string[]) {
  if (tokens.length === 0) return text;
  const expression = new RegExp(
    `(${tokens
      .filter((token) => token.length >= 2)
      .sort((left, right) => right.length - left.length)
      .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")})`,
    "gi",
  );
  if (expression.source === "()") return text;

  const normalizedTokens = new Set(tokens.map(normalize));
  return text.split(expression).map((part, index) =>
    normalizedTokens.has(normalize(part))
      ? <mark key={`${part}-${index}`}>{part}</mark>
      : <Fragment key={`${part}-${index}`}>{part}</Fragment>,
  );
}

interface ServerSiteSearchProps {
  documents: SearchDocument[];
  query: string;
  activeType: string;
}

export function ServerSiteSearch({
  documents,
  query,
  activeType,
}: ServerSiteSearchProps) {
  const normalizedType = typeOrder.includes(activeType as SearchDocumentType)
    ? activeType as SearchDocumentType
    : "";
  const tokens = getTokens(query);
  const ranked = query.trim()
    ? documents
        .map((document) => ({ document, score: scoreDocument(document, tokens) }))
        .filter(({ score }) => score > 0)
        .sort(
          (left, right) =>
            right.score - left.score
            || typeOrder.indexOf(left.document.type) - typeOrder.indexOf(right.document.type)
            || left.document.title.localeCompare(right.document.title, "zh-CN"),
        )
        .map(({ document }) => document)
    : documents.filter((document) => document.type === "工具" || document.type === "错误码");
  const results = (normalizedType
    ? ranked.filter((document) => document.type === normalizedType)
    : ranked
  ).slice(0, query.trim() ? 40 : 12);

  return (
    <section className={styles.search} aria-label="站内搜索结果">
      <form
        className={styles.controls}
        action="/search"
        method="get"
        role="search"
        aria-label="筛选搜索结果"
      >
        <label>
          <span>搜索整个网站</span>
          <input
            type="search"
            name="q"
            defaultValue={query}
            maxLength={120}
            autoComplete="off"
            placeholder="输入 Creep、Memory、ERR_NOT_IN_RANGE、身体计算器……"
          />
        </label>
        <label>
          <span>内容类型</span>
          <select name="type" defaultValue={normalizedType}>
            <option value="">全部内容</option>
            {typeOrder.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <button type="submit">搜索</button>
      </form>

      <nav className={styles.popular} aria-label="热门搜索">
        <strong>热门</strong>
        {popularQueries.map((popularQuery) => (
          <Link key={popularQuery} href={`/search?q=${encodeURIComponent(popularQuery)}`}>
            {popularQuery}
          </Link>
        ))}
      </nav>

      <div className={styles.summary}>
        <p>
          {query.trim()
            ? <>找到 <strong>{results.length}</strong> 条匹配结果</>
            : <>展示 <strong>{results.length}</strong> 条常用内容</>}
        </p>
        {(query.trim() || normalizedType) ? <Link className={styles.reset} href="/search">清除条件</Link> : null}
      </div>

      {results.length > 0 ? (
        <div className={styles.results}>
          {results.map((result) => (
            <article className={styles.result} key={result.id}>
              <div className={styles.meta}>
                <span>{result.type}</span>
                <small>{result.meta}</small>
              </div>
              <h2><Link href={result.href}>{highlight(result.title, tokens)}</Link></h2>
              <p>{highlight(result.description, tokens)}</p>
              {result.keywords.length > 0 ? (
                <div className={styles.keywords} aria-label="相关关键词">
                  {result.keywords.slice(0, 5).map((keyword) => <span key={keyword}>{keyword}</span>)}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <strong>没有找到“{query.trim()}”</strong>
          <p>请保留对象名、方法名、错误码或核心中文问题，并尝试去掉括号、点号和参数。</p>
          <div className={styles.emptyActions}>
            <Link href="/knowledge">浏览知识库</Link>
            <Link href="/screeps-errors">查询错误码</Link>
            <a href="https://github.com/ubvsuid/linqingan-blog/issues/new" rel="noreferrer" target="_blank">提交缺少内容 ↗</a>
          </div>
        </div>
      )}
    </section>
  );
}
