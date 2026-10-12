import { z } from 'zod';

import { attachmentIdSchema, sourceIdSchema } from './schemas';

/**
 * Strenges Antwortschema der KI-Prüfung (Abschnitt 7 der Spezifikation).
 * Alle Objekte sind `strict`: unbekannte Felder führen zu einem Validierungsfehler,
 * damit keine ungeprüften Inhalte übernommen werden.
 */

export const reviewTypeSchema = z.enum(['language', 'language_consistency', 'full']);
export type ReviewType = z.infer<typeof reviewTypeSchema>;

export const REVIEW_TYPE_LABELS: Record<ReviewType, string> = {
  language: 'Sprachprüfung',
  language_consistency: 'Sprache und Konsistenz',
  full: 'Vollprüfung',
};

export const changeCategorySchema = z.enum([
  'language_fix',
  'spelling_unification',
  'missing_value',
  'contradiction',
  'source_mapping',
  'duplicate',
  'open_check',
]);
export type ChangeCategory = z.infer<typeof changeCategorySchema>;

export const CHANGE_CATEGORY_LABELS: Record<ChangeCategory, string> = {
  language_fix: 'Automatisch korrigierbare Sprachfehler',
  spelling_unification: 'Vereinheitlichte Schreibweisen',
  missing_value: 'Fehlende Angaben',
  contradiction: 'Widersprüchliche Angaben',
  source_mapping: 'Fehlende oder unklare Quellenzuordnung',
  duplicate: 'Doppelte Einträge',
  open_check: 'Offene Prüfpunkte',
};

const targetSchema = z
  .object({
    kind: z.enum(['section', 'table_row', 'source', 'attachment', 'metadata']),
    id: z.string().min(1),
    field: z.string().min(1).optional(),
  })
  .strict();

export const reviewChangeSchema = z
  .object({
    id: z.string().min(1),
    category: changeCategorySchema,
    target: targetSchema,
    original: z.string(),
    proposed: z.string(),
    reason: z.string().min(1),
    /** Inhaltliche Änderungen müssen immer einzeln bestätigt werden. */
    isContentChange: z.boolean(),
  })
  .strict();

export const correctedSectionSchema = z
  .object({ sectionId: z.string().min(1), heading: z.string(), body: z.string() })
  .strict();

export const correctedTableRowSchema = z
  .object({ rowId: z.string().min(1), values: z.record(z.string(), z.string()) })
  .strict();

export const sourceMappingSchema = z
  .object({
    rowId: z.string().min(1),
    sourceIds: z.array(sourceIdSchema),
    attachmentIds: z.array(attachmentIdSchema).default([]),
    status: z.enum(['ok', 'missing', 'unclear', 'unknown_id']),
  })
  .strict();

export const openCheckSchema = z
  .object({
    target: targetSchema,
    /** Erscheint im Dokument als „PRÜFEN: …“. */
    description: z.string().min(1).max(300),
    severity: z.enum(['info', 'warning', 'error']),
  })
  .strict();

export const qualityReportSchema = z
  .object({
    languagePassed: z.boolean(),
    sourceIdsComplete: z.boolean(),
    sourceReferencesConsistent: z.boolean(),
    attachmentReferencesComplete: z.boolean(),
    datesConsistent: z.boolean(),
    readyForExport: z.boolean(),
  })
  .strict();

export const reviewResultSchema = z
  .object({
    correctedSections: z.array(correctedSectionSchema),
    correctedTableRows: z.array(correctedTableRowSchema),
    summary: z.string(),
    sourceMappings: z.array(sourceMappingSchema),
    openChecks: z.array(openCheckSchema),
    changes: z.array(reviewChangeSchema),
    qualityReport: qualityReportSchema,
  })
  .strict();

export type ReviewResult = z.infer<typeof reviewResultSchema>;
export type ReviewChange = z.infer<typeof reviewChangeSchema>;
export type OpenCheck = z.infer<typeof openCheckSchema>;

export type ParseReviewOutcome =
  | { ok: true; result: ReviewResult }
  | { ok: false; error: 'invalid_json' | 'schema_mismatch'; details: string };

/**
 * Parst die Rohantwort der KI. Es wird nichts „repariert“ oder ergänzt – bei einem Fehler
 * entscheidet der Aufrufer über den einen erlaubten Reparaturversuch.
 */
export function parseReviewResult(raw: string): ParseReviewOutcome {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    return { ok: false, error: 'invalid_json', details: (error as Error).message };
  }
  const parsed = reviewResultSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'schema_mismatch',
      details: parsed.error.issues
        .slice(0, 10)
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('; '),
    };
  }
  return { ok: true, result: parsed.data };
}
