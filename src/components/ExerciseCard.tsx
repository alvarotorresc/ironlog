import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { ExerciseIllustration } from './ExerciseIllustration';
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
  const c = typeColors[type] ?? typeColors.weights;
  return (
    <View
      style={{
        backgroundColor: c.bg,
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 6,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: c.text,
          textTransform: 'capitalize',
        }}
      >
        {type}
      </Text>
    </View>
  );
}

function formatMuscleGroup(group: string): string {
  return group
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function ExerciseCard({ exercise, onPress }: ExerciseCardProps) {
  return (
    <Pressable
      onPress={() => onPress(exercise)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginHorizontal: 20,
        marginVertical: 4,
        padding: 12,
        backgroundColor: pressed ? colors.bg.elevated : colors.bg.secondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
      })}
      accessibilityRole="button"
      accessibilityLabel={`${exercise.name}, ${exercise.type}, ${formatMuscleGroup(exercise.muscleGroup)}`}
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
        <Text style={{ fontSize: 12, color: colors.text.tertiary, marginTop: 2 }}>
          {formatMuscleGroup(exercise.muscleGroup)}
        </Text>
      </View>
      <ChevronRight size={16} color={colors.text.tertiary} strokeWidth={1.5} />
    </Pressable>
  );
}
