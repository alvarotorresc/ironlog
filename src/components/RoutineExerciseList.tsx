import { View, Text, Pressable } from 'react-native';
import { ChevronUp, ChevronDown, Trash2, Unlink } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { ExerciseIllustration } from './ExerciseIllustration';
import {
  ExerciseGroupBadge,
  getGroupLetterFromId,
  getGroupBorderColor,
} from './ExerciseGroupBadge';
import { useTranslation } from '@/i18n';
import type { RoutineExerciseItem } from '@/hooks/useRoutineForm';
import type { GroupType } from '@/types';

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
  selectedIndices?: Set<number>;
  onToggleSelect?: (index: number) => void;
  onUngroupAll?: (groupId: number) => void;
}

function RoutineExerciseRow({
  exercise,
  index,
  isFirst,
  isLast,
  isSelected,
  onRemove,
  onMove,
  onToggleSelect,
  groupLetter,
  isFirstInGroup,
  isLastInGroup,
  onUngroupAll,
}: {
  exercise: RoutineExerciseItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isSelected: boolean;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onToggleSelect?: (index: number) => void;
  groupLetter: string | null;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  onUngroupAll?: (groupId: number) => void;
}) {
  const { t } = useTranslation();
  const hasGroup = exercise.groupId !== null && exercise.groupType !== null;
  const borderColor = hasGroup ? getGroupBorderColor(exercise.groupType as GroupType) : undefined;

  return (
    <View>
      {/* Group badge header - show only for first exercise in group */}
      {hasGroup && isFirstInGroup && groupLetter && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 4,
            backgroundColor: colors.bg.secondary,
            borderLeftWidth: 3,
            borderLeftColor: borderColor,
          }}
        >
          <ExerciseGroupBadge groupType={exercise.groupType as GroupType} letter={groupLetter} />
          {onUngroupAll && exercise.groupId !== null && (
            <Pressable
              onPress={() => onUngroupAll(exercise.groupId!)}
              accessibilityRole="button"
              accessibilityLabel={t('group.ungroup')}
              hitSlop={8}
            >
              {({ pressed }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                    backgroundColor: pressed ? colors.bg.tertiary : 'transparent',
                    opacity: pressed ? 0.7 : 1,
                  }}
                >
                  <Unlink size={12} color={colors.text.tertiary} strokeWidth={2} />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '500',
                      color: colors.text.tertiary,
                    }}
                  >
                    {t('group.ungroup')}
                  </Text>
                </View>
              )}
            </Pressable>
          )}
        </View>
      )}

      <Pressable
        onLongPress={onToggleSelect ? () => onToggleSelect(index) : undefined}
        onPress={onToggleSelect && isSelected ? () => onToggleSelect(index) : undefined}
        accessibilityRole={onToggleSelect ? 'checkbox' : undefined}
        accessibilityState={onToggleSelect ? { checked: isSelected } : undefined}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: isSelected ? colors.accent.blue10 : colors.bg.secondary,
            borderBottomWidth: isLast || (hasGroup && isLastInGroup && !isLast) ? 0 : 1,
            borderBottomColor: colors.border,
            borderLeftWidth: hasGroup ? 3 : 0,
            borderLeftColor: borderColor,
          }}
        >
          {/* Selection indicator or order number */}
          {onToggleSelect ? (
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: isSelected ? colors.brand.blue : colors.text.tertiary,
                backgroundColor: isSelected ? colors.brand.blue : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isSelected && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#FFFFFF',
                  }}
                />
              )}
            </View>
          ) : (
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
          )}

          {/* Illustration */}
          <ExerciseIllustration illustrationKey={exercise.illustration} size={36} />

          {/* Name + muscle group */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '500',
                color: colors.text.primary,
              }}
              numberOfLines={1}
            >
              {exercise.name}
            </Text>
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

          {/* Reorder buttons - only in non-selection mode */}
          {!onToggleSelect && (
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
          )}

          {/* Remove button - only in non-selection mode */}
          {!onToggleSelect && (
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
          )}
        </View>
      </Pressable>
    </View>
  );
}

export function RoutineExerciseList({
  exercises,
  onRemove,
  onMove,
  selectedIndices,
  onToggleSelect,
  onUngroupAll,
}: RoutineExerciseListProps) {
  if (exercises.length === 0) return null;

  const allGroupIds = exercises.map((e) => e.groupId).filter((id): id is number => id !== null);

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {exercises.map((exercise, index) => {
        const groupLetter =
          exercise.groupId !== null ? getGroupLetterFromId(exercise.groupId, allGroupIds) : null;

        const isFirstInGroup =
          exercise.groupId !== null &&
          (index === 0 || exercises[index - 1].groupId !== exercise.groupId);

        const isLastInGroup =
          exercise.groupId !== null &&
          (index === exercises.length - 1 || exercises[index + 1].groupId !== exercise.groupId);

        return (
          <RoutineExerciseRow
            key={`${exercise.exerciseId}-${index}`}
            exercise={exercise}
            index={index}
            isFirst={index === 0}
            isLast={index === exercises.length - 1}
            isSelected={selectedIndices?.has(index) ?? false}
            onRemove={onRemove}
            onMove={onMove}
            onToggleSelect={onToggleSelect}
            groupLetter={groupLetter}
            isFirstInGroup={isFirstInGroup}
            isLastInGroup={isLastInGroup}
            onUngroupAll={onUngroupAll}
          />
        );
      })}
    </View>
  );
}
