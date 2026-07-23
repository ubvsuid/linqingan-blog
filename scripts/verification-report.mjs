import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const directory = path.join(process.cwd(), "content/posts");
const rows = fs
  .readdirSync(directory)
  .filter((name) => name.endsWith(".md"))
  .map((name) => {
    const parsed = matter(fs.readFileSync(path.join(directory, name), "utf8"));
    const verification = parsed.data.verification ?? {};
    return {
      slug: name.replace(/\.md$/, ""),
      console: Boolean(verification.consoleTested),
      live: Boolean(verification.liveTested),
      checkedAt: verification.checkedAt ?? "missing",
    };
  });

const pendingConsole = rows.filter((row) => !row.console);
const pendingLive = rows.filter((row) => !row.live);

console.log(`Articles: ${rows.length}`);
console.log(`Console pending: ${pendingConsole.length}`);
console.log(`Live-loop pending: ${pendingLive.length}`);
for (const row of pendingLive.slice(0, 30)) {
  console.log(`- ${row.slug} | checked ${row.checkedAt}`);
}
