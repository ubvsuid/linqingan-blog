import { publishedEnglishArticles } from "@/lib/english-articles";

export interface EnglishSearchDocument {
  id: string;
  title: string;
  description: string;
  href: string;
  type: "Page" | "Reference" | "Tool" | "Article";
  keywords: string[];
}

const foundationDocuments: EnglishSearchDocument[] = [
  {
    id: "english-home",
    title: "Screeps Tutorials, Debugging Guides and Tools",
    description: "The English home for practical Screeps learning, debugging, references, and tools.",
    href: "/en",
    type: "Page",
    keywords: ["screeps", "tutorial", "debugging", "javascript", "automation"],
  },
  {
    id: "english-beginner",
    title: "Screeps Beginner Roadmap",
    description: "A learning sequence from ticks and the first Creep to roles, upgrading, construction, and a room loop.",
    href: "/en/beginner",
    type: "Page",
    keywords: ["beginner", "first creep", "spawn", "harvest", "upgrade controller"],
  },
  {
    id: "english-knowledge",
    title: "Screeps Knowledge Base",
    description: "A structured map for Memory, spawning, economy, movement, Controllers, defense, market systems, and debugging.",
    href: "/en/knowledge",
    type: "Page",
    keywords: ["memory", "spawn", "economy", "pathfinding", "controller", "market", "cpu"],
  },
  {
    id: "english-errors",
    title: "Screeps Error Codes and Return Values",
    description: "Common constants such as ERR_NOT_IN_RANGE, ERR_NO_PATH, ERR_BUSY, ERR_FULL, and ERR_NOT_ENOUGH_ENERGY.",
    href: "/en/screeps-errors",
    type: "Reference",
    keywords: ["return code", "err_not_in_range", "err_no_path", "err_busy", "err_full", "error"],
  },
  {
    id: "english-glossary",
    title: "Screeps Glossary",
    description: "Definitions for Creep, Spawn, tick, Memory, Controller, RCL, GCL, CPU, bucket, store, and fatigue.",
    href: "/en/glossary",
    type: "Reference",
    keywords: ["glossary", "creep", "spawn", "tick", "rcl", "gcl", "bucket", "fatigue"],
  },
  {
    id: "english-verification",
    title: "How Screeps Guides Are Verified",
    description: "Documentation checks, syntax checks, offline simulation, Console testing, and live multi-tick verification.",
    href: "/en/verification",
    type: "Reference",
    keywords: ["verification", "tested", "console", "simulation", "live room"],
  },
  {
    id: "english-tools",
    title: "Free Screeps Tools",
    description: "Browser-based tools that do not request a Screeps token or connect to an account.",
    href: "/en/tools",
    type: "Page",
    keywords: ["tools", "calculator", "diagnostics", "free"],
  },
  {
    id: "english-body-calculator",
    title: "Screeps Creep Body Calculator",
    description: "Calculate Energy cost, spawn time, hits, carry capacity, and loaded movement speed.",
    href: "/en/tools/creep-body-calculator",
    type: "Tool",
    keywords: ["body calculator", "creep cost", "move ratio", "spawn time", "carry capacity"],
  },
  {
    id: "english-room-diagnostics",
    title: "Screeps Room Snapshot Diagnostic",
    description: "Check Spawn, workforce, Energy, Controller, construction, CPU, and bucket risks from a static snapshot.",
    href: "/en/tools/room-diagnostics",
    type: "Tool",
    keywords: ["room diagnostics", "spawn count", "harvester", "controller downgrade", "cpu bucket"],
  },
  {
    id: "english-about",
    title: "About Linqingan and the Screeps Knowledge Project",
    description: "Project purpose, verification approach, open development, repository, and contact information.",
    href: "/en/about",
    type: "Page",
    keywords: ["linqingan", "about", "github", "project"],
  },
];

const articleDocuments: EnglishSearchDocument[] = publishedEnglishArticles.map(
  (article) => ({
    id: article.href.replace(/^\//, "").replaceAll("/", "-"),
    title: article.title,
    description: article.description,
    href: article.href,
    type: "Article",
    keywords: [
      article.primaryKeyword,
      article.searchIntent,
      ...article.keywords,
    ],
  }),
);

export const englishSearchDocuments: EnglishSearchDocument[] = [
  ...articleDocuments,
  ...foundationDocuments,
];
