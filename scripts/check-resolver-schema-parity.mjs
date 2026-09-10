import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const schema = fs.readFileSync(path.join(root, "src/db/schema.ts"), "utf8");
const migration = fs.readFileSync(path.join(root, "drizzle/0005_resolver_observability.sql"), "utf8");
const failures = [];

function requireSignal(source, signal, message) {
  if (!source.includes(signal)) failures.push(message);
}

requireSignal(
  schema,
  'index("resolver_events_created_at_idx").on(table.createdAt.desc())',
  "Drizzle resolver_events created_at index must match migration DESC ordering.",
);
requireSignal(
  schema,
  'index("resolver_events_event_created_idx").on(table.eventName, table.createdAt.desc())',
  "Drizzle resolver_events event index must match migration DESC ordering.",
);
requireSignal(
  schema,
  'index("resolver_events_flow_created_idx").on(table.flowId, table.createdAt.desc())',
  "Drizzle resolver_events flow index must match migration DESC ordering.",
);
requireSignal(
  schema,
  '.on(table.outcomeId, table.createdAt.desc())',
  "Drizzle resolver_events outcome index must match migration DESC ordering.",
);
requireSignal(
  schema,
  '.where(sql`${table.outcomeId} is not null`)',
  "Drizzle resolver_events outcome index must remain partial when outcome_id is non-null.",
);

for (const signal of [
  "ON public.resolver_events(created_at DESC);",
  "ON public.resolver_events(event_name, created_at DESC);",
  "ON public.resolver_events(flow_id, created_at DESC);",
  "ON public.resolver_events(outcome_id, created_at DESC)",
  "WHERE outcome_id IS NOT NULL;",
]) {
  requireSignal(migration, signal, `Resolver migration index contract missing: ${signal}`);
}

if (failures.length > 0) {
  console.error(`Resolver schema parity check failed:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log("Resolver schema parity check passed: Drizzle index definitions match migration ordering and partial-index semantics.");
