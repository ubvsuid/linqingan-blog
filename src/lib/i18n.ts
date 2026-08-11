import { englishArticleRoutePairs } from "@/lib/english-articles-complete";

export const englishNavigation = [
  { label: "Beginner", href: "/en/beginner" },
  { label: "Articles", href: "/en/blog" },
  { label: "Knowledge", href: "/en/knowledge" },
  { label: "Diagnostics", href: "/en/diagnostics" },
  { label: "Tools", href: "/en/tools" },
  { label: "About", href: "/en/about" },
] as const;

export const languageRoutePairs = {
  "/": "/en",
  "/beginner": "/en/beginner",
  "/blog": "/en/blog",
  ...englishArticleRoutePairs,
  "/knowledge": "/en/knowledge",
  "/diagnostics": "/en/diagnostics",
  "/screeps-api": "/en/screeps-api",
  "/screeps-api/creep": "/en/screeps-api/creep",
  "/screeps-api/room": "/en/screeps-api/room",
  "/screeps-api/structure-spawn": "/en/screeps-api/structure-spawn",
  "/screeps-api/controller": "/en/screeps-api/controller",
  "/screeps-api/market": "/en/screeps-api/market",
  "/tools": "/en/tools",
  "/tools/creep-body-calculator": "/en/tools/creep-body-calculator",
  "/tools/room-diagnostics": "/en/tools/room-diagnostics",
  "/tools/market-terminal-cost-calculator": "/en/tools/market-terminal-cost-calculator",
  "/tools/controller-downgrade-planner": "/en/tools/controller-downgrade-planner",
  "/tools/lab-reaction-boost-planner": "/en/tools/lab-reaction-boost-planner",
  "/tools/spawn-queue-replacement-planner": "/en/tools/spawn-queue-replacement-planner",
  "/tools/hauling-throughput-planner": "/en/tools/hauling-throughput-planner",
  "/tools/tower-damage-heal-repair-calculator": "/en/tools/tower-damage-heal-repair-calculator",
  "/screeps-errors": "/en/screeps-errors",
  "/glossary": "/en/glossary",
  "/verification": "/en/verification",
  "/verified": "/en/verified",
  "/tags": "/en/tags",
  "/about": "/en/about",
  "/search": "/en/search",
  "/changelog": "/en/changelog",
  "/now": "/en/roadmap",
} as const;

export const englishKnowledgeModules = [
  {
    number: 1,
    slug: "memory-code-structure",
    title: "Memory and Code Structure",
    description: "State, modules, global cache, RawMemory, flags, and maintainable game-loop structure.",
  },
  {
    number: 2,
    slug: "spawn-creep-lifecycle",
    title: "Spawn and Creep Lifecycle",
    description: "Body design, spawn return codes, role memory, renewal, recycling, and emergency recovery.",
  },
  {
    number: 3,
    slug: "room-economy",
    title: "Room Economy",
    description: "Harvesting, hauling, storage, links, terminals, minerals, and stable energy flow.",
  },
  {
    number: 4,
    slug: "movement-vision",
    title: "Movement and Vision",
    description: "moveTo(), fatigue, RoomPosition, PathFinder, routes, observers, and room visibility.",
  },
  {
    number: 5,
    slug: "controllers-expansion",
    title: "Controllers and Expansion",
    description: "Upgrading, downgrade recovery, reserving, claiming, safe mode, and remote control.",
  },
  {
    number: 6,
    slug: "construction-defense",
    title: "Construction and Defense",
    description: "Construction sites, towers, walls, ramparts, repairs, and defensive priorities.",
  },
  {
    number: 7,
    slug: "market-advanced-resources",
    title: "Market and Advanced Resources",
    description: "Orders, deals, terminals, labs, boosts, factories, power, and late-game resources.",
  },
  {
    number: 8,
    slug: "operations-debugging",
    title: "Operations and Debugging",
    description: "Return codes, CPU, bucket, event logs, notifications, diagnostics, and safe operations.",
  },
] as const;

export function isEnglishPath(pathname: string): boolean {
  return pathname === "/en" || pathname.startsWith("/en/");
}

export function getLanguageSwitchTarget(pathname: string): string {
  const pairs = Object.entries(languageRoutePairs) as Array<[string, string]>;

  if (isEnglishPath(pathname)) {
    const match = pairs.find(([, englishPath]) => pathname === englishPath);
    return match?.[0] ?? "/";
  }

  const normalized = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  const match = pairs.find(([chinesePath]) => normalized === chinesePath.split("#")[0]);
  return match?.[1] ?? "/en";
}
