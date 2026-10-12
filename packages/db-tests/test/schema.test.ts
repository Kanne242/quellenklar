import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  asAnon,
  asUser,
  createAuthUser,
  createTestDb,
  DEMO_PROJECT,
  DEMO_USER,
  OTHER_USER,
} from './db';

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb({ seed: true });
  await createAuthUser(db, OTHER_USER, 'andere@example.org');
}, 60_000);

afterAll(async () => {
  await db?.close();
});

const EXPECTED_TABLES = [
  'users',
  'projects',
  'document_metadata',
  'content_sections',
  'table_definitions',
  'table_rows',
  'sources',
  'row_source_links',
  'attachments',
  'attachment_links',
  'review_runs',
  'review_changes',
  'open_checks',
  'exports',
  'subscriptions',
  'usage_credits',
];

describe('Migrationen', () => {
  it('legen alle 16 Tabellen des Datenmodells an', async () => {
    const res = await db.query<{ table_name: string }>(
      `select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'`,
    );
    const names = res.rows.map((r) => r.table_name);
    for (const table of EXPECTED_TABLES) expect(names).toContain(table);
  });

  it('aktivieren RLS auf jeder Tabelle in public', async () => {
    const res = await db.query<{ relname: string }>(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
    );
    expect(res.rows).toEqual([]);
  });

  it('legen beim Registrieren automatisch ein Nutzerprofil an', async () => {
    const res = await db.query('select id from public.users where id = $1', [OTHER_USER]);
    expect(res.rows).toHaveLength(1);
  });
});

describe('Stabile Quellen- und Anlagen-IDs', () => {
  it('vergibt Q01–Q03 fortlaufend', async () => {
    const res = await db.query<{ source_code: string }>(
      'select source_code from public.sources where project_id = $1 order by created_at, source_code',
      [DEMO_PROJECT],
    );
    expect(res.rows.map((r) => r.source_code)).toEqual(['Q01', 'Q02', 'Q03']);
  });

  it('vergibt gelöschte IDs nicht erneut', async () => {
    await db.query(`delete from public.sources where project_id = $1 and source_code = 'Q03'`, [
      DEMO_PROJECT,
    ]);
    const res = await db.query<{ source_code: string }>(
      `insert into public.sources (project_id, title) values ($1, 'Nachtrag') returning source_code`,
      [DEMO_PROJECT],
    );
    expect(res.rows[0]?.source_code).toBe('Q04');
  });

  it('ignoriert vom Client vorgegebene Codes', async () => {
    const res = await db.query<{ source_code: string }>(
      `insert into public.sources (project_id, title, source_code) values ($1, 'Versuch', 'Q99') returning source_code`,
      [DEMO_PROJECT],
    );
    expect(res.rows[0]?.source_code).toBe('Q05');
  });

  it('verbietet das Ändern einer vergebenen ID', async () => {
    await expect(
      db.query(
        `update public.sources set source_code = 'Q77' where project_id = $1 and source_code = 'Q01'`,
        [DEMO_PROJECT],
      ),
    ).rejects.toThrow(/unveränderlich/);
  });

  it('vergibt Anlagen-IDs unabhängig von Quellen-IDs', async () => {
    const res = await db.query<{ attachment_code: string }>(
      `insert into public.attachments (project_id, original_file_name, mime_type, size_bytes)
       values ($1, 'Foto_Riss.jpg', 'image/jpeg', 1024) returning attachment_code`,
      [DEMO_PROJECT],
    );
    expect(res.rows[0]?.attachment_code).toBe('A02');
  });

  it('lehnt nicht erlaubte Dateitypen ab', async () => {
    await expect(
      db.query(
        `insert into public.attachments (project_id, original_file_name, mime_type, size_bytes)
         values ($1, 'Plan.dwg', 'application/acad', 10)`,
        [DEMO_PROJECT],
      ),
    ).rejects.toThrow();
  });
});

describe('Quellenverknüpfungen', () => {
  it('erlaubt Mehrfachzuordnung einer Zeile zu mehreren Quellen', async () => {
    const res = await db.query<{ codes: string }>(
      `select string_agg(s.source_code, '; ' order by s.source_code) as codes
         from public.row_source_links l join public.sources s on s.id = l.source_id
        where l.row_id = '40000000-0000-4000-8000-000000000001'`,
    );
    expect(res.rows[0]?.codes).toBe('Q01; Q02');
  });

  it('verhindert Verknüpfungen über Projektgrenzen hinweg', async () => {
    await expect(
      db.query(
        `insert into public.row_source_links (project_id, row_id, source_id)
         values ('10000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001',
                 '50000000-0000-4000-8000-000000000001')`,
      ),
    ).rejects.toThrow();
  });

  it('verhindert doppelte Verknüpfungen', async () => {
    await expect(
      db.query(
        `insert into public.row_source_links (project_id, row_id, source_id)
         values ($1, '40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001')`,
        [DEMO_PROJECT],
      ),
    ).rejects.toThrow();
  });
});

describe('Row-Level-Security', () => {
  it('zeigt einem anderen Nutzer keine fremden Projekte, Quellen oder Zeilen', async () => {
    await asUser(db, OTHER_USER, async () => {
      for (const table of [
        'projects',
        'sources',
        'table_rows',
        'attachments',
        'open_checks',
        'usage_credits',
      ]) {
        const res = await db.query(`select * from public.${table}`);
        expect(res.rows, table).toHaveLength(0);
      }
    });
  });

  it('zeigt dem Eigentümer seine Daten', async () => {
    await asUser(db, DEMO_USER, async () => {
      const res = await db.query('select id from public.projects');
      expect(res.rows).toHaveLength(2);
    });
  });

  it('verhindert Schreiben in fremde Projekte', async () => {
    await asUser(db, OTHER_USER, async () => {
      await expect(
        db.query(`insert into public.sources (project_id, title) values ($1, 'Fremd')`, [
          DEMO_PROJECT,
        ]),
      ).rejects.toThrow();
      const upd = await db.query(`update public.projects set name = 'gekapert' where id = $1`, [
        DEMO_PROJECT,
      ]);
      expect(upd.affectedRows ?? 0).toBe(0);
    });
  });

  it('verhindert, dass Nutzer Projekte auf andere Konten anlegen', async () => {
    await asUser(db, OTHER_USER, async () => {
      await expect(
        db.query(`insert into public.projects (owner_id, name) values ($1, 'X')`, [DEMO_USER]),
      ).rejects.toThrow();
    });
  });

  it('erlaubt Clients nicht, Tarif oder Verbrauch selbst zu schreiben', async () => {
    await asUser(db, DEMO_USER, async () => {
      await expect(
        db.query(
          `insert into public.usage_credits (user_id, kind, delta) values ($1, 'addon_purchase', 100)`,
          [DEMO_USER],
        ),
      ).rejects.toThrow();
      await expect(
        db.query(`update public.subscriptions set plan = 'business' where user_id = $1`, [
          DEMO_USER,
        ]),
      ).rejects.toThrow();
    });
  });

  it('erlaubt Clients nicht, den ID-Zähler zu manipulieren', async () => {
    await asUser(db, DEMO_USER, async () => {
      await expect(
        db.query(`update public.projects set next_source_seq = 0 where id = $1`, [DEMO_PROJECT]),
      ).rejects.toThrow();
    });
  });

  it('vergibt IDs auch bei Einfügen durch den Nutzer korrekt', async () => {
    await asUser(db, DEMO_USER, async () => {
      const res = await db.query<{ source_code: string }>(
        `insert into public.sources (project_id, title) values ($1, 'Eigene Quelle') returning source_code`,
        [DEMO_PROJECT],
      );
      expect(res.rows[0]?.source_code).toBe('Q06');
    });
  });

  it('gibt anonymen Aufrufern nur die Tarifübersicht', async () => {
    await asAnon(db, async () => {
      const plans = await db.query('select plan from public.plan_config');
      expect(plans.rows).toHaveLength(3);
      await expect(db.query('select * from public.projects')).rejects.toThrow();
    });
  });
});

describe('Kontingente und Exporte', () => {
  it('erlaubt im kostenlosen Tarif nur ein aktives Projekt', async () => {
    await asUser(db, OTHER_USER, async () => {
      await db.query(`insert into public.projects (owner_id, name) values ($1, 'Erstes Projekt')`, [
        OTHER_USER,
      ]);
      await expect(
        db.query(`insert into public.projects (owner_id, name) values ($1, 'Zweites Projekt')`, [
          OTHER_USER,
        ]),
      ).rejects.toThrow(/quota_active_projects/);
      // Archivierte Projekte zählen nicht.
      await db.query(`update public.projects set archived_at = now() where owner_id = $1`, [
        OTHER_USER,
      ]);
      await db.query(
        `insert into public.projects (owner_id, name) values ($1, 'Zweites Projekt')`,
        [OTHER_USER],
      );
    });
  });

  it('berechnet den aktuellen Verbrauch inkl. Zusatzpaket', async () => {
    await asUser(db, DEMO_USER, async () => {
      const res = await db.query<{
        full_reviews_used: number;
        docx_exports_used: number;
        addon_reviews_remaining: number;
      }>(
        'select full_reviews_used, docx_exports_used, addon_reviews_remaining from public.usage_current_period',
      );
      expect(res.rows).toEqual([
        { full_reviews_used: 3, docx_exports_used: 1, addon_reviews_remaining: 10 },
      ]);
    });
  });

  it('liefert für Pro-Abonnenten den Tarif „pro“', async () => {
    const res = await db.query<{ plan: string }>('select public.current_plan($1) as plan', [
      DEMO_USER,
    ]);
    expect(res.rows[0]?.plan).toBe('pro');
    const other = await db.query<{ plan: string }>('select public.current_plan($1) as plan', [
      OTHER_USER,
    ]);
    expect(other.rows[0]?.plan).toBe('free');
  });

  it('meldet einen Export nur mit gespeicherter Datei als erfolgreich', async () => {
    await expect(
      db.query(
        `insert into public.exports (project_id, user_id, version_label, file_name, status, completed_at)
         values ($1, $2, '1.2', 'Maengelliste_v1.2.docx', 'completed', now())`,
        [DEMO_PROJECT, DEMO_USER],
      ),
    ).rejects.toThrow();
  });

  it('überschreibt keine vorhandene Exportdatei', async () => {
    const insert = `insert into public.exports (project_id, user_id, version_label, file_name)
                    values ($1, $2, '1.2', 'Maengelliste_v1.2_a.docx')`;
    await db.query(insert, [DEMO_PROJECT, DEMO_USER]);
    await expect(db.query(insert, [DEMO_PROJECT, DEMO_USER])).rejects.toThrow();
  });

  it('löst Prüfpunkte nicht ohne Zeitstempel auf', async () => {
    await expect(
      db.query(`update public.open_checks set status = 'resolved' where project_id = $1`, [
        DEMO_PROJECT,
      ]),
    ).rejects.toThrow();
  });
});

describe('Kontolöschung', () => {
  it('löscht alle Projektdaten kaskadierend mit dem Konto', async () => {
    await db.query('delete from auth.users where id = $1', [DEMO_USER]);
    for (const table of [
      'projects',
      'sources',
      'table_rows',
      'attachments',
      'usage_credits',
      'subscriptions',
    ]) {
      const res = await db.query(`select 1 from public.${table}`);
      expect(res.rows, table).toHaveLength(table === 'projects' ? 2 : 0);
    }
  });
});
