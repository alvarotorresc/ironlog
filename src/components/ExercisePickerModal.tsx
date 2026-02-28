import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { X, Check, Search } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import type { TranslationKey } from '@/i18n';
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

export function ExercisePickerModal({
  visible,
  onClose,
  onSelect,
  selectedExerciseIds,
}: ExercisePickerModalProps) {
  const { t } = useTranslation();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!visible) return;
    setSearchQuery('');

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

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return exercises;
    const q = searchQuery.toLowerCase();
    return exercises.filter(
      (e) => e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q),
    );
  }, [exercises, searchQuery]);

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
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.text.primary,
              }}
            >
              {t('exercisePicker.title')}
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
              accessibilityLabel={t('common.close')}
            >
              <X size={18} color={colors.text.secondary} strokeWidth={1.5} />
            </Pressable>
          </View>

          {/* Search bar */}
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.bg.tertiary,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              height: 40,
              gap: 8,
            }}
          >
            <Search size={16} color={colors.text.tertiary} strokeWidth={1.5} />
            <TextInput
              placeholder={t('exercisePicker.search')}
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                fontSize: 14,
                color: colors.text.primary,
                padding: 0,
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={{ height: 1, backgroundColor: colors.border }} />

          {/* Exercise list */}
          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
              <ActivityIndicator size="large" color={colors.brand.blue} />
            </View>
          ) : (
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = selectedExerciseIds.includes(item.id);
                return (
                  <Pressable
                    onPress={() => handleSelect(item)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      backgroundColor: pressed
                        ? colors.bg.tertiary
                        : isSelected
                          ? colors.accent.blue10
                          : 'transparent',
                    })}
                    accessibilityRole="button"
                    accessibilityLabel={`${isSelected ? 'Already added: ' : 'Add '}${item.name}`}
                  >
                    <ExerciseIllustration illustrationKey={item.illustration} size={34} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: '500',
                            color: isSelected ? colors.text.tertiary : colors.text.primary,
                            flex: 1,
                          }}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.text.tertiary,
                            flexShrink: 0,
                          }}
                          numberOfLines={1}
                        >
                          {t(`muscle.${item.muscleGroup}` as TranslationKey)}
                        </Text>
                      </View>
                    </View>
                    {isSelected && <Check size={18} color={colors.brand.blue} strokeWidth={2} />}
                  </Pressable>
                );
              }}
              contentContainerStyle={{ paddingBottom: 34 }}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 64 }} />
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
