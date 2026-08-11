import type { PublicVerificationEvidenceRecord } from "@/lib/verification-evidence";

export interface EvidenceRelationLink {
  label: string;
  href: string;
}

export interface EvidenceRelations {
  api: EvidenceRelationLink;
  error?: EvidenceRelationLink;
  tool?: EvidenceRelationLink;
}

const toolByApi: Array<[RegExp, EvidenceRelationLink]> = [
  [/^StructureSpawn\.spawnCreep$/i, { label: "Spawn Capacity Planner", href: "/tools/spawn-capacity-planner" }],
  [/^Game\.cpu(?:\.|$)/i, { label: "Room Diagnostics", href: "/tools/room-diagnostics" }],
  [/^StructureLink\./i, { label: "Room Diagnostics", href: "/tools/room-diagnostics" }],
  [/^Creep\.upgradeController$/i, { label: "Controller Planner", href: "/tools/controller-planner" }],
  [/^Game\.market(?:\.|$)/i, { label: "Market & Terminal Calculator", href: "/tools/market-terminal-calculator" }],
];

export function getEvidenceRelations(
  record: PublicVerificationEvidenceRecord,
  locale: "zh" | "en" = "zh",
): EvidenceRelations {
  const prefix = locale === "en" ? "/en" : "";
  const tool = toolByApi.find(([pattern]) => pattern.test(record.apiName))?.[1];

  return {
    api: {
      label: locale === "zh" ? `API：${record.apiName}` : `API: ${record.apiName}`,
      href: `${prefix}/screeps-api`,
    },
    error:
      record.returnCode?.startsWith("ERR_")
        ? {
            label: record.returnCode,
            href: `${prefix}/screeps-errors`,
          }
        : undefined,
    tool: tool
      ? {
          label: tool.label,
          href: `${prefix}${tool.href}`,
        }
      : undefined,
  };
}
