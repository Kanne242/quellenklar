import { describe, expect, it } from 'vitest';

import { formatGermanDate, normalizeDateForDisplay, parseGermanDate } from '../src/dates';
import {
  attachmentSchema,
  createProjectSchema,
  documentMetadataSchema,
  sourceSchema,
  tableRowSchema,
} from '../src/schemas';
import { checkMarker, NOT_SPECIFIED, orNotSpecified } from '../src/text';

describe('Datumsformat TT.MM.JJJJ', () => {
  it('wandelt ISO in deutsches Format', () => {
    expect(formatGermanDate('2024-03-05')).toBe('05.03.2024');
  });
  it('erkennt ungültige Kalendertage', () => {
    expect(parseGermanDate('31.02.2024')).toBeNull();
    expect(parseGermanDate('29.02.2024')).toBe('2024-02-29');
    expect(parseGermanDate('29.02.2023')).toBeNull();
  });
  it('lässt Zeiträume und Freitext unverändert', () => {
    expect(normalizeDateForDisplay('März 2024')).toBe('März 2024');
    expect(normalizeDateForDisplay('KW 12/2024')).toBe('KW 12/2024');
    expect(normalizeDateForDisplay('5.3.2024')).toBe('05.03.2024');
  });
});

describe('Textbausteine', () => {
  it('kennzeichnet fehlende Werte wortgleich', () => {
    expect(orNotSpecified('')).toBe(NOT_SPECIFIED);
    expect(orNotSpecified(undefined)).toBe('nicht angegeben');
    expect(orNotSpecified('  ')).toBe('nicht angegeben');
  });
  it('verändert vorhandene Werte nicht', () => {
    expect(orNotSpecified('  Az. 12 O 345/23 ')).toBe('  Az. 12 O 345/23 ');
  });
  it('erzeugt Prüfmarker', () => {
    expect(checkMarker('Datum widersprüchlich')).toBe('PRÜFEN: Datum widersprüchlich');
    expect(() => checkMarker(' ')).toThrow();
  });
});

describe('Formularvalidierung', () => {
  it('akzeptiert vollständige Grunddaten und normalisiert das Datum', () => {
    const result = documentMetadataSchema.parse({
      title: 'Mängelliste Rohbau Musterstraße 1',
      shortTitle: 'Mängelliste Rohbau',
      version: '1.0',
      editedOn: '12.10.2026',
    });
    expect(result.editedOn).toBe('2026-10-12');
  });

  it('meldet fehlende Pflichtfelder auf Deutsch', () => {
    const result = documentMetadataSchema.safeParse({
      title: '',
      shortTitle: 'x',
      version: '1',
      editedOn: '2026-10-12',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Titel fehlt.');
  });

  it('lehnt ungültige Daten ab', () => {
    const result = documentMetadataSchema.safeParse({
      title: 'T',
      shortTitle: 'T',
      version: '1',
      editedOn: '2026-02-30',
    });
    expect(result.success).toBe(false);
  });

  it('verlangt einen Projektnamen', () => {
    expect(createProjectSchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(createProjectSchema.parse({ name: 'Bauakte' }).category).toBe('general');
  });

  it('validiert URLs von Quellen', () => {
    expect(sourceSchema.safeParse({ title: 'Norm', url: 'www.beispiel.de' }).success).toBe(false);
    expect(sourceSchema.safeParse({ title: 'Norm', url: 'ftp://beispiel.de' }).success).toBe(false);
    expect(
      sourceSchema.safeParse({
        title: 'Norm',
        url: 'https://beispiel.de/a',
        retrievedOn: '01.10.2026',
      }).success,
    ).toBe(true);
  });

  it('lässt ein Abrufdatum nur bei Internetquellen zu', () => {
    expect(sourceSchema.safeParse({ title: 'Brief', retrievedOn: '01.10.2026' }).success).toBe(
      false,
    );
  });

  it('prüft Quellen-IDs in Tabellenzeilen', () => {
    expect(
      tableRowSchema.safeParse({ values: { topic: 'Riss' }, sourceIds: ['Q01', 'Q02'] }).success,
    ).toBe(true);
    expect(
      tableRowSchema.safeParse({ values: { topic: 'Riss' }, sourceIds: ['A01'] }).success,
    ).toBe(false);
    expect(tableRowSchema.safeParse({ values: { unbekannt: 'x' } }).success).toBe(false);
  });

  it('erlaubt nur die MVP-Dateitypen für Anlagen', () => {
    expect(
      attachmentSchema.safeParse({ originalFileName: 'Foto.JPEG', sizeBytes: 10 }).success,
    ).toBe(true);
    expect(
      attachmentSchema.safeParse({ originalFileName: 'Plan.dwg', sizeBytes: 10 }).success,
    ).toBe(false);
    expect(attachmentSchema.safeParse({ originalFileName: 'leer.pdf', sizeBytes: 0 }).success).toBe(
      false,
    );
  });
});
