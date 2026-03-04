import { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { MessageSquare, X } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { SetInput } from './SetInput';
import { useTranslation } from '@/i18n';
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
  onUpdateNotes: (setId: number, notes: string | null) => void;
  onDelete: (setId: number) => void;
}

export function WorkoutSetRow({
  set,
  setNumber,
  exerciseType,
  onUpdate,
  onUpdateNotes,
  onDelete,
}: WorkoutSetRowProps) {
  const { t } = useTranslation();
  const [showNotes, setShowNotes] = useState(!!set.notes);

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

  const handleToggleNotes = useCallback(() => {
    setShowNotes((prev) => !prev);
  }, []);

  const handleNotesChange = useCallback(
    (text: string) => {
      onUpdateNotes(set.id, text || null);
    },
    [onUpdateNotes, set.id],
  );

  const hasNotes = !!set.notes;

  return (
    <View>
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

        {/* Notes toggle */}
        <Pressable
          onPress={handleToggleNotes}
          accessibilityRole="button"
          accessibilityLabel={`${t('workout.notes')} - set ${setNumber}`}
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
              <MessageSquare
                size={14}
                color={hasNotes ? colors.brand.blue : colors.text.tertiary}
                strokeWidth={hasNotes ? 2 : 1.5}
              />
            </View>
          )}
        </Pressable>

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

      {/* Notes input (expandable) */}
      {showNotes && (
        <View style={{ marginLeft: 36, marginBottom: 4 }}>
          <TextInput
            value={set.notes ?? ''}
            onChangeText={handleNotesChange}
            placeholder={t('workout.notesPlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            multiline
            style={{
              fontSize: 13,
              color: colors.text.secondary,
              backgroundColor: colors.bg.tertiary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 8,
              minHeight: 36,
              maxHeight: 80,
            }}
            accessibilityLabel={`${t('workout.notes')} - set ${setNumber}`}
          />
        </View>
      )}
    </View>
  );
}
