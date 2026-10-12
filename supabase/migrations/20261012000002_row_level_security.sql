-- QuellenKlar – Row-Level-Security
-- Grundsatz: Nutzer sehen und ändern ausschließlich eigene Daten.
-- Tarif-, Verbrauchs-, Prüf- und Exportdaten schreibt nur das Backend (service_role).

-- Prüft, ob das Projekt dem angemeldeten Nutzer gehört (security definer, damit die
-- Prüfung nicht selbst an RLS scheitert; search_path fest gesetzt).
create or replace function public.owns_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
     where p.id = p_project_id
       and p.owner_id = auth.uid()
  );
$$;

revoke all on function public.owns_project(uuid) from public;
grant execute on function public.owns_project(uuid) to authenticated;

revoke all on function public.current_plan(uuid) from public;
grant execute on function public.current_plan(uuid) to authenticated, service_role;

-- RLS auf allen Tabellen aktivieren
alter table public.plan_config enable row level security;
alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.projects enable row level security;
alter table public.document_metadata enable row level security;
alter table public.content_sections enable row level security;
alter table public.table_definitions enable row level security;
alter table public.table_rows enable row level security;
alter table public.sources enable row level security;
alter table public.attachments enable row level security;
alter table public.row_source_links enable row level security;
alter table public.attachment_links enable row level security;
alter table public.review_runs enable row level security;
alter table public.review_changes enable row level security;
alter table public.open_checks enable row level security;
alter table public.exports enable row level security;
alter table public.usage_credits enable row level security;

-- Grundrechte: anon hat keinen Zugriff auf Nutzerdaten.
revoke all on all tables in schema public from anon;
grant select on public.plan_config to anon, authenticated;

grant select, update on public.users to authenticated;
grant select on public.subscriptions to authenticated;
grant select, insert, update, delete on
  public.projects, public.document_metadata, public.content_sections,
  public.table_definitions, public.table_rows, public.sources, public.attachments,
  public.row_source_links, public.attachment_links, public.open_checks
  to authenticated;
grant select on public.review_runs, public.exports, public.usage_credits to authenticated;
grant select, update on public.review_changes to authenticated;
grant select on public.usage_current_period to authenticated;

-- plan_config: öffentlich lesbar (Tarifübersicht), nur Backend schreibt.
create policy plan_config_read on public.plan_config for select using (true);

-- users
create policy users_select_own on public.users for select to authenticated
  using (id = auth.uid());
create policy users_update_own on public.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- subscriptions: nur lesen
create policy subscriptions_select_own on public.subscriptions for select to authenticated
  using (user_id = auth.uid());

-- projects
create policy projects_select_own on public.projects for select to authenticated
  using (owner_id = auth.uid());
create policy projects_insert_own on public.projects for insert to authenticated
  with check (owner_id = auth.uid());
create policy projects_update_own on public.projects for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy projects_delete_own on public.projects for delete to authenticated
  using (owner_id = auth.uid());

-- Zähler für stabile IDs dürfen Clients nicht direkt verändern (nur der Trigger).
revoke update on public.projects from authenticated;
grant update (name, category, status, archived_at, deleted_at) on public.projects to authenticated;

-- Projektbezogene Tabellen: Zugriff über Projektbesitz
do $$
declare
  t text;
begin
  foreach t in array array[
    'document_metadata', 'content_sections', 'table_definitions', 'table_rows',
    'sources', 'attachments', 'row_source_links', 'attachment_links', 'open_checks'
  ]
  loop
    execute format(
      'create policy %1$s_select_own on public.%1$I for select to authenticated using (public.owns_project(project_id));', t);
    execute format(
      'create policy %1$s_insert_own on public.%1$I for insert to authenticated with check (public.owns_project(project_id));', t);
    execute format(
      'create policy %1$s_update_own on public.%1$I for update to authenticated using (public.owns_project(project_id)) with check (public.owns_project(project_id));', t);
    execute format(
      'create policy %1$s_delete_own on public.%1$I for delete to authenticated using (public.owns_project(project_id));', t);
  end loop;
end;
$$;

-- Stabile Codes werden ausschließlich vom Trigger vergeben.
revoke insert, update on public.sources from authenticated;
grant insert (project_id, author_institution, title, document_type, date_or_year, file_or_location,
              url, retrieved_on, page_section, note) on public.sources to authenticated;
grant update (author_institution, title, document_type, date_or_year, file_or_location,
              url, retrieved_on, page_section, note, deleted_at) on public.sources to authenticated;

revoke insert, update on public.attachments from authenticated;
grant insert (project_id, original_file_name, mime_type, size_bytes, description, document_date,
              ai_processing_allowed) on public.attachments to authenticated;
-- storage_path und upload_status setzt nur das Backend nach Typ-, Größen- und Malware-Prüfung.
grant update (description, document_date, ai_processing_allowed, deleted_at)
  on public.attachments to authenticated;

-- review_runs / exports / usage_credits: nur lesen
create policy review_runs_select_own on public.review_runs for select to authenticated
  using (user_id = auth.uid() and public.owns_project(project_id));
create policy exports_select_own on public.exports for select to authenticated
  using (user_id = auth.uid() and public.owns_project(project_id));
create policy usage_credits_select_own on public.usage_credits for select to authenticated
  using (user_id = auth.uid());

-- review_changes: lesen und ausschließlich die Entscheidung setzen
create policy review_changes_select_own on public.review_changes for select to authenticated
  using (public.owns_project(project_id));
create policy review_changes_decide_own on public.review_changes for update to authenticated
  using (public.owns_project(project_id)) with check (public.owns_project(project_id));
revoke update on public.review_changes from authenticated;
grant update (decision, decided_at) on public.review_changes to authenticated;
