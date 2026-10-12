import { PROJECT_CATEGORY_LABELS, PROJECT_STATUS_LABELS } from '@quellenklar/shared';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button } from '@/components/button';
import {
  Badge,
  Card,
  ComingSoonBadge,
  layoutStyles,
  Screen,
  SectionHeader,
} from '@/components/layout';
import { SaveIndicator } from '@/components/save-indicator';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { formatTimestamp, statusTone } from '@/lib/format';
import { useAppStore } from '@/store/app-store';

/** Die acht Schritte des Dokumentassistenten (Spezifikation 6.3). Umsetzung ab Phase 2. */
const WIZARD_STEPS = [
  'Grunddaten',
  'Inhalte',
  'Hauptübersicht',
  'Quellen',
  'Anlagen',
  'Prüfung',
  'Dokumentgestaltung',
  'Vorschau und Export',
];

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = useAppStore((s) => s.projects.find((p) => p.id === id));
  const { renameProject, duplicateProject, archiveProject, deleteProject } = useAppStore.getState();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(project?.name ?? '');
  const [error, setError] = useState<string | null>(null);

  if (!project) {
    return (
      <Screen edges={[]}>
        <Card>
          <Text variant="heading">Projekt nicht gefunden</Text>
          <Text tone="secondary">Es wurde möglicherweise gelöscht.</Text>
          <Button label="Zur Projektübersicht" onPress={() => router.replace('/')} />
        </Card>
      </Screen>
    );
  }

  const handle = (result: { ok: boolean; error?: string }) => {
    setError(result.ok ? null : (result.error ?? 'Aktion fehlgeschlagen.'));
    return result.ok;
  };

  const saveName = () => {
    if (handle(renameProject(project.id, name))) setRenaming(false);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Projekt löschen?',
      `„${project.name}“ wird mit allen Inhalten, Quellen und Anlagen von diesem Gerät gelöscht. Das kann nicht rückgängig gemacht werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            deleteProject(project.id);
            router.replace('/');
          },
        },
      ],
    );
  };

  const isArchived = project.archivedAt !== null;

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: project.name }} />

      <View style={layoutStyles.stack}>
        <View style={layoutStyles.rowBetween}>
          <Badge label={PROJECT_STATUS_LABELS[project.status]} tone={statusTone(project.status)} />
          <SaveIndicator />
        </View>
        {renaming ? (
          <View style={layoutStyles.stack}>
            <TextField
              label="Projektname"
              value={name}
              onChangeText={setName}
              autoFocus
              maxLength={120}
            />
            <View style={layoutStyles.row}>
              <View style={{ flex: 1 }}>
                <Button
                  label="Abbrechen"
                  variant="secondary"
                  onPress={() => {
                    setRenaming(false);
                    setName(project.name);
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Speichern" onPress={saveName} />
              </View>
            </View>
          </View>
        ) : (
          <Text variant="title">{project.name}</Text>
        )}
        <Text variant="caption" tone="secondary">
          {PROJECT_CATEGORY_LABELS[project.category]} · Angelegt{' '}
          {formatTimestamp(project.createdAt)} · Zuletzt bearbeitet{' '}
          {formatTimestamp(project.updatedAt)}
        </Text>
        {error ? (
          <Text tone="error" accessibilityLiveRegion="assertive">
            {error}
          </Text>
        ) : null}
      </View>

      <Card>
        <SectionHeader
          title="Dokumentassistent"
          subtitle="In acht Schritten zum fertigen Word-Dokument."
        />
        {WIZARD_STEPS.map((step, i) => (
          <View key={step} style={layoutStyles.rowBetween}>
            <Text style={{ flex: 1 }}>
              {i + 1}. {step}
            </Text>
            <ComingSoonBadge />
          </View>
        ))}
      </Card>

      <Card>
        <SectionHeader title="Aktionen" />
        {!renaming ? (
          <Button label="Umbenennen" variant="secondary" onPress={() => setRenaming(true)} />
        ) : null}
        <Button
          label="Duplizieren"
          variant="secondary"
          onPress={() => {
            const result = duplicateProject(project.id);
            if (handle(result) && result.ok) {
              router.replace({ pathname: '/projekt/[id]', params: { id: result.project.id } });
            }
          }}
        />
        <Button
          label={isArchived ? 'Wiederherstellen' : 'Archivieren'}
          variant="secondary"
          onPress={() => handle(archiveProject(project.id, !isArchived))}
        />
        <Button label="Löschen" variant="danger" onPress={confirmDelete} />
      </Card>
    </Screen>
  );
}
