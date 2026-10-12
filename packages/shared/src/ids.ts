/**
 * Projektbezogene, stabile Kennungen für Quellen (Q01, Q02 …) und Anlagen (A01, A02 …).
 *
 * Regeln (Produktregel 6):
 * - Vergabe fortlaufend pro Projekt.
 * - Eine einmal vergebene ID wird nie neu vergeben – auch nicht nach Löschen oder Umsortieren.
 *   Grundlage ist daher ein Zähler pro Projekt (`next_source_seq` / `next_attachment_seq`),
 *   nicht die aktuelle Anzahl der Einträge.
 * - Mindestens zweistellig; ab 100 wird die Stellenzahl automatisch erweitert (Q100).
 */

export type StableIdPrefix = 'Q' | 'A';

const ID_PATTERN = /^([QA])(\d{2,})$/;

export function formatStableId(prefix: StableIdPrefix, sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new RangeError(`Ungültige laufende Nummer: ${sequence}`);
  }
  return `${prefix}${String(sequence).padStart(2, '0')}`;
}

export function parseStableId(id: string): { prefix: StableIdPrefix; sequence: number } | null {
  const match = ID_PATTERN.exec(id.trim());
  if (!match) return null;
  const sequence = Number(match[2]);
  if (sequence < 1) return null;
  return { prefix: match[1] as StableIdPrefix, sequence };
}

export function isSourceId(id: string): boolean {
  return parseStableId(id)?.prefix === 'Q';
}

export function isAttachmentId(id: string): boolean {
  return parseStableId(id)?.prefix === 'A';
}

/**
 * Ermittelt die nächste ID. `counter` ist der höchste jemals vergebene Wert (0 = noch keiner).
 * `existingIds` dient als Sicherheitsnetz, falls ein Zähler nach einem Import hinter
 * tatsächlich vorhandenen IDs zurückliegt.
 */
export function nextStableId(
  prefix: StableIdPrefix,
  counter: number,
  existingIds: readonly string[] = [],
): { id: string; counter: number } {
  let highest = counter;
  for (const existing of existingIds) {
    const parsed = parseStableId(existing);
    if (parsed && parsed.prefix === prefix && parsed.sequence > highest) {
      highest = parsed.sequence;
    }
  }
  const next = highest + 1;
  return { id: formatStableId(prefix, next), counter: next };
}

/** Sortiert IDs numerisch (Q2 vor Q10), ohne die IDs selbst zu verändern. */
export function compareStableIds(a: string, b: string): number {
  const pa = parseStableId(a);
  const pb = parseStableId(b);
  if (!pa || !pb) return a.localeCompare(b, 'de');
  if (pa.prefix !== pb.prefix) return pa.prefix.localeCompare(pb.prefix);
  return pa.sequence - pb.sequence;
}

/** Ausgabe mehrerer Quellen im Dokument: „Q03; Q07; Q12“. */
export function formatSourceList(ids: readonly string[]): string {
  const unique = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
  return unique.sort(compareStableIds).join('; ');
}
