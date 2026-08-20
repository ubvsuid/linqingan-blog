-- Final part of the 2026-08-20 production schema baseline: indexes and views.

CREATE INDEX search_queries_created_at_idx ON public.search_queries USING btree (created_at DESC);
CREATE INDEX search_queries_normalized_trgm_idx ON public.search_queries USING gin (normalized_query gin_trgm_ops);
CREATE INDEX search_queries_zero_result_idx ON public.search_queries USING btree (created_at DESC) WHERE (result_count = 0);
CREATE INDEX search_documents_fts_idx ON public.search_documents USING gin (to_tsvector('simple'::regconfig, ((((COALESCE(title, ''::text) || ' '::text) || COALESCE(description, ''::text)) || ' '::text) || COALESCE(search_text, ''::text))));
CREATE UNIQUE INDEX search_documents_language_href_uidx ON public.search_documents USING btree (language, href);
CREATE INDEX search_documents_search_text_trgm_idx ON public.search_documents USING gin (search_text gin_trgm_ops);
CREATE INDEX search_documents_title_trgm_idx ON public.search_documents USING gin (title gin_trgm_ops);
CREATE INDEX search_documents_type_language_idx ON public.search_documents USING btree (type, language);
CREATE INDEX article_feedback_article_idx ON public.article_feedback USING btree (article_slug, language, created_at DESC);
CREATE INDEX tool_events_tool_created_idx ON public.tool_events USING btree (tool_id, created_at DESC);
CREATE INDEX verification_evidence_article_idx ON public.verification_evidence USING btree (article_slug, verified_at DESC);
CREATE UNIQUE INDEX verification_evidence_identity_uidx ON public.verification_evidence USING btree (article_slug, verification_type, api_name, source_ref, COALESCE(game_time, ('-1'::integer)::bigint), COALESCE(tick_start, ('-1'::integer)::bigint), COALESCE(tick_end, ('-1'::integer)::bigint));
CREATE UNIQUE INDEX verification_evidence_key_uidx ON public.verification_evidence USING btree (evidence_key);
CREATE INDEX verification_evidence_public_article_idx ON public.verification_evidence USING btree (article_slug, verified_at DESC) WHERE (status = 'accepted'::text);
CREATE INDEX verification_evidence_status_idx ON public.verification_evidence USING btree (status, verified_at DESC);
CREATE INDEX verification_evidence_type_idx ON public.verification_evidence USING btree (verification_type, verified_at DESC);
CREATE INDEX site_intelligence_actions_asset_idx ON public.site_intelligence_actions USING btree (asset_id, updated_at DESC);
CREATE INDEX site_intelligence_actions_due_idx ON public.site_intelligence_actions USING btree (due_at) WHERE ((status = ANY (ARRAY['open'::text, 'in_progress'::text])) AND (due_at IS NOT NULL));
CREATE INDEX site_intelligence_actions_parent_idx ON public.site_intelligence_actions USING btree (parent_action_id) WHERE (parent_action_id IS NOT NULL);
CREATE INDEX site_intelligence_actions_status_priority_idx ON public.site_intelligence_actions USING btree (status, priority, last_seen_at DESC);
CREATE INDEX site_intelligence_actions_superseded_by_idx ON public.site_intelligence_actions USING btree (superseded_by_action_id) WHERE (superseded_by_action_id IS NOT NULL);
CREATE INDEX site_intelligence_import_runs_fingerprint_idx ON public.site_intelligence_import_runs USING btree (input_fingerprint) WHERE (input_fingerprint IS NOT NULL);
CREATE INDEX site_intelligence_import_runs_source_started_idx ON public.site_intelligence_import_runs USING btree (source, started_at DESC);
CREATE INDEX site_intelligence_import_runs_status_idx ON public.site_intelligence_import_runs USING btree (status, started_at DESC);
CREATE INDEX search_clicks_created_at_idx ON public.search_clicks USING btree (created_at DESC);
CREATE INDEX search_clicks_result_href_idx ON public.search_clicks USING btree (result_href);
CREATE INDEX site_intelligence_action_events_action_created_idx ON public.site_intelligence_action_events USING btree (action_id, created_at DESC);
CREATE INDEX site_intelligence_action_links_to_idx ON public.site_intelligence_action_links USING btree (to_action_id, relationship_type);
CREATE INDEX site_intelligence_data_quality_asset_idx ON public.site_intelligence_data_quality_issues USING btree (asset_id, last_seen_at DESC) WHERE (asset_id IS NOT NULL);
CREATE INDEX site_intelligence_data_quality_import_idx ON public.site_intelligence_data_quality_issues USING btree (last_import_id) WHERE (last_import_id IS NOT NULL);
CREATE INDEX site_intelligence_data_quality_status_idx ON public.site_intelligence_data_quality_issues USING btree (status, severity, last_seen_at DESC);
CREATE INDEX site_intelligence_gsc_asset_period_idx ON public.site_intelligence_gsc_observations USING btree (asset_id, period_end DESC) WHERE (asset_id IS NOT NULL);
CREATE INDEX site_intelligence_gsc_fingerprint_idx ON public.site_intelligence_gsc_observations USING btree (row_fingerprint);
CREATE INDEX site_intelligence_gsc_import_idx ON public.site_intelligence_gsc_observations USING btree (source_import_id);
CREATE INDEX site_intelligence_gsc_owner_status_idx ON public.site_intelligence_gsc_observations USING btree (owner_status, period_end DESC);
CREATE INDEX site_intelligence_gsc_page_period_idx ON public.site_intelligence_gsc_observations USING btree (page_path, period_end DESC);
CREATE INDEX site_intelligence_gsc_query_period_idx ON public.site_intelligence_gsc_observations USING btree (query, period_end DESC) WHERE (query <> ''::text);
CREATE INDEX site_intelligence_relationships_from_idx ON public.site_intelligence_relationships USING btree (from_kind, from_key, status);
CREATE INDEX site_intelligence_relationships_import_idx ON public.site_intelligence_relationships USING btree (source_import_id) WHERE (source_import_id IS NOT NULL);
CREATE INDEX site_intelligence_relationships_to_idx ON public.site_intelligence_relationships USING btree (to_kind, to_key, status);
CREATE INDEX site_intelligence_relationships_type_idx ON public.site_intelligence_relationships USING btree (relationship_type, status);
CREATE INDEX site_intelligence_snapshots_type_generated_idx ON public.site_intelligence_snapshots USING btree (snapshot_type, generated_at DESC);

CREATE VIEW public.verification_evidence_public AS
 SELECT id, evidence_key, article_slug, language, verification_type, game_time, shard, room_name, api_name, return_code, tick_start, tick_end, evidence_note, verified_at
 FROM verification_evidence
 WHERE status = 'accepted'::text;

CREATE VIEW public.site_intelligence_action_operating_view AS
 SELECT action_id, asset_id, path, category, recommended_action, priority, status, first_seen_at, last_seen_at, started_at, completed_at, review_after, action_taken, rejection_reason, before_metrics, after_metrics, result, source_signal_ids, metadata, updated_at, due_at, parent_action_id, superseded_by_action_id,
 floor(EXTRACT(epoch FROM now() - first_seen_at) / 86400::numeric)::integer AS aging_days,
 CASE
   WHEN status <> ALL (ARRAY['open'::text, 'in_progress'::text]) THEN 'closed'::text
   WHEN due_at IS NOT NULL AND due_at < now() THEN 'overdue'::text
   WHEN due_at IS NOT NULL THEN 'scheduled'::text
   WHEN priority = 'P0'::text AND first_seen_at <= (now() - '7 days'::interval) THEN 'aging'::text
   WHEN priority = 'P1'::text AND first_seen_at <= (now() - '21 days'::interval) THEN 'aging'::text
   WHEN priority = 'P2'::text AND first_seen_at <= (now() - '45 days'::interval) THEN 'aging'::text
   ELSE 'on_track'::text
 END AS aging_state,
 status = 'done'::text AND result IS NULL AND review_after IS NOT NULL AND review_after <= now() AS review_due
 FROM site_intelligence_actions a;

CREATE VIEW public.site_intelligence_gsc_period_summary AS
 SELECT period_start, period_end,
 count(*) AS observation_rows,
 count(*) FILTER (WHERE asset_id IS NOT NULL) AS mapped_rows,
 count(*) FILTER (WHERE owner_status = 'mismatch'::text) AS owner_mismatch_rows,
 sum(clicks)::bigint AS clicks,
 sum(impressions)::bigint AS impressions,
 CASE WHEN sum(impressions) > 0::numeric THEN sum(clicks) / sum(impressions) ELSE 0::numeric END AS ctr,
 CASE WHEN sum(impressions) > 0::numeric THEN sum(COALESCE("position", 0::numeric) * impressions::numeric) / sum(impressions) ELSE NULL::numeric END AS impression_weighted_position
 FROM site_intelligence_gsc_observations
 GROUP BY period_start, period_end;
