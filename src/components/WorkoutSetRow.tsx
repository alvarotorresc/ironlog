import { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { SetInput } from './SetInput';
import type { ExerciseType, WorkoutSet } from '@/types';

interface WorkoutSetRowProps {
  set: WorkoutSet;
  setNumber: number;
  exerciseType: ExerciseType;
  onUpdate: (
    setId: number,
    data: {
      weight?: number | null;
      reps?: number | null;
      duration?: number | null;
      distance?: number | null;
    },
  ) => void;
  onDelete: (setId: number) => void;
}

export function WorkoutSetRow({
  set,
  setNumber,
  exerciseType,
  onUpdate,
  onDelete,
}: WorkoutSetRowProps) {
  const handleUpdate = useCallback(
    (data: {
      weight?: number | null;
      reps?: number | null;
      duration?: number | null;
      distance?: number | null;
    }) => {
      onUpdate(set.id, data);
    },
    [onUpdate, set.id],
  );

  const handleDelete = useCallback(() => {
    onDelete(set.id);
  }, [onDelete, set.id]);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
      }}
    >
      {/* Set number */}
      <View style={{ width: 28, alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.text.secondary,
          }}
        >
          {setNumber}
        </Text>
      </View>

      {/* Dynamic fields based on exercise type */}
      <SetInput set={set} exerciseType={exerciseType} onUpdate={handleUpdate} />

      {/* Delete button */}
      <Pressable
        onPress={handleDelete}
        accessibilityRole="button"
        accessibilityLabel={`Delete set ${setNumber}`}
        hitSlop={8}
      >
        {({ pressed }) => (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.5 : 1,
            }}
          >
            <X size={16} color={colors.text.tertiary} strokeWidth={2} />
          </View>
        )}
      </Pressable>
    </View>
  );
}
