import { createIsolatedNeon } from "./lib/database-environment-isolation.mjs";

const args = process.argv.slice(2);
function argValue(name, fallback = null) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] ?? fallback : fallback; }
function flag(name) { return args.includes(name); }
const VALID_TYPES = new Set(["related", "blocks", "duplicate_of", "follow_up"]);

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const fromActionId = argValue("--from-action-id");
const toActionId = argValue("--to-action-id");
const relationshipType = argValue("--type", "related");
const note = argValue("--note");
const remove = flag("--remove");
if (!fromActionId || !toActionId) throw new Error("--from-action-id and --to-action-id are required.");
if (fromActionId === toActionId) throw new Error("An action cannot link to itself.");
if (!VALID_TYPES.has(relationshipType)) throw new Error(`Invalid relationship type: ${relationshipType}`);

const sql = createIsolatedNeon(databaseUrl);
const existing = await sql`SELECT action_id FROM site_intelligence_actions WHERE action_id IN (${fromActionId}, ${toActionId});`;
if (existing.length !== 2) throw new Error("Both action IDs must exist before creating a link.");

if (remove) {
  await sql`DELETE FROM site_intelligence_action_links WHERE from_action_id=${fromActionId} AND relationship_type=${relationshipType} AND to_action_id=${toActionId};`;
  if (relationshipType === "related") await sql`DELETE FROM site_intelligence_action_links WHERE from_action_id=${toActionId} AND relationship_type='related' AND to_action_id=${fromActionId};`;
} else {
  await sql`
    INSERT INTO site_intelligence_action_links (from_action_id, relationship_type, to_action_id, note)
    VALUES (${fromActionId}, ${relationshipType}, ${toActionId}, ${note})
    ON CONFLICT (from_action_id, relationship_type, to_action_id) DO UPDATE SET note=EXCLUDED.note;
  `;
  if (relationshipType === "related") {
    await sql`
      INSERT INTO site_intelligence_action_links (from_action_id, relationship_type, to_action_id, note)
      VALUES (${toActionId}, 'related', ${fromActionId}, ${note})
      ON CONFLICT (from_action_id, relationship_type, to_action_id) DO UPDATE SET note=EXCLUDED.note;
    `;
  }
}
await sql`
  INSERT INTO site_intelligence_action_events (action_id,event_type,from_status,to_status,note,metrics,metadata)
  SELECT action_id,'relationship_change',status,status,${note},'{}'::jsonb,
         ${JSON.stringify({ operation: remove ? "remove" : "add", relationshipType, otherActionId: toActionId })}::jsonb
  FROM site_intelligence_actions WHERE action_id=${fromActionId};
`;
console.log(`${remove ? "Removed" : "Added"} ${relationshipType}: ${fromActionId} -> ${toActionId}`);
