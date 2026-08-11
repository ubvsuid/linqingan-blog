import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ScreepsApiHubPage } from "@/components/screeps-api-hub-page";
import {
  getScreepsApiHub,
  getScreepsApiHubHref,
  screepsApiHubSlugs,
} from "@/lib/screeps-api-hubs";
import { createPageMetadata } from "@/lib/metadata";

export function generateStaticParams() {
  return screepsApiHubSlugs.map((hub) => ({ hub }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hub: string }>;
}): Promise<Metadata> {
  const { hub: slug } = await params;
  const hub = getScreepsApiHub(slug);
  if (!hub) return {};

  return createPageMetadata({
    title: hub.zhTitle,
    description: hub.zhDescription,
    path: getScreepsApiHubHref(hub.slug, "zh"),
  });
}

export default async function ChineseScreepsApiHubRoute({
  params,
}: {
  params: Promise<{ hub: string }>;
}) {
  const { hub: slug } = await params;
  const hub = getScreepsApiHub(slug);
  if (!hub) notFound();

  return <ScreepsApiHubPage hub={hub} locale="zh" />;
}
