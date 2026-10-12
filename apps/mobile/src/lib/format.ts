import { formatGermanDate, type ProjectStatus } from '@quellenklar/shared';

/** ISO-Zeitstempel → TT.MM.JJJJ in lokaler Zeit. */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return formatGermanDate(`${y}-${m}-${d}`) ?? iso;
}

export function statusTone(status: ProjectStatus) {
  switch (status) {
    case 'ready':
    case 'exported':
      return 'success' as const;
    case 'in_review':
      return 'warning' as const;
    case 'archived':
      return 'neutral' as const;
    default:
      return 'accent' as const;
  }
}
