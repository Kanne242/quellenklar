import { describe, expect, it } from 'vitest';

import {
  compareStableIds,
  formatSourceList,
  formatStableId,
  nextStableId,
  parseStableId,
} from '../src/ids';

describe('Stabile Quellen- und Anlagen-IDs', () => {
  it('formatiert zweistellig und erweitert ab 100', () => {
    expect(formatStableId('Q', 1)).toBe('Q01');
    expect(formatStableId('A', 9)).toBe('A09');
    expect(formatStableId('Q', 100)).toBe('Q100');
  });

  it('lehnt ungültige laufende Nummern ab', () => {
    expect(() => formatStableId('Q', 0)).toThrow(RangeError);
    expect(() => formatStableId('Q', 1.5)).toThrow(RangeError);
  });

  it('vergibt fortlaufend auf Basis des Zählers', () => {
    expect(nextStableId('Q', 0)).toEqual({ id: 'Q01', counter: 1 });
    expect(nextStableId('Q', 7)).toEqual({ id: 'Q08', counter: 8 });
  });

  it('vergibt gelöschte IDs nicht erneut', () => {
    // Q01–Q03 vergeben, Q03 gelöscht: Zähler bleibt bei 3, nächste ID ist Q04.
    const remaining = ['Q01', 'Q02'];
    expect(nextStableId('Q', 3, remaining).id).toBe('Q04');
  });

  it('holt einen zurückliegenden Zähler anhand vorhandener IDs nach', () => {
    expect(nextStableId('A', 1, ['A01', 'A05', 'Q09']).id).toBe('A06');
  });

  it('parst nur gültige IDs', () => {
    expect(parseStableId('Q12')).toEqual({ prefix: 'Q', sequence: 12 });
    expect(parseStableId('Q1')).toBeNull();
    expect(parseStableId('Q00')).toBeNull();
    expect(parseStableId('X01')).toBeNull();
  });

  it('sortiert numerisch statt alphabetisch', () => {
    expect(['Q10', 'Q02', 'Q100', 'Q09'].sort(compareStableIds)).toEqual([
      'Q02',
      'Q09',
      'Q10',
      'Q100',
    ]);
  });

  it('gibt Mehrfachquellen als „Q03; Q07; Q12“ aus und entfernt Dubletten', () => {
    expect(formatSourceList(['Q12', 'Q03', 'Q07', 'Q03'])).toBe('Q03; Q07; Q12');
    expect(formatSourceList([])).toBe('');
  });
});
