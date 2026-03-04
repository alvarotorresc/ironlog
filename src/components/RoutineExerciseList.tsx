import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronUp, ChevronDown, Trash2, StickyNote } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { ExerciseIllustration } from './ExerciseIllustration';
import type { RoutineExerciseItem } from '@/hooks/useRoutineForm';

function formatMuscleGroup(group: string): string {
  return group
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface RoutineExerciseListProps {
  exercises: RoutineExerciseItem[];
  onRemove: (index: number) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
}

function RoutineExerciseRow({
  exercise,
  index,
  isFirst,
  isLast,
  onRemove,
  onMove,
}: {
  exercise: RoutineExerciseItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
}) {
  const [notesExpanded, setNotesExpanded] = useState(false);
  const hasNotes = Boolean(exercise.notes);

  return (
    <View
      style={{
        backgroundColor: colors.bg.secondary,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
        }}
      >
        {/* Order number */}
        <Text
          style={{
            width: 24,
            fontSize: 14,
            fontWeight: '600',
            color: colors.text.tertiary,
            textAlign: 'center',
          }}
        >
          {index + 1}
        </Text>

        {/* Illustration */}
        <ExerciseIllustration illustrationKey={exercise.illustration} size={36} />

        {/* Name + muscle group */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '500',
                color: colors.text.primary,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {exercise.name}
            </Text>
            {hasNotes && (
              <Pressable
                onPress={() => setNotesExpanded((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={`${notesExpanded ? 'Hide' : 'Show'} notes for ${exercise.name}`}
              >
                {({ pressed }) => (
                  <View style={{ opacity: pressed ? 0.5 : 1, padding: 2 }}>
                    <StickyNote size={14} color={colors.brand.blue} strokeWidth={1.5} />
                  </View>
                )}
              </Pressable>
            )}
          </View>
          <Text
            style={{
              fontSize: 12,
              color: colors.text.tertiary,
              marginTop: 1,
            }}
          >
            {formatMuscleGroup(exercise.muscleGroup)}
          </Text>
        </View>

        {/* Reorder buttons */}
        <View style={{ flexDirection: 'row', gap: 2 }}>
          <Pressable
            onPress={() => onMove(index, 'up')}
            disabled={isFirst}
            accessibilityRole="button"
            accessibilityLabel={`Move ${exercise.name} up`}
          >
            {({ pressed }) => (
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  backgroundColor: pressed ? colors.bg.tertiary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isFirst ? 0.3 : pressed ? 0.7 : 1,
                }}
              >
                <ChevronUp size={18} color={colors.text.secondary} strokeWidth={1.5} />
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={() => onMove(index, 'down')}
            disabled={isLast}
            accessibilityRole="button"
            accessibilityLabel={`Move ${exercise.name} down`}
          >
            {({ pressed }) => (
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  backgroundColor: pressed ? colors.bg.tertiary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isLast ? 0.3 : pressed ? 0.7 : 1,
                }}
              >
                <ChevronDown size={18} color={colors.text.secondary} strokeWidth={1.5} />
              </View>
            )}
          </Pressable>
        </View>

        {/* Remove button */}
        <Pressable
          onPress={() => onRemove(index)}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${exercise.name}`}
        >
          {({ pressed }) => (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: pressed ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              }}
            >
              <Trash2 size={16} color={colors.semantic.error} strokeWidth={1.5} />
            </View>
          )}
        </Pressable>
      </View>

      {/* Notes expandable */}
      {hasNotes && notesExpanded && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 12,
            paddingLeft: 52,
          }}
        >
          <View
            style={{
              backgroundColor: colors.accent.blue10,
              borderRadius: 8,
              padding: 10,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: colors.text.secondary,
                lineHeight: 18,
              }}
            >
              {exercise.notes}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

export function RoutineExerciseList({ exercises, onRemove, onMove }: RoutineExerciseListProps) {
  if (exercises.length === 0) return null;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {exercises.map((exercise, index) => (
        <RoutineExerciseRow
          key={`${exercise.exerciseId}-${index}`}
          exercise={exercise}
          index={index}
          isFirst={index === 0}
          isLast={index === exercises.length - 1}
          onRemove={onRemove}
          onMove={onMove}
        />
      ))}
    </View>
  );
}
