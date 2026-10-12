import {
  createProject,
  deleteProject,
  duplicateProject,
  filterProjects,
  renameProject,
  setArchived,
  type Clock,
  type LocalProject,
} from '../projects-logic';

function testClock(): Clock {
  let n = 0;
  let t = Date.UTC(2026, 9, 12, 10, 0, 0);
  return {
    now: () => new Date((t += 1000)).toISOString(),
    uuid: () => `id-${++n}`,
  };
}

function created(
  projects: LocalProject[],
  name: string,
  clock: Clock,
  plan: 'free' | 'pro' = 'pro',
) {
  const result = createProject(projects, { name, category: 'construction' }, plan, clock);
  if (!result.ok) throw new Error(result.error);
  return result;
}

describe('Projektlogik', () => {
  it('legt ein Projekt als Entwurf an', () => {
    const result = created([], 'Bauakte', testClock());
    expect(result.project).toMatchObject({
      name: 'Bauakte',
      status: 'draft',
      archivedAt: null,
      openChecks: 0,
    });
  });

  it('validiert den Projektnamen', () => {
    const result = createProject([], { name: '  ' }, 'free', testClock());
    expect(result).toEqual({ ok: false, error: 'Projektname fehlt.' });
  });

  it('erlaubt im kostenlosen Tarif nur ein aktives Projekt', () => {
    const clock = testClock();
    const first = created([], 'Eins', clock, 'free');
    const second = createProject(first.projects, { name: 'Zwei' }, 'free', clock);
    expect(second.ok).toBe(false);
  });

  it('zählt archivierte Projekte nicht als aktiv', () => {
    const clock = testClock();
    const first = created([], 'Eins', clock, 'free');
    const archived = setArchived(first.projects, first.project.id, true, 'free', clock);
    if (!archived.ok) throw new Error(archived.error);
    expect(archived.project.status).toBe('archived');
    expect(createProject(archived.projects, { name: 'Zwei' }, 'free', clock).ok).toBe(true);
  });

  it('verhindert das Wiederherstellen über das Tariflimit hinaus', () => {
    const clock = testClock();
    const a = created([], 'Eins', clock, 'free');
    const archived = setArchived(a.projects, a.project.id, true, 'free', clock);
    if (!archived.ok) throw new Error();
    const b = created(archived.projects, 'Zwei', clock, 'free');
    expect(setArchived(b.projects, a.project.id, false, 'free', clock).ok).toBe(false);
  });

  it('benennt um, dupliziert und löscht', () => {
    const clock = testClock();
    const a = created([], 'Original', clock);
    const renamed = renameProject(a.projects, a.project.id, 'Neu', clock);
    if (!renamed.ok) throw new Error();
    expect(renamed.project.name).toBe('Neu');

    const dup = duplicateProject(renamed.projects, a.project.id, 'pro', clock);
    if (!dup.ok) throw new Error();
    expect(dup.project.name).toBe('Neu (Kopie)');
    expect(dup.projects).toHaveLength(2);

    expect(deleteProject(dup.projects, a.project.id).map((p) => p.name)).toEqual(['Neu (Kopie)']);
  });

  it('sucht und filtert nach Status und Kategorie', () => {
    const clock = testClock();
    let list = created([], 'Mängelliste Haus A', clock).projects;
    list = created(list, 'Fristen Verein', clock).projects;
    const archived = setArchived(list, list[0]!.id, true, 'pro', clock);
    if (!archived.ok) throw new Error();
    list = archived.projects;

    expect(filterProjects(list, 'mängel', 'all').map((p) => p.name)).toEqual([
      'Mängelliste Haus A',
    ]);
    expect(filterProjects(list, '', 'archived').map((p) => p.name)).toEqual(['Fristen Verein']);
    expect(filterProjects(list, '', 'active', 'association')).toHaveLength(0);
  });
});
