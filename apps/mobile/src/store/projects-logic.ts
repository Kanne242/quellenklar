import {
  checkQuota,
  createProjectSchema,
  type CreateProjectInput,
  type PlanId,
  type ProjectCategory,
  type ProjectStatus,
} from '@quellenklar/shared';

/**
 * Lokales Projektmodell (Entwurfsspeicher auf dem Gerät).
 * Ab Phase 2 wird es mit Supabase synchronisiert; die Felder entsprechen der Tabelle `projects`.
 */
export interface LocalProject {
  id: string;
  name: string;
  category: ProjectCategory;
  status: ProjectStatus;
  openChecks: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export type ProjectResult =
  { ok: true; projects: LocalProject[]; project: LocalProject } | { ok: false; error: string };

export interface Clock {
  now: () => string;
  uuid: () => string;
}

export function activeProjects(projects: readonly LocalProject[]): LocalProject[] {
  return projects.filter((p) => p.archivedAt === null);
}

export function createProject(
  projects: readonly LocalProject[],
  input: CreateProjectInput,
  plan: PlanId,
  clock: Clock,
): ProjectResult {
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Eingabe ungültig.' };
  }
  const quota = checkQuota('active_projects', {
    plan,
    activeProjects: activeProjects(projects).length,
    docxExportsThisPeriod: 0,
    fullReviewsThisPeriod: 0,
    addonReviewsRemaining: 0,
  });
  if (!quota.allowed) return { ok: false, error: quota.reason };

  const now = clock.now();
  const project: LocalProject = {
    id: clock.uuid(),
    name: parsed.data.name,
    category: parsed.data.category,
    status: 'draft',
    openChecks: 0,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  };
  return { ok: true, project, projects: [project, ...projects] };
}

export function renameProject(
  projects: readonly LocalProject[],
  id: string,
  name: string,
  clock: Clock,
): ProjectResult {
  const parsed = createProjectSchema.shape.name.safeParse(name);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Name ungültig.' };
  return update(projects, id, (p) => ({ ...p, name: parsed.data, updatedAt: clock.now() }));
}

export function duplicateProject(
  projects: readonly LocalProject[],
  id: string,
  plan: PlanId,
  clock: Clock,
): ProjectResult {
  const original = projects.find((p) => p.id === id);
  if (!original) return { ok: false, error: 'Das Projekt wurde nicht gefunden.' };
  const copyName = `${original.name} (Kopie)`.slice(0, 120);
  return createProject(projects, { name: copyName, category: original.category }, plan, clock);
}

export function setArchived(
  projects: readonly LocalProject[],
  id: string,
  archived: boolean,
  plan: PlanId,
  clock: Clock,
): ProjectResult {
  const target = projects.find((p) => p.id === id);
  if (!target) return { ok: false, error: 'Das Projekt wurde nicht gefunden.' };
  if (!archived && target.archivedAt !== null) {
    const quota = checkQuota('active_projects', {
      plan,
      activeProjects: activeProjects(projects).length,
      docxExportsThisPeriod: 0,
      fullReviewsThisPeriod: 0,
      addonReviewsRemaining: 0,
    });
    if (!quota.allowed) return { ok: false, error: quota.reason };
  }
  const now = clock.now();
  return update(projects, id, (p) => ({
    ...p,
    archivedAt: archived ? now : null,
    status: archived ? 'archived' : 'draft',
    updatedAt: now,
  }));
}

export function deleteProject(projects: readonly LocalProject[], id: string): LocalProject[] {
  return projects.filter((p) => p.id !== id);
}

export type ProjectFilter = 'active' | 'archived' | 'all';

export function filterProjects(
  projects: readonly LocalProject[],
  query: string,
  filter: ProjectFilter,
  category: ProjectCategory | 'all' = 'all',
): LocalProject[] {
  const q = query.trim().toLocaleLowerCase('de');
  return projects
    .filter((p) =>
      filter === 'all' ? true : filter === 'active' ? p.archivedAt === null : p.archivedAt !== null,
    )
    .filter((p) => (category === 'all' ? true : p.category === category))
    .filter((p) => (q ? p.name.toLocaleLowerCase('de').includes(q) : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function update(
  projects: readonly LocalProject[],
  id: string,
  change: (p: LocalProject) => LocalProject,
): ProjectResult {
  let found: LocalProject | undefined;
  const next = projects.map((p) => {
    if (p.id !== id) return p;
    found = change(p);
    return found;
  });
  if (!found) return { ok: false, error: 'Das Projekt wurde nicht gefunden.' };
  return { ok: true, projects: next, project: found };
}
