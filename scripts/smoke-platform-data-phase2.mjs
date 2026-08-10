const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const failures = [];

async function postJson(pathname, body) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Anonymous-Id": "smoke-anonymous",
      "X-Session-Id": "smoke-session",
      "X-Platform-Smoke-Test": "1",
    },
    body: JSON.stringify(body),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {}

  return { response, payload };
}

const feedback = await postJson("/api/article-feedback", {
  slug: "screeps-store-capacity-api",
  language: "zh-CN",
  value: "helpful",
});
if (feedback.response.status !== 202) {
  failures.push(`/api/article-feedback local smoke payload returned ${feedback.response.status}`);
}
if (feedback.payload?.stored !== false || feedback.payload?.smoke !== true) {
  failures.push("/api/article-feedback local smoke must validate without persisting");
}

const invalidFeedback = await postJson("/api/article-feedback", {
  slug: "screeps-store-capacity-api",
  language: "zh-CN",
  value: "free-form-text",
});
if (invalidFeedback.response.status !== 400) {
  failures.push(`/api/article-feedback invalid enum returned ${invalidFeedback.response.status}`);
}

const toolEvent = await postJson("/api/tool-event", {
  toolId: "controller-downgrade-planner",
  action: "use",
  sourcePath: "/blog/screeps-controller-downgrade",
});
if (toolEvent.response.status !== 202) {
  failures.push(`/api/tool-event local smoke payload returned ${toolEvent.response.status}`);
}
if (toolEvent.payload?.stored !== false || toolEvent.payload?.smoke !== true) {
  failures.push("/api/tool-event local smoke must validate without persisting");
}

const invalidToolEvent = await postJson("/api/tool-event", {
  toolId: "unknown-tool",
  action: "use",
  sourcePath: "/tools",
});
if (invalidToolEvent.response.status !== 400) {
  failures.push(`/api/tool-event unknown tool returned ${invalidToolEvent.response.status}`);
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`Phase 2 platform data smoke failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  "Phase 2 platform data smoke passed: bounded feedback/tool payloads are validated locally without writing to Neon, and invalid payloads are rejected.",
);
