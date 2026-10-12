import { useSaveStatus } from '@/store/app-store';

import { Badge } from './layout';

/** Eindeutige Anzeige des Speicherstatus (Spezifikation 6.3). */
export function SaveIndicator() {
  const state = useSaveStatus((s) => s.state);
  if (state === 'saving') return <Badge label="Wird gespeichert …" tone="neutral" />;
  if (state === 'error') return <Badge label="Speichern fehlgeschlagen" tone="error" />;
  return <Badge label="Lokal gespeichert" tone="success" />;
}
