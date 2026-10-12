-- QuellenKlar – Testdaten für die lokale Entwicklung
-- Ausschließlich fiktive Daten. Keine personenbezogenen Echtdaten.
-- Anmeldung lokal: demo@example.org / Demo-Passwort-2026 (nur lokale Supabase-Instanz!)

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'demo@example.org',
  extensions.crypt('Demo-Passwort-2026', extensions.gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()
) on conflict (id) do nothing;

update public.users
   set display_name = 'Demo-Konto', ai_consent_at = now(), onboarding_completed_at = now()
 where id = '00000000-0000-4000-8000-000000000001';

-- Pro-Abo für Demozwecke
insert into public.subscriptions
  (user_id, plan, status, store, product_id, billing_period, current_period_start, current_period_end)
values
  ('00000000-0000-4000-8000-000000000001', 'pro', 'active', 'promotional', 'demo_pro',
   'monthly', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month');

-- Projekt 1: Baudokumentation
insert into public.projects (id, owner_id, name, category, status)
values ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001',
        'Mängelliste Rohbau Musterstraße 12', 'construction', 'in_review');

insert into public.document_metadata
  (project_id, title, short_title, purpose, recipient, version_label, edited_on)
values ('10000000-0000-4000-8000-000000000001',
        'Mängelliste Rohbau – Musterstraße 12, 12345 Musterstadt',
        'Mängelliste Rohbau',
        'Dokumentation festgestellter Mängel zur Abstimmung mit der Bauleitung.',
        'Bauleitung Muster Bau GmbH (fiktiv)',
        '1.2', '2026-10-05');

insert into public.content_sections (id, project_id, part, position, heading, body)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'introduction', 0,
   'Anlass und Umfang',
   'Die Begehung fand am 28.09.2026 statt. Erfasst wurden sichtbare Mängel im Erdgeschoss und ersten Obergeschoss.'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'summary', 0,
   'Zusammenfassung',
   'Es wurden drei Mängel erfasst, davon einer mit hoher Priorität.');

insert into public.table_definitions (id, project_id, table_no, caption, columns)
values ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 1,
        'Festgestellte Mängel',
        '["row_no","category","date_period","topic","description","status_result","source_ref","remarks","priority","deadline"]');

insert into public.table_rows (id, project_id, table_id, position, "values")
values
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   '30000000-0000-4000-8000-000000000001', 0,
   '{"category":"Mauerwerk","date_period":"28.09.2026","topic":"Riss Innenwand EG","description":"Diagonaler Riss, ca. 40 cm, Wand zwischen Flur und Küche.","status_result":"offen","priority":"hoch","deadline":"15.10.2026"}'),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001',
   '30000000-0000-4000-8000-000000000001', 1,
   '{"category":"Abdichtung","date_period":"28.09.2026","topic":"Feuchtestelle Kellerwand","description":"Dunkle Verfärbung an der Nordwand.","status_result":"in Klärung","priority":"mittel"}'),
  ('40000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001',
   '30000000-0000-4000-8000-000000000001', 2,
   '{"category":"Fenster","date_period":"","topic":"Anschlussfuge Fenster OG","description":"Fuge nicht vollständig geschlossen.","status_result":"offen","priority":"niedrig"}');

-- Quellen: Codes Q01–Q03 vergibt der Trigger automatisch.
insert into public.sources (id, project_id, author_institution, title, document_type, date_or_year, file_or_location, page_section)
values ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
        'Muster Bau GmbH (fiktiv)', 'Begehungsprotokoll vom 28.09.2026', 'Protokoll', '2026',
        'Begehungsprotokoll_2026-09-28.pdf', 'S. 2');
insert into public.sources (id, project_id, author_institution, title, document_type, date_or_year, url, retrieved_on)
values ('50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001',
        'Beispiel-Fachverband (fiktiv)', 'Merkblatt Rissbewertung im Mauerwerk', 'Merkblatt', '2024',
        'https://example.org/merkblatt-rissbewertung', '2026-10-01');
insert into public.sources (id, project_id, title, document_type, file_or_location)
values ('50000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001',
        'Fotodokumentation Kellergeschoss', 'Fotoserie', 'Fotos_KG_2026-09-28.zip');

insert into public.row_source_links (project_id, row_id, source_id) values
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000003');

-- Anlage A01 (Datei liegt lokal nicht vor → Status „pending“, erzeugt später einen Prüfpunkt)
insert into public.attachments (id, project_id, original_file_name, mime_type, size_bytes, description, document_date)
values ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
        'Begehungsprotokoll_2026-09-28.pdf', 'application/pdf', 248311,
        'Unterschriebenes Begehungsprotokoll', '2026-09-28');

insert into public.attachment_links (project_id, attachment_id, source_id)
values ('10000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001',
        '50000000-0000-4000-8000-000000000001');

insert into public.open_checks (project_id, target_kind, target_id, description, severity)
values
  ('10000000-0000-4000-8000-000000000001', 'table_row', '40000000-0000-4000-8000-000000000003',
   'Datum der Feststellung fehlt', 'warning'),
  ('10000000-0000-4000-8000-000000000001', 'table_row', '40000000-0000-4000-8000-000000000003',
   'Keine Quelle zugeordnet', 'warning');

-- Verbrauch im laufenden Monat
insert into public.usage_credits (user_id, kind, delta) values
  ('00000000-0000-4000-8000-000000000001', 'docx_export', -1),
  ('00000000-0000-4000-8000-000000000001', 'full_review', -3);
insert into public.usage_credits (user_id, kind, delta, from_addon, store_transaction_id) values
  ('00000000-0000-4000-8000-000000000001', 'addon_purchase', 10, true, 'demo-tx-0001');

-- Projekt 2: Verwaltungsvorgang
insert into public.projects (id, owner_id, name, category, status)
values ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001',
        'Fristenübersicht Vereinsförderung 2027', 'association', 'draft');
insert into public.document_metadata (project_id, title, short_title, version_label, edited_on)
values ('10000000-0000-4000-8000-000000000002',
        'Fristenübersicht Förderantrag Sportverein Musterstadt e. V. (fiktiv)',
        'Fristen Förderung 2027', '0.1', '2026-10-12');
