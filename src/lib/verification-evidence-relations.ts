import { screepsApiReference } from "@/lib/screeps-api-reference";
import { screepsErrorCodes, type ScreepsErrorCode } from "@/lib/screeps-errors";
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
  [/^StructureSpawn\.spawnCreep$/i, { label: "Spawn Queue and Replacement Planner", href: "/tools/spawn-queue-replacement-planner" }],
  [/^Game\.cpu(?:\.|$)/i, { label: "Room Diagnostics", href: "/tools/room-diagnostics" }],
  [/^StructureLink\./i, { label: "Room Diagnostics", href: "/tools/room-diagnostics" }],
  [/^Creep\.upgradeController$/i, { label: "Controller Downgrade and Upgrader Planner", href: "/tools/controller-downgrade-planner" }],
  [/^Game\.market(?:\.|$)/i, { label: "Market and Terminal Cost Calculator", href: "/tools/market-terminal-cost-calculator" }],
];

const apiReferenceAliases: Record<string, string> = {
  "structurespawn.spawncreep": "spawn-spawn-creep",
  "structurespawn.renewcreep": "spawn-renew-creep",
  "structurespawn.recyclecreep": "spawn-recycle-creep",
  "structurelink.transferenergy": "link-transfer-energy",
  "structuretower.attack": "tower-attack-heal-repair",
  "structuretower.heal": "tower-attack-heal-repair",
  "structuretower.repair": "tower-attack-heal-repair",
};

export function getEvidenceApiReferenceId(apiName: string) {
  const normalized = apiName.trim().toLowerCase();
  const aliased = apiReferenceAliases[normalized];
  if (aliased) return aliased;

  const exact = screepsApiReference.find((entry) => entry.signature.toLowerCase() === normalized);
  if (exact) return exact.id;

  const methodName = normalized.split(".").at(-1)?.replace(/\(.*$/, "");
  if (!methodName) return undefined;

  const methodToken = `.${methodName}(`;
  return screepsApiReference.find((entry) => entry.signature.toLowerCase().includes(methodToken))?.id;
}

function findErrorCode(record: PublicVerificationEvidenceRecord): ScreepsErrorCode | undefined {
  const raw = record.returnCode?.trim();
  if (!raw) return undefined;

  const named = screepsErrorCodes.find((code) => code.name.toUpperCase() === raw.toUpperCase());
  if (named?.value === 0) return undefined;
  if (named) return named;

  const numericValue = Number(raw);
  if (!Number.isInteger(numericValue) || numericValue === 0) return undefined;

  const matches = screepsErrorCodes.filter((code) => code.value === numericValue);
  if (matches.length === 0) return undefined;

  if (numericValue === -6 && /^StructureSpawn\.spawnCreep$/i.test(record.apiName)) {
    return matches.find((code) => code.name === "ERR_NOT_ENOUGH_ENERGY") ?? matches[0];
  }

  return matches.find((code) => code.name !== "ERR_NOT_ENOUGH_ENERGY") ?? matches[0];
}

export function getEvidenceRelations(
  record: PublicVerificationEvidenceRecord,
  locale: "zh" | "en" = "zh",
): EvidenceRelations {
  const prefix = locale === "en" ? "/en" : "";
  const tool = toolByApi.find(([pattern]) => pattern.test(record.apiName))?.[1];
  const apiReferenceId = getEvidenceApiReferenceId(record.apiName);
  const errorCode = findErrorCode(record);

  return {
    api: {
      label: locale === "zh" ? `API：${record.apiName}` : `API: ${record.apiName}`,
      href: `${prefix}/screeps-api${apiReferenceId ? `#${apiReferenceId}` : ""}`,
    },
    error: errorCode
      ? {
          label: `${errorCode.name} (${errorCode.value})`,
          href: `${prefix}/screeps-errors#${errorCode.name.toLowerCase()}`,
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
