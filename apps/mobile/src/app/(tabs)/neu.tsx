import { zodResolver } from '@hookform/resolvers/zod';
import {
  createProjectSchema,
  PROJECT_CATEGORY_LABELS,
  projectCategorySchema,
  type CreateProjectInput,
  type ProjectCategory,
} from '@quellenklar/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { ChoiceChips } from '@/components/choice-chips';
import { Card, layoutStyles, Screen } from '@/components/layout';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { useAppStore } from '@/store/app-store';

const CATEGORY_CHOICES = (
  Object.entries(PROJECT_CATEGORY_LABELS) as Array<[ProjectCategory, string]>
).map(([value, label]) => ({ value, label }));

export default function NewProjectScreen() {
  const params = useLocalSearchParams<{ kategorie?: string; vorlage?: string }>();
  const addProject = useAppStore((s) => s.addProject);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: '', category: 'general' },
  });

  useEffect(() => {
    const parsed = projectCategorySchema.safeParse(params.kategorie);
    if (parsed.success) setValue('category', parsed.data);
  }, [params.kategorie, setValue]);

  const onSubmit = handleSubmit((values) => {
    setSubmitError(null);
    const result = addProject(values);
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    reset({ name: '', category: 'general' });
    router.push({ pathname: '/projekt/[id]', params: { id: result.project.id } });
  });

  return (
    <Screen>
      <View style={layoutStyles.stack}>
        <Text variant="title">Neues Projekt</Text>
        <Text tone="secondary">
          Gib deinem Projekt einen Namen und wähle eine Kategorie. Alles Weitere erfasst du danach
          Schritt für Schritt.
        </Text>
        {params.vorlage ? (
          <Text variant="caption" tone="accent">
            Vorlage: {params.vorlage}
          </Text>
        ) : null}
      </View>

      <Card>
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Projektname"
              placeholder="z. B. Mängelliste Rohbau Musterstraße"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
              maxLength={120}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
              testID="project-name"
            />
          )}
        />
        <Controller
          control={control}
          name="category"
          render={({ field: { value, onChange } }) => (
            <ChoiceChips
              label="Kategorie"
              choices={CATEGORY_CHOICES}
              value={value ?? 'general'}
              onChange={onChange}
            />
          )}
        />
        {submitError ? (
          <Text tone="error" accessibilityLiveRegion="assertive" testID="submit-error">
            {submitError}
          </Text>
        ) : null}
        <Button
          label="Projekt anlegen"
          onPress={onSubmit}
          loading={isSubmitting}
          testID="create-project"
        />
      </Card>
    </Screen>
  );
}
