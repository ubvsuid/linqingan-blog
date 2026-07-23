import fs from "node:fs";

const filePath = "src/app/blog/[slug]/page.tsx";
let source = fs.readFileSync(filePath, "utf8");
const anchor = '  const articleUrl = `${siteConfig.url}/blog/${post.slug}`;';
const replacement = `${anchor}\n  const socialImage = post.cover ?? \`\${siteConfig.url}/blog/\${post.slug}/opengraph-image\`;`;

if (!source.includes(replacement)) {
  if (!source.includes(anchor)) {
    throw new Error("Unable to scope article social image");
  }
  source = source.replace(anchor, replacement);
}

fs.writeFileSync(filePath, source);
console.log("Article social image structured-data scope corrected.");
