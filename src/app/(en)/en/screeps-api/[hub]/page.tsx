import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ScreepsApiHubPage } from "@/components/screeps-api-hub-page";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import type { languageRoutePairs } from "@/lib/i18n";
import {
  getScreepsApiHub,
  getScreepsApiHubHref,
  screepsApiHubSlugs,
} from "@/lib/screeps-api-hubs";

export const revalidate = 300;

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

  return createEnglishPageMetadata({
    title: hub.enTitle,
    description: hub.enDescription,
    path: getScreepsApiHubHref(hub.slug, "en"),
    chinesePath: getScreepsApiHubHref(hub.slug, "zh") as keyof typeof languageRoutePairs,
  });
}

export default async function EnglishScreepsApiHubRoute({
  params,
}: {
  params: Promise<{ hub: string }>;
}) {
  const { hub: slug } = await params;
  const hub = getScreepsApiHub(slug);
  if (!hub) notFound();

  return <ScreepsApiHubPage hub={hub} locale="en" />;
}
