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
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        opacity: pressed ? 0.7 : 1,
      })}
      accessibilityRole="button"
      accessibilityLabel={`${exercise.name}, ${exercise.type}, ${formatMuscleGroup(exercise.muscleGroup)}`}
    >
      <ExerciseIllustration illustrationKey={exercise.illustration} size={44} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text.primary,
            marginBottom: 4,
          }}
          numberOfLines={1}
        >
          {exercise.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TypeBadge type={exercise.type} />
          <Text style={{ fontSize: 12, color: colors.text.tertiary }}>
            {formatMuscleGroup(exercise.muscleGroup)}
          </Text>
        </View>
      </View>
      <ChevronRight size={16} color={colors.text.tertiary} strokeWidth={1.5} />
    </Pressable>
  );
}
