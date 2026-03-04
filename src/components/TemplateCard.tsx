import { View, Text, Pressable } from 'react-native';
import { BookTemplate } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import type { RoutineWithExercises } from '@/repositories/routine.repo';

interface TemplateCardProps {
  template: RoutineWithExercises;
  onPress: (template: RoutineWithExercises) => void;
}

export function TemplateCard({ template, onPress }: TemplateCardProps) {
  const { t } = useTranslation();
  const exerciseCount = template.exercises.length;

  return (
    <Pressable
      onPress={() => onPress(template)}
      accessibilityRole="button"
      accessibilityLabel={`${template.name}, ${exerciseCount} exercises`}
    >
      {({ pressed }) => (
        <View
          style={{
            width: 160,
            backgroundColor: pressed ? colors.bg.elevated : colors.bg.tertiary,
            borderWidth: 1,
            borderColor: colors.borderBright,
            borderRadius: 12,
            padding: 14,
            opacity: pressed ? 0.85 : 1,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: colors.accent.blue10,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}
          >
            <BookTemplate size={16} color={colors.brand.blue} strokeWidth={1.5} />
          </View>

          {/* Name */}
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: colors.text.primary,
              letterSpacing: -0.2,
              marginBottom: 4,
            }}
            numberOfLines={1}
          >
            {template.name}
          </Text>

          {/* Exercise count */}
          <Text
            style={{
              fontSize: 12,
              color: colors.text.secondary,
            }}
          >
            {t('routines.templateExercises', { count: exerciseCount })}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
