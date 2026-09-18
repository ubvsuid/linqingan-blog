const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const chineseChecks = [
  {
    pathname: "/blog/screeps-introduction",
    role: "Beginner lesson",
    expected: ["data-reading-system=\"v1\"", "article-shell monochrome-system-page article-reading-system", "home-brand-wordmark", "article-page-toc"],
  },
  {
    pathname: "/blog/screeps-spawn-create-creep",
    role: "API/action guide",
    expected: ["data-reading-system=\"v1\"", "article-shell monochrome-system-page article-reading-system", "home-brand-wordmark"],
  },
  {
    pathname: "/blog/screeps-memory-basics",
    role: "Knowledge article",
    expected: ["data-reading-system=\"v1\"", "article-shell monochrome-system-page article-reading-system", "home-brand-wordmark", "文章学习信息"],
  },
];

const failures = [];

for (const check of chineseChecks) {
  const response = await fetch(`${baseUrl}${check.pathname}`, { redirect: "manual" });
  const body = await response.text();

  if (response.status !== 200) {
    failures.push(`${check.pathname}: expected 200, received ${response.status}`);
    continue;
  }

  for (const expected of check.expected) {
    if (!body.includes(expected)) {
      failures.push(`${check.pathname}: missing ${check.role} Reading System marker: ${expected}`);
    }
  }

  if (body.includes('class="theme-toggle"') || body.includes('class="profile-shortcut"')) {
    failures.push(`${check.pathname}: legacy theme/profile controls leaked into the Chinese monochrome article shell`);
  }
}

const englishPath = "/en/blog/screeps-introduction";
const englishResponse = await fetch(`${baseUrl}${englishPath}`, { redirect: "manual" });
const englishBody = await englishResponse.text();

if (englishResponse.status !== 200) {
  failures.push(`${englishPath}: expected 200, received ${englishResponse.status}`);
} else {
  for (const expected of [
    'data-reading-system="v1-en"',
    "article-reading-system",
    "english-article-reading-system",
    "english-monochrome-system",
    "home-brand-wordmark",
  ]) {
    if (!englishBody.includes(expected)) {
      failures.push(`${englishPath}: missing English Reading System marker: ${expected}`);
    }
  }
  if (englishBody.includes('data-reading-system="v1"')) {
    failures.push(`${englishPath}: Chinese-only Reading System marker leaked into English article output`);
  }
  if (englishBody.includes('class="theme-toggle"')) {
    failures.push(`${englishPath}: legacy theme control leaked into the English monochrome article shell`);
  }
}

if (failures.length > 0) {
  console.error("Reading System smoke failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Reading System smoke passed: 3 representative Chinese article shapes use v1 and the representative English article uses the scoped v1-en monochrome reading shell.");
