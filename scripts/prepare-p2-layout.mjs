import fs from "node:fs";

const calculatorPath = "src/components/creep-body-calculator.tsx";
let calculator = fs.readFileSync(calculatorPath, "utf8");
const marker = "@media (max-width: 560px) { .body-presets { grid-template-columns: 1fr; } }";

if (!calculator.includes(marker)) {
  const anchor = "        @media (max-width: 900px) { .body-calculator { grid-template-columns: 1fr; } .body-results { position: static; } }";
  if (!calculator.includes(anchor)) {
    throw new Error("Unable to prepare P2 calculator mobile layout");
  }
  calculator = calculator.replace(anchor, `${anchor}\n        ${marker}`);
  fs.writeFileSync(calculatorPath, calculator);
}

const homepagePath = "src/app/page.tsx";
let homepage = fs.readFileSync(homepagePath, "utf8");
if (
  homepage.includes('import { HomeTaskHub } from "@/components/home-task-hub";') &&
  !homepage.includes('import { HomeLearningActions } from "@/components/home-learning-actions";')
) {
  homepage = homepage
    .replace(
      'import { HomeTaskHub } from "@/components/home-task-hub";',
      'import { HomeLearningActions } from "@/components/home-learning-actions";',
    )
    .replace("<HomeTaskHub />", "<HomeLearningActions />");
  fs.writeFileSync(homepagePath, homepage);
}

console.log("P2 calculator mobile layout and homepage migration baseline prepared.");
