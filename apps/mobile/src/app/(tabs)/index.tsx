import {
  PROJECT_CATEGORY_LABELS,
  PROJECT_STATUS_LABELS,
  type ProjectCategory,
} from '@quellenklar/shared';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ChoiceChips } from '@/components/choice-chips';
import { Badge, Card, layoutStyles, Screen } from '@/components/layout';
import { SaveIndicator } from '@/components/save-indicator';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { formatTimestamp, statusTone } from '@/lib/format';
import { useAppStore } from '@/store/app-store';
import { filterProjects, type ProjectFilter } from '@/store/projects-logic';

const FILTERS = [
  { value: 'active', label: 'Aktiv' },
  { value: 'archived', label: 'Archiviert' },
  { value: 'all', label: 'Alle' },
] as const;

const CATEGORY_FILTERS = [
  { value: 'all' as const, label: 'Alle Kategorien' },
  ...(Object.entries(PROJECT_CATEGORY_LABELS) as Array<[ProjectCategory, string]>).map(
    ([value, label]) => ({
      value,
      label,
    }),
  ),
];

export default function ProjectsScreen() {
  const projects = useAppStore((s) => s.projects);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ProjectFilter>('active');
  const [category, setCategory] = useState<ProjectCategory | 'all'>('all');

  const visible = useMemo(
    () => filterProjects(projects, query, filter, category),
    [projects, query, filter, category],
  );

  return (
    <Screen>
      <View style={layoutStyles.rowBetween}>
        <Text variant="title">Projekte</Text>
        <SaveIndicator />
      </View>

      {projects.length === 0 ? (
        <Card>
          <Text variant="heading">Noch keine Projekte</Text>
          <Text tone="secondary">
            Lege dein erstes Projekt an. Der Assistent führt dich durch Grunddaten, Inhalte,
            Tabellen, Quellen und Anlagen.
          </Text>
          <Button label="Neues Projekt anlegen" onPress={() => router.push('/neu')} />
        </Card>
      ) : (
        <>
          <TextField
            label="Suche"
            placeholder="Projektname"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          <ChoiceChips label="Status" choices={FILTERS} value={filter} onChange={setFilter} />
          <ChoiceChips
            label="Kategorie"
            choices={CATEGORY_FILTERS}
            value={category}
            onChange={setCategory}
          />

          <View style={layoutStyles.stack}>
            {visible.length === 0 ? (
              <Text tone="secondary">Keine Projekte für diese Auswahl gefunden.</Text>
            ) : (
              visible.map((project) => (
                <Pressable
                  key={project.id}
                  onPress={() =>
                    router.push({ pathname: '/projekt/[id]', params: { id: project.id } })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${project.name}, ${PROJECT_STATUS_LABELS[project.status]}, zuletzt bearbeitet ${formatTimestamp(project.updatedAt)}`}
                >
                  {({ pressed }) => (
                    <Card style={pressed ? styles.pressed : undefined}>
                      <View style={layoutStyles.rowBetween}>
                        <Text variant="heading" style={styles.flex} numberOfLines={2}>
                          {project.name}
                        </Text>
                        <Badge
                          label={PROJECT_STATUS_LABELS[project.status]}
                          tone={statusTone(project.status)}
                        />
                      </View>
                      <Text variant="caption" tone="secondary">
                        {PROJECT_CATEGORY_LABELS[project.category]} · Zuletzt bearbeitet{' '}
                        {formatTimestamp(project.updatedAt)}
                      </Text>
                      {project.openChecks > 0 ? (
                        <Badge
                          label={`${project.openChecks} offene${project.openChecks === 1 ? 'r' : ''} Prüfpunkt${project.openChecks === 1 ? '' : 'e'}`}
                          tone="warning"
                        />
                      ) : null}
                    </Card>
                  )}
                </Pressable>
              ))
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
});
