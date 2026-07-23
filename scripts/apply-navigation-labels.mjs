import fs from "node:fs";

const path = "src/lib/site.ts";
const source = fs.readFileSync(path, "utf8");
const navigationPattern = /  navigation: \[[\s\S]*?\n  \],\n  links:/;

if (!navigationPattern.test(source)) {
  throw new Error("Unable to apply navigation labels: navigation block not found");
}

const navigation = `  navigation: [
    { label: "首页", href: "/" },
    { label: "入门", href: "/beginner" },
    { label: "文章", href: "/blog" },
    { label: "知识库", href: "/knowledge" },
    { label: "工具", href: "/knowledge#reference-tools" },
    { label: "近况", href: "/now" },
    { label: "关于", href: "/about" },
  ],
  links:`;

fs.writeFileSync(path, source.replace(navigationPattern, navigation));
console.log("Concise primary navigation labels applied.");
