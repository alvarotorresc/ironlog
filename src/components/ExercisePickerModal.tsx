import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, ActivityIndicator } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { getDatabase } from '@/db/connection';
import { ExerciseRepository } from '@/repositories/exercise.repo';
import { ExerciseIllustration } from './ExerciseIllustration';
import type { Exercise } from '@/types';

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  selectedExerciseIds: number[];
}

function formatMuscleGroup(group: string): string {
  return group
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function ExercisePickerModal({
  visible,
  onClose,
  onSelect,
  selectedExerciseIds,
}: ExercisePickerModalProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;

    async function load() {
      try {
        setLoading(true);
        const db = await getDatabase();
        const repo = new ExerciseRepository(db);
        const data = await repo.getAll();
        setExercises(data);
      } catch (error) {
        console.error('Failed to load exercises for picker:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [visible]);

  const handleSelect = useCallback(
    (exercise: Exercise) => {
      onSelect(exercise);
    },
    [onSelect],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: colors.bg.elevated,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '80%',
            minHeight: '50%',
          }}
        >
          {/* Handle */}
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.text.tertiary,
              marginTop: 12,
              marginBottom: 8,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.text.primary,
              }}
            >
              Add Exercise
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: colors.bg.tertiary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
              accessibilityRole="button"
              accessibilityLabel="Close exercise picker"
            >
              <X size={18} color={colors.text.secondary} strokeWidth={1.5} />
            </Pressable>
          </View>

          {/* Exercise list */}
          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
              <ActivityIndicator size="large" color={colors.brand.blue} />
            </View>
          ) : (
            <FlatList
              data={exercises}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const isSelected = selectedExerciseIds.includes(item.id);
                return (
                  <Pressable
                    onPress={() => handleSelect(item)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      backgroundColor: pressed ? colors.bg.tertiary : 'transparent',
                    })}
                    accessibilityRole="button"
                    accessibilityLabel={`${isSelected ? 'Already added: ' : 'Add '}${item.name}`}
                  >
                    <ExerciseIllustration illustrationKey={item.illustration} size={40} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '500',
                          color: isSelected ? colors.text.tertiary : colors.text.primary,
                        }}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.text.tertiary,
                          marginTop: 2,
                        }}
                      >
                        {formatMuscleGroup(item.muscleGroup)}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color={colors.brand.blue} strokeWidth={2} />}
                  </Pressable>
                );
              }}
              contentContainerStyle={{ paddingBottom: 34 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
