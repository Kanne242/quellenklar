/**
 * Datumsformat im Dokument: einheitlich TT.MM.JJJJ.
 * Gespeichert wird ISO (JJJJ-MM-TT). Freitext-Zeiträume („März 2024“, „KW 12“) bleiben unverändert.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DE_DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** ISO → TT.MM.JJJJ. Gibt `null` zurück, wenn es kein gültiges ISO-Datum ist. */
export function formatGermanDate(iso: string): string | null {
  const match = ISO_DATE.exec(iso.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  if (!isValidDate(Number(y), Number(m), Number(d))) return null;
  return `${d}.${m}.${y}`;
}

/** TT.MM.JJJJ (auch T.M.JJJJ) → ISO. Gibt `null` bei ungültigen Daten zurück (z. B. 31.02.2024). */
export function parseGermanDate(input: string): string | null {
  const match = DE_DATE.exec(input.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!isValidDate(year, month, day)) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Vereinheitlicht ein Datum für die Ausgabe. Erkennt ISO und deutsche Schreibweise;
 * alles andere (Zeiträume, Freitext) wird unverändert zurückgegeben.
 */
export function normalizeDateForDisplay(input: string): string {
  const trimmed = input.trim();
  const fromIso = formatGermanDate(trimmed);
  if (fromIso) return fromIso;
  const iso = parseGermanDate(trimmed);
  if (iso) return formatGermanDate(iso) ?? trimmed;
  return input;
}
