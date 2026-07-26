import { englishArticleRoutePairs } from "@/lib/english-articles-complete";

export const englishNavigation = [
  { label: "Beginner", href: "/en/beginner" },
  { label: "Articles", href: "/en/blog" },
  { label: "Knowledge", href: "/en/knowledge" },
  { label: "Tools", href: "/en/tools" },
  { label: "About", href: "/en/about" },
] as const;

export const languageRoutePairs = {
  "/": "/en",
  "/beginner": "/en/beginner",
  "/blog": "/en/blog",
  ...englishArticleRoutePairs,
  "/knowledge": "/en/knowledge",
  "/knowledge#reference-tools": "/en/tools",
  "/tools/creep-body-calculator": "/en/tools/creep-body-calculator",
  "/tools/room-diagnostics": "/en/tools/room-diagnostics",
  "/screeps-errors": "/en/screeps-errors",
  "/glossary": "/en/glossary",
  "/verification": "/en/verification",
  "/tags": "/en/tags",
  "/about": "/en/about",
  "/search": "/en/search",
  "/changelog": "/en/changelog",
  "/now": "/en/roadmap",
} as const;

export const englishKnowledgeModules = [
  {
    number: 1,
    title: "Memory and Code Structure",
    description: "State, modules, global cache, RawMemory, flags, and maintainable game-loop structure.",
  },
  {
    number: 2,
    title: "Spawn and Creep Lifecycle",
    description: "Body design, spawn return codes, role memory, renewal, recycling, and emergency recovery.",
  },
  {
    number: 3,
    title: "Room Economy",
    description: "Harvesting, hauling, storage, links, terminals, minerals, and stable energy flow.",
  },
  {
    number: 4,
    title: "Movement and Vision",
    description: "moveTo(), fatigue, RoomPosition, PathFinder, routes, observers, and room visibility.",
  },
  {
    number: 5,
    title: "Controllers and Expansion",
    description: "Upgrading, downgrade recovery, reserving, claiming, safe mode, and remote control.",
  },
  {
    number: 6,
    title: "Construction and Defense",
    description: "Construction sites, towers, walls, ramparts, repairs, and defensive priorities.",
  },
  {
    number: 7,
    title: "Market and Advanced Resources",
    description: "Orders, deals, terminals, labs, boosts, factories, power, and late-game resources.",
  },
  {
    number: 8,
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
