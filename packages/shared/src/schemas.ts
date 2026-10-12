import { z } from 'zod';

import { parseGermanDate } from './dates';
import { isAttachmentId, isSourceId } from './ids';

/** Fehlermeldungen sind deutsch, da sie direkt im Formular angezeigt werden. */

const requiredText = (label: string, max = 500) =>
  z
    .string({ error: `${label} fehlt.` })
    .trim()
    .min(1, `${label} fehlt.`)
    .max(max, `${label} ist zu lang (höchstens ${max} Zeichen).`);

const optionalText = (max = 2000) =>
  z.string().trim().max(max, `Höchstens ${max} Zeichen.`).optional();

/** ISO-Datum JJJJ-MM-TT; im Formular darf auch TT.MM.JJJJ eingegeben werden. */
export const isoDateSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const roundTrip = parseGermanDate(value.split('-').reverse().join('.'));
      if (roundTrip === value) return value;
    }
    const parsed = parseGermanDate(value);
    if (parsed) return parsed;
    ctx.addIssue({
      code: 'custom',
      message: 'Bitte ein gültiges Datum im Format TT.MM.JJJJ angeben.',
    });
    return z.NEVER;
  });

export const urlSchema = z
  .string()
  .trim()
  .pipe(
    z.url({
      protocol: /^https?$/,
      hostname: z.regexes.domain,
      error: 'Bitte eine vollständige Internetadresse mit http:// oder https:// angeben.',
    }),
  );

export const sourceIdSchema = z
  .string()
  .refine(isSourceId, 'Ungültige Quellen-ID (erwartet z. B. Q01).');
export const attachmentIdSchema = z
  .string()
  .refine(isAttachmentId, 'Ungültige Anlagen-ID (erwartet z. B. A01).');

/* ------------------------------------------------------------------ Grunddaten (Schritt 1) */

export const documentMetadataSchema = z.object({
  title: requiredText('Titel', 200),
  shortTitle: requiredText('Verkürzter Titel', 60),
  purpose: optionalText(1000),
  recipient: optionalText(300),
  version: requiredText('Version', 20),
  editedOn: isoDateSchema,
});
export type DocumentMetadataInput = z.input<typeof documentMetadataSchema>;
export type DocumentMetadata = z.output<typeof documentMetadataSchema>;

/* ------------------------------------------------------------------ Projekte */

export const projectStatusSchema = z.enum(['draft', 'in_review', 'ready', 'exported', 'archived']);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Entwurf',
  in_review: 'In Prüfung',
  ready: 'Exportbereit',
  exported: 'Exportiert',
  archived: 'Archiviert',
};

export const projectCategorySchema = z.enum([
  'general',
  'construction',
  'administration',
  'private',
  'association',
  'education',
]);
export type ProjectCategory = z.infer<typeof projectCategorySchema>;

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  general: 'Allgemein',
  construction: 'Bau & Handwerk',
  administration: 'Büro & Verwaltung',
  private: 'Privat',
  association: 'Verein',
  education: 'Bildung & Soziales',
};

export const createProjectSchema = z.object({
  name: requiredText('Projektname', 120),
  category: projectCategorySchema.default('general'),
});
export type CreateProjectInput = z.input<typeof createProjectSchema>;

/* ------------------------------------------------------------------ Tabelle (Schritt 3) */

export const STANDARD_COLUMNS = [
  { key: 'row_no', label: 'Lfd. Nr.' },
  { key: 'category', label: 'Kategorie' },
  { key: 'date_period', label: 'Datum/Zeitraum' },
  { key: 'topic', label: 'Thema/Bezeichnung' },
  { key: 'description', label: 'Sachverhalt/Beschreibung' },
  { key: 'status_result', label: 'Status/Ergebnis' },
  { key: 'source_ref', label: 'Quelle/Beleg' },
  { key: 'remarks', label: 'Anmerkungen' },
] as const;

export const OPTIONAL_COLUMNS = [
  { key: 'deadline', label: 'Frist' },
  { key: 'priority', label: 'Priorität' },
  { key: 'responsible', label: 'Verantwortliche Person' },
  { key: 'case_number', label: 'Aktenzeichen' },
  { key: 'file_name', label: 'Dateiname' },
  { key: 'page_ref', label: 'Seitenangabe' },
  { key: 'link', label: 'Link' },
  { key: 'progress', label: 'Bearbeitungsstand' },
  { key: 'next_step', label: 'Nächster Schritt' },
] as const;

export type StandardColumnKey = (typeof STANDARD_COLUMNS)[number]['key'];
export type OptionalColumnKey = (typeof OPTIONAL_COLUMNS)[number]['key'];
export type ColumnKey = StandardColumnKey | OptionalColumnKey;

const allColumnKeys = [...STANDARD_COLUMNS, ...OPTIONAL_COLUMNS].map((c) => c.key) as [
  ColumnKey,
  ...ColumnKey[],
];
export const columnKeySchema = z.enum(allColumnKeys);

export const tableRowSchema = z.object({
  /** Werte je Spalte; `row_no` und `source_ref` werden vom System gefüllt. */
  values: z.partialRecord(
    columnKeySchema,
    z.string().max(5000, 'Zelle ist zu lang (höchstens 5000 Zeichen).'),
  ),
  sourceIds: z.array(sourceIdSchema).default([]),
});
export type TableRowInput = z.input<typeof tableRowSchema>;

/* ------------------------------------------------------------------ Quellen (Schritt 4) */

export const sourceSchema = z
  .object({
    authorInstitution: optionalText(300),
    title: requiredText('Titel/Bezeichnung', 500),
    documentType: optionalText(100),
    dateOrYear: optionalText(50),
    fileOrLocation: optionalText(500),
    url: urlSchema.optional(),
    retrievedOn: isoDateSchema.optional(),
    pageSection: optionalText(100),
    note: optionalText(2000),
  })
  .superRefine((value, ctx) => {
    if (value.retrievedOn && !value.url) {
      ctx.addIssue({
        code: 'custom',
        path: ['retrievedOn'],
        message: 'Ein Abrufdatum ist nur bei Internetquellen sinnvoll.',
      });
    }
  });
export type SourceInput = z.input<typeof sourceSchema>;

/* ------------------------------------------------------------------ Anlagen (Schritt 5) */

export const ALLOWED_ATTACHMENT_TYPES = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  png: 'image/png',
} as const;
export type AttachmentExtension = keyof typeof ALLOWED_ATTACHMENT_TYPES;

export function attachmentExtension(fileName: string): AttachmentExtension | null {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  const normalized = ext === 'jpeg' ? 'jpg' : ext;
  return normalized in ALLOWED_ATTACHMENT_TYPES ? (normalized as AttachmentExtension) : null;
}

export const attachmentSchema = z.object({
  originalFileName: z
    .string()
    .trim()
    .min(1, 'Dateiname fehlt.')
    .refine(
      (name) => attachmentExtension(name) !== null,
      'Dieser Dateityp wird nicht unterstützt. Erlaubt sind PDF, DOCX, XLSX, CSV, TXT, JPG und PNG.',
    ),
  description: optionalText(1000),
  documentDate: isoDateSchema.optional(),
  sizeBytes: z.number().int().positive('Die Datei ist leer.'),
});
export type AttachmentInput = z.input<typeof attachmentSchema>;
