const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const failures = [];

async function postJson(pathname, body) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Anonymous-Id": "smoke-anonymous",
      "X-Session-Id": "smoke-session",
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
if (![200, 202].includes(feedback.response.status)) {
  failures.push(`/api/article-feedback valid payload returned ${feedback.response.status}`);
}
if (typeof feedback.payload?.stored !== "boolean") {
  failures.push("/api/article-feedback valid payload must return stored boolean");
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
if (![200, 202].includes(toolEvent.response.status)) {
  failures.push(`/api/tool-event valid payload returned ${toolEvent.response.status}`);
}
if (typeof toolEvent.payload?.stored !== "boolean") {
  failures.push("/api/tool-event valid payload must return stored boolean");
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
  "Phase 2 platform data smoke passed: anonymous article feedback and tool-event APIs accept bounded enums, reject invalid payloads, and degrade safely when DATABASE_URL is unavailable.",
);
