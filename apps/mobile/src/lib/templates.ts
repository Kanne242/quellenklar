import type { ProjectCategory } from '@quellenklar/shared';

export interface TemplateInfo {
  key: string;
  title: string;
  description: string;
  category: ProjectCategory;
  /** Vorgeschlagene optionale Spalten für die Hauptübersicht (ab Phase 2 wirksam). */
  suggestedColumns: string[];
}

/** Standardvorlagen. Erweiterte Vorlagen (Business) folgen in Phase 5. */
export const TEMPLATES: TemplateInfo[] = [
  {
    key: 'general',
    title: 'Allgemeine Dokumentation',
    description: 'Vorgänge, Nachweise und Belege übersichtlich zusammenführen.',
    category: 'general',
    suggestedColumns: [],
  },
  {
    key: 'defects',
    title: 'Mängelliste',
    description:
      'Mängel mit Priorität, Frist und Verantwortlichen erfassen – mit Fotos als Anlagen.',
    category: 'construction',
    suggestedColumns: ['Priorität', 'Frist', 'Verantwortliche Person'],
  },
  {
    key: 'construction-log',
    title: 'Baudokumentation',
    description: 'Bauablauf, Aufmaße und Abnahmen mit Belegen nachvollziehbar dokumentieren.',
    category: 'construction',
    suggestedColumns: ['Bearbeitungsstand', 'Nächster Schritt'],
  },
  {
    key: 'deadlines',
    title: 'Fristen- und Vorgangsübersicht',
    description: 'Fristen, Aktenzeichen und nächste Schritte für Verwaltung und Backoffice.',
    category: 'administration',
    suggestedColumns: ['Frist', 'Aktenzeichen', 'Nächster Schritt'],
  },
  {
    key: 'association',
    title: 'Vereins- und Fördervorgang',
    description: 'Anträge, Nachweise und Fristen für Vereine und soziale Träger.',
    category: 'association',
    suggestedColumns: ['Frist', 'Verantwortliche Person'],
  },
];
