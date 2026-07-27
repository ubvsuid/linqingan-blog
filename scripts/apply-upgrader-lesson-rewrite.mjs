import fs from "node:fs";

function replaceOnce(path, before, after) {
  const current = fs.readFileSync(path, "utf8");
  const matches = current.split(before).length - 1;

  if (matches !== 1) {
    throw new Error(`${path}: expected one patch anchor, found ${matches}.`);
  }

  fs.writeFileSync(path, current.replace(before, after));
}

replaceOnce(
  "src/lib/english-articles-complete.ts",
  `      "Screeps beginner roles",
    ],
  },
};`,
  `      "Screeps beginner roles",
    ],
  },
  "/en/blog/screeps-upgrade-controller": {
    category: "GETTING STARTED · BEGINNER LESSON 9 OF 12",
    title: "Screeps upgradeController(): Build Your First Upgrader Loop",
    description:
      "Build one Upgrader1 loop that harvests from an active Source, moves within Controller range 3, spends Energy with upgradeController(), and switches state across ticks.",
    readingTime: "10 min read",
    primaryKeyword: "Screeps upgradeController",
    searchIntent:
      "Beginner action tutorial for running one fixed-name Upgrader between an active Source and an owned Room Controller across repeated ticks",
    finalScore: 98,
    updatedAt: "2026-07-27",
    keywords: [
      "Screeps upgradeController",
      "Creep.upgradeController()",
      "Screeps Upgrader code",
      "creep.memory.upgrading",
      "FIND_SOURCES_ACTIVE",
      "Room Controller range 3",
    ],
  },
};`,
);

replaceOnce(
  "src/lib/english-discovery.ts",
  `  "/en/blog/screeps-creep-roles",
]);`,
  `  "/en/blog/screeps-creep-roles",
  "/en/blog/screeps-upgrade-controller",
]);`,
);

replaceOnce(
  "src/lib/english-discovery.ts",
  `  "/en/blog/screeps-creep-roles": [
    "/en/blog/screeps-spawn-creep",
    "/en/blog/screeps-upgrade-controller",
    "/en/blog/screeps-memory-basics",
    "/en/blog/screeps-require-modules",
  ],
};`,
  `  "/en/blog/screeps-creep-roles": [
    "/en/blog/screeps-spawn-creep",
    "/en/blog/screeps-upgrade-controller",
    "/en/blog/screeps-memory-basics",
    "/en/blog/screeps-require-modules",
  ],
  "/en/blog/screeps-upgrade-controller": [
    "/en/blog/screeps-creep-roles",
    "/en/blog/screeps-first-extension",
    "/en/blog/screeps-memory-basics",
    "/en/blog/screeps-err-not-in-range",
  ],
};`,
);

console.log("Applied the beginner Upgrader lesson registry and discovery patches.");
