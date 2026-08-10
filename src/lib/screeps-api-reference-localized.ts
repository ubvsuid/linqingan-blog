import { englishDiscoveryArticles } from "@/lib/english-discovery";
import {
  screepsApiReference,
  type ScreepsApiReferenceEntry,
} from "@/lib/screeps-api-reference";

export type ScreepsApiLocale = "zh" | "en";

type EnglishApiCopy = {
  summary: string;
  keywords: string[];
};

const englishCopy: Record<string, EnglishApiCopy> = {
  "game-time": {
    summary: "Read the current game tick number for scheduling, logs, and cross-tick state decisions.",
    keywords: ["tick", "time", "game loop"],
  },
  "game-rooms": {
    summary: "Read currently visible Rooms. A Room without vision is not present and may evaluate to undefined.",
    keywords: ["Room", "vision", "undefined"],
  },
  "game-get-object-by-id": {
    summary: "Restore a currently accessible game object from its ID. Returns null when the object cannot be resolved.",
    keywords: ["ID", "Memory", "cached target", "null"],
  },
  "game-notify": {
    summary: "Queue an account notification for Controller risk, colony failures, and other events that matter outside the Console.",
    keywords: ["notification", "alert", "groupInterval"],
  },
  "game-cpu-get-used": {
    summary: "Read CPU used so far in the current tick and compare before/after samples around a code section.",
    keywords: ["CPU", "bucket", "performance"],
  },
  "game-map-find-route": {
    summary: "Plan a room-level route between rooms and inspect exit directions plus the next-room sequence.",
    keywords: ["cross-room", "route", "routeCallback"],
  },
  "creep-move-to": {
    summary: "Schedule Creep movement. OK means the movement request was accepted, not that the position already changed.",
    keywords: ["movement", "ERR_NO_PATH", "fatigue", "path"],
  },
  "creep-harvest": {
    summary: "Harvest from an allowed Source, Mineral, or other resource target when the Creep has the required body parts.",
    keywords: ["Source", "Energy", "WORK", "harvest"],
  },
  "creep-transfer": {
    summary: "Transfer a resource from the Creep Store to a target that can receive it.",
    keywords: ["hauling", "Energy", "Store", "Spawn"],
  },
  "creep-withdraw": {
    summary: "Withdraw a resource from a Structure, Tombstone, or Ruin Store.",
    keywords: ["Container", "Storage", "Store", "withdraw"],
  },
  "creep-pickup": {
    summary: "Pick up a dropped Resource object. Stored resources in Containers and similar targets use withdraw instead.",
    keywords: ["dropped resource", "Energy", "Resource"],
  },
  "creep-upgrade-controller": {
    summary: "Spend carried Energy through WORK parts to add progress to an owned Controller.",
    keywords: ["Controller", "upgrade", "WORK", "Upgrader"],
  },
  "room-create-construction-site": {
    summary: "Submit a Construction Site request at a position and use the return code as the authoritative immediate result.",
    keywords: ["Construction Site", "build", "Road"],
  },
  "room-get-event-log": {
    summary: "Read the previous tick's room events for follow-up evidence around attacks, repairs, construction, and other actions.",
    keywords: ["event log", "event", "previous tick"],
  },
  "spawn-spawn-creep": {
    summary: "Submit a Creep spawn request. Validate name, body, Energy, dryRun, and the final return code.",
    keywords: ["Spawn", "Creep", "body", "dryRun"],
  },
  "spawn-renew-creep": {
    summary: "Use an owned Spawn to extend an eligible normal Creep's lifetime while accounting for Spawn occupancy and Boost limits.",
    keywords: ["Spawn", "TTL", "ticksToLive", "renew"],
  },
  "spawn-recycle-creep": {
    summary: "Recycle a Creep you no longer need. The target must be near your Spawn and should be treated as an explicit one-way task.",
    keywords: ["Spawn", "Creep", "recycle"],
  },
  "link-transfer-energy": {
    summary: "Transfer Energy between Links in the same room after checking cooldown, stock, free capacity, and transfer loss.",
    keywords: ["Link", "Energy", "cooldown", "logistics"],
  },
  "tower-attack-heal-repair": {
    summary: "Use a Tower's attack, heal, or repair action. These actions share the tick's action opportunity and scale with range.",
    keywords: ["Tower", "attack", "heal", "repair"],
  },
  "terminal-send": {
    summary: "Send resources across rooms while the sender pays transaction Energy. Check cooldown, stock, and destination first.",
    keywords: ["Terminal", "cross-room", "Energy", "logistics"],
  },
  "lab-run-reaction": {
    summary: "Run a reaction in an output Lab using minerals from two input Labs to produce a compound.",
    keywords: ["Lab", "reaction", "REACTIONS"],
  },
  "lab-boost-creep": {
    summary: "Spend a Lab's compound and Energy to boost matching Creep body parts.",
    keywords: ["Lab", "Boost", "bodyPartsCount"],
  },
  "factory-produce": {
    summary: "Produce a commodity from COMMODITIES recipes after checking components, capacity, level, and cooldown.",
    keywords: ["Factory", "COMMODITIES", "commodity"],
  },
  "observer-observe-room": {
    summary: "Request vision for a remote room and read that Room from Game.rooms on a later tick.",
    keywords: ["Observer", "vision", "cross-room"],
  },
  "market-deal": {
    summary: "Execute a real market deal after checking the order, Credits, resource stock, and Terminal transaction cost.",
    keywords: ["Market", "deal", "order", "Credits"],
  },
  "market-create-order": {
    summary: "Create your own market buy or sell order and account for the order creation fee.",
    keywords: ["Market", "order", "createOrder"],
  },
  "pathfinder-search": {
    summary: "Run tile-level pathfinding and inspect path, cost, ops, and incomplete rather than treating the path alone as the result.",
    keywords: ["PathFinder", "CostMatrix", "pathfinding", "incomplete"],
  },
};

function getEnglishGuideHref(href: string | undefined): string | undefined {
  if (!href) return undefined;
  if (href.startsWith("/tools/")) return `/en${href}`;
  return englishDiscoveryArticles.find((article) => article.chinesePath === href)?.href;
}

export function getLocalizedScreepsApiReference(
  locale: ScreepsApiLocale,
): ScreepsApiReferenceEntry[] {
  if (locale === "zh") return screepsApiReference;

  return screepsApiReference.map((entry) => {
    const copy = englishCopy[entry.id];
    return {
      ...entry,
      summary: copy?.summary ?? entry.summary,
      keywords: copy?.keywords ?? entry.keywords,
      guideHref: getEnglishGuideHref(entry.guideHref),
    };
  });
}
