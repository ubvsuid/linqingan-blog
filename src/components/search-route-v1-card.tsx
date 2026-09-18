"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import { useEffect, useRef } from "react";

import type { KnowledgeClusterHandoff } from "@/lib/knowledge-cluster-handoff";
import { trackSearchV3Event } from "@/lib/search-v3-telemetry-client";
import type {
  SearchRouteV1,
  SearchRouteV1Action,
  SearchRouteV1RelatedPath,
} from "@/lib/search-route-v1";

import styles from "./search-route-v1-card.module.css";

function recordAction(
  route: SearchRouteV1,
  action: SearchRouteV1Action,
) {
  track("search_v3_route_click", {
    routeVersion: route.version,
    locale: route.locale,
    intentKind: route.intent.kind,
    actionKind: action.kind,
    targetId: action.targetId.slice(0, 96),
  });
  trackSearchV3Event({
    eventName: "search_v3_action_clicked",
    routeVersion: route.version,
    locale: route.locale,
    intentKind: route.intent.kind,
    intentId: route.intent.entityId,
    source: "route_card",
    actionKind: action.kind,
    targetId: action.targetId,
  });
}

function recordRelatedPath(
  route: SearchRouteV1,
  path: SearchRouteV1RelatedPath,
) {
  track("search_v3_related_path_click", {
    routeVersion: route.version,
    locale: route.locale,
    intentKind: route.intent.kind,
    relatedKind: path.kind,
    targetId: path.targetId.slice(0, 96),
  });
  trackSearchV3Event({
    eventName: "search_v3_related_path_clicked",
    routeVersion: route.version,
    locale: route.locale,
    intentKind: route.intent.kind,
    intentId: route.intent.entityId,
    source: "route_card",
    relatedKind: path.kind,
    targetId: path.targetId,
  });
}

function recordCluster(
  route: SearchRouteV1,
  cluster: KnowledgeClusterHandoff,
) {
  track("search_v3_cluster_click", {
    routeVersion: route.version,
    locale: route.locale,
    intentKind: route.intent.kind,
    clusterId: cluster.clusterId,
  });
  trackSearchV3Event({
    eventName: "search_v3_cluster_clicked",
    routeVersion: route.version,
    locale: route.locale,
    intentKind: route.intent.kind,
    intentId: route.intent.entityId,
    source: "route_card",
    clusterId: cluster.clusterId,
  });
}

export function SearchRouteV1Card({
  route,
  clusterHandoff = null,
  clusterBoundaryNote,
}: {
  route: SearchRouteV1;
  clusterHandoff?: KnowledgeClusterHandoff | null;
  clusterBoundaryNote: string;
}) {
  const isEnglish = route.locale === "en";
  const titleId = `search-route-v1-title-${route.locale}`;
  const lastShownRouteRef = useRef("");

  useEffect(() => {
    const routeKey = [
      route.version,
      route.locale,
      route.intent.kind,
      route.intent.entityId,
    ].join("|");
    if (lastShownRouteRef.current === routeKey) return;
    lastShownRouteRef.current = routeKey;

    track("search_v3_route_shown", {
      routeVersion: route.version,
      locale: route.locale,
      intentKind: route.intent.kind,
      targetId: route.intent.entityId.slice(0, 96),
    });
    trackSearchV3Event({
      eventName: "search_v3_route_shown",
      routeVersion: route.version,
      locale: route.locale,
      intentKind: route.intent.kind,
      intentId: route.intent.entityId,
      source: "route_card",
    });
  }, [
    route.version,
    route.locale,
    route.intent.kind,
    route.intent.entityId,
  ]);

  return (
    <aside
      className={styles.card}
      aria-labelledby={titleId}
      data-search-route-v1={route.intent.kind}
      data-search-route-entity={route.intent.entityId}
    >
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>SEARCH V3 · {route.intent.kind.toUpperCase()}</p>
          <h2 id={titleId}>{isEnglish ? "Answer and next action" : "回答与下一步"}</h2>
        </div>
        <span>{isEnglish ? "High confidence" : "高置信度"}</span>
      </header>

      <p className={styles.answer}>{route.answer}</p>

      <div className={styles.actions}>
        <Link
          className={styles.primary}
          href={route.primaryAction.href}
          prefetch={false}
          onClick={() => recordAction(route, route.primaryAction)}
        >
          {route.primaryAction.label} →
        </Link>
        {route.secondaryActions.map((action) => (
          <Link
            className={styles.secondary}
            href={action.href}
            key={`${action.kind}:${action.targetId}`}
            prefetch={false}
            onClick={() => recordAction(route, action)}
          >
            {action.label} →
          </Link>
        ))}
      </div>

      {route.relatedPaths.length > 0 ? (
        <section className={styles.related} aria-label={isEnglish ? "Related paths" : "相关路径"}>
          <h3>{isEnglish ? "Related paths" : "相关路径"}</h3>
          <div>
            {route.relatedPaths.map((path) => (
              <Link
                href={path.href}
                key={`${path.kind}:${path.targetId}`}
                prefetch={false}
                onClick={() => recordRelatedPath(route, path)}
              >
                <span>{path.kind}</span>
                <strong>{path.title}</strong>
                <small>{path.description}</small>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {clusterHandoff ? (
        <footer className={styles.cluster}>
          <div>
            <span>{isEnglish ? "KNOWLEDGE CLUSTER" : "KNOWLEDGE CLUSTER"}</span>
            <strong>{clusterHandoff.title}</strong>
            <p>{clusterHandoff.description}</p>
            <p>{clusterBoundaryNote}</p>
          </div>
          <Link
            href={clusterHandoff.href}
            prefetch={false}
            onClick={() => recordCluster(route, clusterHandoff)}
          >
            {isEnglish ? "Open cluster" : "打开知识簇"} →
          </Link>
        </footer>
      ) : null}
    </aside>
  );
}
