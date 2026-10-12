-- QuellenKlar – Kernschema
-- Normalisiertes Datenmodell (Spezifikation Abschnitt 14).
-- Konventionen: UUID-Primärschlüssel, created_at/updated_at, Soft-Delete nur dort,
-- wo Wiederherstellung sinnvoll ist (Projekte, Tabellenzeilen, Quellen, Anlagen).

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Hilfsfunktionen
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Aufzählungstypen
-- ---------------------------------------------------------------------------

create type public.plan_id as enum ('free', 'pro', 'business');
create type public.project_status as enum ('draft', 'in_review', 'ready', 'exported', 'archived');
create type public.project_category as enum (
  'general', 'construction', 'administration', 'private', 'association', 'education'
);
create type public.page_orientation as enum ('portrait', 'landscape');
create type public.review_type as enum ('language', 'language_consistency', 'full');
create type public.review_status as enum ('pending', 'running', 'succeeded', 'failed');
create type public.change_category as enum (
  'language_fix', 'spelling_unification', 'missing_value', 'contradiction',
  'source_mapping', 'duplicate', 'open_check'
);
create type public.change_decision as enum ('pending', 'accepted', 'rejected');
create type public.target_kind as enum ('section', 'table_row', 'source', 'attachment', 'metadata');
create type public.check_severity as enum ('info', 'warning', 'error');
create type public.check_status as enum ('open', 'acknowledged', 'resolved');
create type public.upload_status as enum ('pending', 'uploading', 'scanning', 'available', 'failed', 'rejected');
create type public.export_status as enum ('pending', 'completed', 'failed');
create type public.subscription_status as enum ('active', 'in_grace_period', 'cancelled', 'expired', 'billing_issue');
create type public.store_platform as enum ('app_store', 'play_store', 'promotional');
create type public.usage_kind as enum ('full_review', 'docx_export', 'addon_purchase', 'manual_adjustment');

-- ---------------------------------------------------------------------------
-- Tarifkonfiguration (Remote-Konfiguration, serverseitig änderbar)
-- ---------------------------------------------------------------------------

create table public.plan_config (
  plan public.plan_id primary key,
  display_name text not null,
  price_monthly_eur numeric(8, 2) not null check (price_monthly_eur >= 0),
  price_yearly_eur numeric(8, 2) check (price_yearly_eur >= 0),
  -- null = keine feste Obergrenze (faire technische Nutzung, siehe fair_use_*).
  max_active_projects integer check (max_active_projects > 0),
  monthly_docx_exports integer check (monthly_docx_exports > 0),
  -- KI-Kontingente sind immer konkret begrenzt.
  monthly_full_reviews integer not null check (monthly_full_reviews >= 0),
  max_attachment_bytes bigint not null check (max_attachment_bytes > 0),
  custom_branding boolean not null default false,
  extended_templates boolean not null default false,
  priority_processing boolean not null default false,
  fair_use_active_projects integer not null default 500,
  fair_use_monthly_exports integer not null default 1000,
  updated_at timestamptz not null default now()
);

insert into public.plan_config
  (plan, display_name, price_monthly_eur, price_yearly_eur, max_active_projects,
   monthly_docx_exports, monthly_full_reviews, max_attachment_bytes,
   custom_branding, extended_templates, priority_processing)
values
  ('free',     'Kostenlos', 0.00,  null,   1,    2,    1,  10485760,  false, false, false),
  ('pro',      'Pro',       7.99,  69.99,  null, null, 20, 26214400,  false, false, false),
  ('business', 'Business',  14.99, 139.99, null, null, 60, 104857600, true,  true,  true);

create trigger plan_config_updated_at before update on public.plan_config
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- users – App-Profil zu auth.users (1:1). Löschen des Kontos löscht alles kaskadierend.
-- ---------------------------------------------------------------------------

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 120),
  locale text not null default 'de-DE',
  -- Einwilligung in die KI-Verarbeitung (Abschnitt 16); null = keine Einwilligung.
  ai_consent_at timestamptz,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- subscriptions – wird ausschließlich serverseitig (Store-Webhooks/RevenueCat) geschrieben.
-- ---------------------------------------------------------------------------

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  plan public.plan_id not null,
  status public.subscription_status not null,
  store public.store_platform not null,
  product_id text not null,
  billing_period text not null check (billing_period in ('monthly', 'yearly', 'none')),
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  will_renew boolean not null default true,
  external_customer_id text,
  original_transaction_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (current_period_end > current_period_start)
);

create index subscriptions_user_idx on public.subscriptions (user_id, status);
create unique index subscriptions_original_tx_uq on public.subscriptions (store, original_transaction_id)
  where original_transaction_id is not null;

create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Aktueller Tarif eines Nutzers: höchster aktiver Tarif, sonst „free“.
create or replace function public.current_plan(p_user_id uuid)
returns public.plan_id
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select s.plan
       from public.subscriptions s
      where s.user_id = p_user_id
        and s.status in ('active', 'in_grace_period', 'cancelled')
        and now() < s.current_period_end
      order by case s.plan when 'business' then 3 when 'pro' then 2 else 1 end desc
      limit 1),
    'free'::public.plan_id
  );
$$;

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  category public.project_category not null default 'general',
  status public.project_status not null default 'draft',
  -- Zähler für stabile IDs: höchster jemals vergebener Wert, wird nie zurückgesetzt.
  next_source_seq integer not null default 0 check (next_source_seq >= 0),
  next_attachment_seq integer not null default 0 check (next_attachment_seq >= 0),
  -- Optimistische Nebenläufigkeitskontrolle für die Synchronisierung (Abschnitt 17).
  revision integer not null default 1,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_owner_idx on public.projects (owner_id, updated_at desc) where deleted_at is null;

create or replace function public.bump_revision()
returns trigger
language plpgsql
as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;

create trigger projects_revision before update on public.projects
  for each row execute function public.bump_revision();

-- Serverseitige Durchsetzung „aktive Projekte je Tarif“ (Abschnitt 15).
create or replace function public.enforce_active_project_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan public.plan_id;
  v_limit integer;
  v_fair_use integer;
  v_active integer;
begin
  -- Prüfen bei Neuanlage und beim Reaktivieren (Archiv/Papierkorb → aktiv).
  if tg_op = 'UPDATE' and not (
       (old.archived_at is not null or old.deleted_at is not null)
       and new.archived_at is null and new.deleted_at is null) then
    return new;
  end if;
  if new.archived_at is not null or new.deleted_at is not null then
    return new;
  end if;

  v_plan := public.current_plan(new.owner_id);
  select max_active_projects, fair_use_active_projects into v_limit, v_fair_use
    from public.plan_config where plan = v_plan;

  select count(*) into v_active
    from public.projects
   where owner_id = new.owner_id
     and archived_at is null
     and deleted_at is null
     and id <> new.id;

  if v_active >= coalesce(v_limit, v_fair_use) then
    raise exception using
      errcode = 'P0001',
      message = 'quota_active_projects',
      detail = format('Tarif %s erlaubt %s aktive Projekte.', v_plan, coalesce(v_limit, v_fair_use));
  end if;
  return new;
end;
$$;

create trigger projects_active_limit before insert or update of archived_at, deleted_at on public.projects
  for each row execute function public.enforce_active_project_limit();

-- ---------------------------------------------------------------------------
-- document_metadata – Grunddaten und Gestaltung (1:1 zu projects)
-- ---------------------------------------------------------------------------

create table public.document_metadata (
  project_id uuid primary key references public.projects (id) on delete cascade,
  title text not null default '' check (char_length(title) <= 200),
  short_title text not null default '' check (char_length(short_title) <= 60),
  purpose text check (char_length(purpose) <= 1000),
  recipient text check (char_length(recipient) <= 300),
  version_label text not null default '1.0' check (char_length(version_label) <= 20),
  edited_on date not null default current_date,
  template_key text not null default 'standard',
  accent_color text check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  main_table_orientation public.page_orientation not null default 'landscape',
  sources_orientation public.page_orientation not null default 'portrait',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger document_metadata_updated_at before update on public.document_metadata
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- content_sections – Einleitung, Erläuterungen, Zusammenfassung
-- ---------------------------------------------------------------------------

create table public.content_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  part text not null check (part in ('introduction', 'summary', 'custom')),
  position integer not null check (position >= 0),
  heading text not null default '' check (char_length(heading) <= 200),
  body text not null default '',
  -- Originalfassung vor KI-Überarbeitung bleibt bis zum Export nachvollziehbar.
  original_body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, project_id)
);

create index content_sections_project_idx on public.content_sections (project_id, part, position);

create trigger content_sections_updated_at before update on public.content_sections
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- table_definitions / table_rows – Hauptübersicht
-- ---------------------------------------------------------------------------

create table public.table_definitions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  table_no integer not null check (table_no >= 1),
  caption text not null default 'Hauptübersicht' check (char_length(caption) <= 200),
  -- Geordnete Liste aktivierter Spaltenschlüssel, z. B. ["row_no","category",…].
  columns jsonb not null default '["row_no","category","date_period","topic","description","status_result","source_ref","remarks"]'::jsonb
    check (jsonb_typeof(columns) = 'array' and jsonb_array_length(columns) between 1 and 17),
  orientation public.page_orientation not null default 'landscape',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, table_no),
  unique (id, project_id)
);

create trigger table_definitions_updated_at before update on public.table_definitions
  for each row execute function public.set_updated_at();

create table public.table_rows (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  table_id uuid not null,
  position integer not null check (position >= 0),
  "values" jsonb not null default '{}'::jsonb check (jsonb_typeof("values") = 'object'),
  original_values jsonb check (original_values is null or jsonb_typeof(original_values) = 'object'),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (table_id, project_id) references public.table_definitions (id, project_id) on delete cascade,
  unique (id, project_id)
);

create index table_rows_table_idx on public.table_rows (table_id, position) where deleted_at is null;

create trigger table_rows_updated_at before update on public.table_rows
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sources – Quellenverzeichnis mit stabilen IDs (Q01 …)
-- ---------------------------------------------------------------------------

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  source_code text not null check (source_code ~ '^Q[0-9]{2,}$'),
  author_institution text check (char_length(author_institution) <= 300),
  title text not null check (char_length(btrim(title)) between 1 and 500),
  document_type text check (char_length(document_type) <= 100),
  date_or_year text check (char_length(date_or_year) <= 50),
  file_or_location text check (char_length(file_or_location) <= 500),
  url text check (url ~* '^https?://'),
  retrieved_on date,
  page_section text check (char_length(page_section) <= 100),
  note text check (char_length(note) <= 2000),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Projektbezogen eindeutig – auch gelöschte Quellen behalten ihre ID.
  unique (project_id, source_code),
  unique (id, project_id)
);

create trigger sources_updated_at before update on public.sources
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- attachments – Anlagen mit stabilen IDs (A01 …)
-- ---------------------------------------------------------------------------

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  attachment_code text not null check (attachment_code ~ '^A[0-9]{2,}$'),
  original_file_name text not null check (char_length(original_file_name) between 1 and 255),
  storage_path text,
  mime_type text not null check (mime_type in (
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv', 'text/plain', 'image/jpeg', 'image/png'
  )),
  size_bytes bigint not null check (size_bytes > 0),
  description text check (char_length(description) <= 1000),
  document_date date,
  upload_status public.upload_status not null default 'pending',
  -- Einwilligung, diese Datei an die KI zu übertragen (Abschnitt 6.6).
  ai_processing_allowed boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, attachment_code),
  unique (id, project_id)
);

create trigger attachments_updated_at before update on public.attachments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Stabile ID-Vergabe per Trigger: atomar über Zeilensperre auf dem Projekt.
-- ---------------------------------------------------------------------------

create or replace function public.assign_stable_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seq integer;
begin
  if tg_table_name = 'sources' then
    update public.projects set next_source_seq = next_source_seq + 1
     where id = new.project_id
     returning next_source_seq into v_seq;
    new.source_code := 'Q' || lpad(v_seq::text, 2, '0');
  else
    update public.projects set next_attachment_seq = next_attachment_seq + 1
     where id = new.project_id
     returning next_attachment_seq into v_seq;
    new.attachment_code := 'A' || lpad(v_seq::text, 2, '0');
  end if;
  if v_seq is null then
    raise exception 'Projekt % nicht gefunden', new.project_id;
  end if;
  return new;
end;
$$;

create trigger sources_assign_code before insert on public.sources
  for each row execute function public.assign_stable_code();
create trigger attachments_assign_code before insert on public.attachments
  for each row execute function public.assign_stable_code();

-- IDs und Projektzuordnung sind nach der Vergabe unveränderlich.
create or replace function public.protect_stable_code()
returns trigger
language plpgsql
as $$
begin
  if new.project_id <> old.project_id then
    raise exception 'Die Projektzuordnung kann nicht geändert werden.';
  end if;
  if tg_table_name = 'sources' and new.source_code <> old.source_code then
    raise exception 'Quellen-IDs sind unveränderlich.';
  end if;
  if tg_table_name = 'attachments' and new.attachment_code <> old.attachment_code then
    raise exception 'Anlagen-IDs sind unveränderlich.';
  end if;
  return new;
end;
$$;

create trigger sources_protect_code before update on public.sources
  for each row execute function public.protect_stable_code();
create trigger attachments_protect_code before update on public.attachments
  for each row execute function public.protect_stable_code();

-- ---------------------------------------------------------------------------
-- Verknüpfungen (n:m). Zusammengesetzte Fremdschlüssel verhindern projektübergreifende Links.
-- ---------------------------------------------------------------------------

create table public.row_source_links (
  project_id uuid not null,
  row_id uuid not null,
  source_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (row_id, source_id),
  foreign key (row_id, project_id) references public.table_rows (id, project_id) on delete cascade,
  foreign key (source_id, project_id) references public.sources (id, project_id) on delete cascade
);

create index row_source_links_source_idx on public.row_source_links (source_id);

create table public.attachment_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  attachment_id uuid not null,
  row_id uuid,
  section_id uuid,
  source_id uuid,
  created_at timestamptz not null default now(),
  foreign key (attachment_id, project_id) references public.attachments (id, project_id) on delete cascade,
  foreign key (row_id, project_id) references public.table_rows (id, project_id) on delete cascade,
  foreign key (section_id, project_id) references public.content_sections (id, project_id) on delete cascade,
  foreign key (source_id, project_id) references public.sources (id, project_id) on delete cascade,
  check (num_nonnulls(row_id, section_id, source_id) = 1)
);

create index attachment_links_attachment_idx on public.attachment_links (attachment_id);
create unique index attachment_links_uq on public.attachment_links
  (attachment_id, coalesce(row_id, section_id, source_id));

-- ---------------------------------------------------------------------------
-- review_runs / review_changes / open_checks – Prüfzentrum
-- ---------------------------------------------------------------------------

create table public.review_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  review_type public.review_type not null,
  status public.review_status not null default 'pending',
  model text,
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  repair_attempted boolean not null default false,
  error_code text,
  summary text,
  quality_report jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, project_id)
);

create index review_runs_project_idx on public.review_runs (project_id, created_at desc);

create trigger review_runs_updated_at before update on public.review_runs
  for each row execute function public.set_updated_at();

create table public.review_changes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  review_run_id uuid not null,
  category public.change_category not null,
  target_kind public.target_kind not null,
  target_id text not null,
  field text,
  original text not null,
  proposed text not null,
  reason text not null,
  is_content_change boolean not null,
  decision public.change_decision not null default 'pending',
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (review_run_id, project_id) references public.review_runs (id, project_id) on delete cascade,
  check ((decision = 'pending') = (decided_at is null))
);

create index review_changes_run_idx on public.review_changes (review_run_id, category);

create trigger review_changes_updated_at before update on public.review_changes
  for each row execute function public.set_updated_at();

create table public.open_checks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  review_run_id uuid references public.review_runs (id) on delete set null,
  target_kind public.target_kind not null,
  target_id text not null,
  description text not null check (char_length(btrim(description)) between 1 and 300),
  severity public.check_severity not null default 'warning',
  status public.check_status not null default 'open',
  -- Prüfpunkte werden nie automatisch aufgelöst: Auflösung nur mit Nutzerzeitstempel.
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'resolved') = (resolved_at is not null))
);

create index open_checks_project_idx on public.open_checks (project_id, status);

create trigger open_checks_updated_at before update on public.open_checks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- exports – Exporthistorie
-- ---------------------------------------------------------------------------

create table public.exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  version_label text not null,
  file_name text not null check (file_name ~* '\.docx$'),
  storage_path text,
  size_bytes bigint check (size_bytes > 0),
  status public.export_status not null default 'pending',
  quality_report jsonb,
  open_checks_count integer not null default 0 check (open_checks_count >= 0),
  open_checks_acknowledged boolean not null default false,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  -- Keine vorhandene Exportdatei stillschweigend überschreiben (Abschnitt 13).
  unique (project_id, file_name),
  -- „Erfolgreich“ nur mit gespeicherter Datei (Abschnitt 17).
  check (status <> 'completed' or (storage_path is not null and size_bytes is not null and completed_at is not null)),
  check (open_checks_count = 0 or open_checks_acknowledged or status <> 'completed')
);

create index exports_project_idx on public.exports (project_id, created_at desc);

-- ---------------------------------------------------------------------------
-- usage_credits – Verbrauchsbuch (Ledger) für Kontingente
-- delta < 0 = Verbrauch, delta > 0 = Gutschrift (Zusatzpaket, Korrektur)
-- ---------------------------------------------------------------------------

create table public.usage_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  kind public.usage_kind not null,
  delta integer not null check (delta <> 0),
  -- Abrechnungsmonat (erster Tag), auf den sich ein Verbrauch bezieht.
  period_start date not null default date_trunc('month', now())::date,
  review_run_id uuid references public.review_runs (id) on delete set null,
  export_id uuid references public.exports (id) on delete set null,
  -- Store-Transaktion bei Zusatzpaketen; verhindert doppelte Gutschrift.
  store_transaction_id text unique,
  -- Zusatzprüfungen aus Paketen werden in diesem Feld gekennzeichnet.
  from_addon boolean not null default false,
  created_at timestamptz not null default now(),
  check (kind <> 'addon_purchase' or (delta > 0 and from_addon))
);

create index usage_credits_user_period_idx on public.usage_credits (user_id, period_start, kind);

-- Aktueller Verbrauch des laufenden Monats inkl. Restguthaben aus Zusatzpaketen.
create or replace view public.usage_current_period
with (security_invoker = true)
as
select
  u.id as user_id,
  date_trunc('month', now())::date as period_start,
  (date_trunc('month', now()) + interval '1 month')::date as resets_on,
  coalesce(sum(-c.delta) filter (
    where c.kind = 'full_review' and not c.from_addon and c.period_start = date_trunc('month', now())::date
  ), 0)::integer as full_reviews_used,
  coalesce(sum(-c.delta) filter (
    where c.kind = 'docx_export' and c.period_start = date_trunc('month', now())::date
  ), 0)::integer as docx_exports_used,
  coalesce(sum(c.delta) filter (where c.from_addon), 0)::integer as addon_reviews_remaining
from public.users u
left join public.usage_credits c on c.user_id = u.id
group by u.id;
