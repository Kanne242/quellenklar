import { PROJECT_CATEGORY_LABELS } from '@quellenklar/shared';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Badge, Card, ComingSoonBadge, layoutStyles, Screen } from '@/components/layout';
import { Text } from '@/components/text';
import { TEMPLATES } from '@/lib/templates';

export default function TemplatesScreen() {
  return (
    <Screen>
      <View style={layoutStyles.stack}>
        <Text variant="title">Vorlagen</Text>
        <Text tone="secondary">
          Starte mit einer passenden Grundstruktur statt mit einer leeren Seite.
        </Text>
      </View>

      <View style={layoutStyles.stack}>
        {TEMPLATES.map((template) => (
          <Card key={template.key}>
            <Text variant="heading">{template.title}</Text>
            <Badge label={PROJECT_CATEGORY_LABELS[template.category]} tone="accent" />
            <Text tone="secondary">{template.description}</Text>
            {template.suggestedColumns.length > 0 ? (
              <Text variant="caption" tone="secondary">
                Zusätzliche Spalten: {template.suggestedColumns.join(', ')}
              </Text>
            ) : null}
            <Button
              label="Mit dieser Vorlage starten"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/neu',
                  params: { kategorie: template.category, vorlage: template.title },
                })
              }
            />
          </Card>
        ))}

        <Card>
          <View style={layoutStyles.rowBetween}>
            <Text variant="heading">Erweiterte Vorlagen</Text>
            <ComingSoonBadge />
          </View>
          <Text tone="secondary">
            Eigenes Logo, eigene Akzentfarbe und weitere Layouts im Tarif Business.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
