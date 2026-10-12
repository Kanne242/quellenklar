/** Feste Textbausteine, die laut Produktregeln wortgleich verwendet werden müssen. */
export const NOT_SPECIFIED = 'nicht angegeben';

export const CHECK_PREFIX = 'PRÜFEN:';

export function checkMarker(description: string): string {
  const text = description.trim();
  if (!text) throw new Error('Ein Prüfpunkt braucht eine kurze Beschreibung.');
  return `${CHECK_PREFIX} ${text}`;
}

/** Gibt den Wert zurück oder „nicht angegeben“, wenn er leer ist. Inhalte werden nicht verändert. */
export function orNotSpecified(value: string | null | undefined): string {
  if (value === null || value === undefined) return NOT_SPECIFIED;
  return value.trim() === '' ? NOT_SPECIFIED : value;
}
