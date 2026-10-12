-- QuellenKlar – Private Storage-Buckets
-- Pfadschema: <user_id>/<project_id>/<datei>
-- Zugriff aus der App nur über kurzlebige signierte URLs; Uploads laufen über das Backend,
-- das Dateityp, Größe (je Tarif) und Malware prüft. Clients dürfen nur lesen und löschen.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('attachments', 'attachments', false, 104857600, array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv', 'text/plain', 'image/jpeg', 'image/png'
  ]),
  ('exports', 'exports', false, 52428800, array[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ])
on conflict (id) do nothing;

create policy storage_read_own on storage.objects for select to authenticated
  using (
    bucket_id in ('attachments', 'exports')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy storage_delete_own on storage.objects for delete to authenticated
  using (
    bucket_id in ('attachments', 'exports')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
