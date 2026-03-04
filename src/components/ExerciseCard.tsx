import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import { ExerciseIllustration } from './ExerciseIllustration';
import { MuscleGroupBadges } from './MuscleGroupBadges';
import type { Exercise } from '@/types';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: (exercise: Exercise) => void;
}

const typeColors: Record<string, { bg: string; text: string }> = {
  weights: { bg: 'rgba(50, 145, 255, 0.12)', text: colors.brand.blue },
  calisthenics: { bg: 'rgba(34, 197, 94, 0.12)', text: colors.semantic.success },
  cardio: { bg: 'rgba(245, 158, 11, 0.12)', text: colors.semantic.warning },
  hiit: { bg: 'rgba(244, 63, 94, 0.12)', text: colors.brand.red },
  flexibility: { bg: 'rgba(148, 163, 184, 0.12)', text: colors.theme.slateBright },
};

function TypeBadge({ type }: { type: string }) {
  const { t } = useTranslation();
  const c = typeColors[type] ?? typeColors.weights;
  return (
    <View
      style={{
        backgroundColor: c.bg,
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 6,
        flexShrink: 0,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: c.text,
        }}
        numberOfLines={1}
      >
        {t(`type.${type}` as TranslationKey)}
      </Text>
    </View>
  );
}

export function ExerciseCard({ exercise, onPress }: ExerciseCardProps) {
  const { t } = useTranslation();
  const typeColor = typeColors[exercise.type] ?? typeColors.weights;

  return (
    <Pressable
      onPress={() => onPress(exercise)}
      accessibilityRole="button"
      accessibilityLabel={`${exercise.name}, ${t(`type.${exercise.type}` as TranslationKey)}, ${exercise.muscleGroups.map((g) => t(`muscle.${g}` as TranslationKey)).join(', ')}`}
    >
      {({ pressed }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginHorizontal: 20,
            marginVertical: 4,
            padding: 12,
            backgroundColor: pressed ? colors.bg.elevated : colors.bg.tertiary,
            borderWidth: 1,
            borderColor: colors.borderBright,
            borderLeftWidth: 3,
            borderLeftColor: typeColor.text,
            borderRadius: 10,
            opacity: pressed ? 0.9 : 1,
          }}
        >
          <ExerciseIllustration illustrationKey={exercise.illustration} size={40} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: colors.text.primary,
                  flexShrink: 1,
                }}
                numberOfLines={1}
              >
                {exercise.name}
              </Text>
              <TypeBadge type={exercise.type} />
            </View>
            <View style={{ marginTop: 4 }}>
              <MuscleGroupBadges
                muscleGroups={exercise.muscleGroups}
                primaryGroup={exercise.muscleGroup}
                compact
              />
            </View>
          </View>
          <ChevronRight size={16} color={colors.text.tertiary} strokeWidth={1.5} />
        </View>
      )}
    </Pressable>
  );
}
