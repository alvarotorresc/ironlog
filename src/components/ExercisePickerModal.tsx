import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { X, Check, Search } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import { getDatabase } from '@/db/connection';
import { ExerciseRepository } from '@/repositories/exercise.repo';
import { ExerciseIllustration } from './ExerciseIllustration';
import { MuscleGroupBadges } from './MuscleGroupBadges';
import type { Exercise, MuscleGroup, ExerciseType } from '@/types';

const MUSCLE_GROUP_VALUES: Array<MuscleGroup | 'all'> = [
  'all',
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'full_body',
];

const EXERCISE_TYPE_VALUES: Array<ExerciseType | 'all'> = [
  'all',
  'weights',
  'calisthenics',
  'cardio',
  'hiit',
  'flexibility',
];

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Filter by ${label}`}
    >
      {({ pressed }) => (
        <View
          style={{
            height: 32,
            paddingHorizontal: 14,
            borderRadius: 16,
            backgroundColor: active ? colors.brand.blue : colors.bg.tertiary,
            borderWidth: 1,
            borderColor: active ? colors.brand.blue : colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: active ? '600' : '400',
              color: active ? '#FFFFFF' : colors.text.secondary,
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

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
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ExerciseType | 'all'>('all');

  useEffect(() => {
    if (!visible) return;
    setSearchQuery('');
    setMuscleFilter('all');
    setTypeFilter('all');

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

  const muscleGroups = useMemo(
    () =>
      MUSCLE_GROUP_VALUES.map((v) => ({
        value: v,
        label: t(v === 'all' ? 'exercisePicker.filterAll' : (`muscle.${v}` as TranslationKey)),
      })),
    [t],
  );

  const exerciseTypes = useMemo(
    () =>
      EXERCISE_TYPE_VALUES.map((v) => ({
        value: v,
        label: t(v === 'all' ? 'exercisePicker.filterAll' : (`type.${v}` as TranslationKey)),
      })),
    [t],
  );

  const filteredExercises = useMemo(() => {
    let result = exercises;

    if (muscleFilter !== 'all') {
      result = result.filter((e) => e.muscleGroups.includes(muscleFilter));
    }

    if (typeFilter !== 'all') {
      result = result.filter((e) => e.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.muscleGroups.some((g) => g.toLowerCase().includes(q)) ||
          e.muscleGroup.toLowerCase().includes(q),
      );
    }

    return result;
  }, [exercises, muscleFilter, typeFilter, searchQuery]);

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
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              {({ pressed }) => (
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: colors.bg.tertiary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.7 : 1,
                  }}
                >
                  <X size={18} color={colors.text.secondary} strokeWidth={1.5} />
                </View>
              )}
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

          {/* Muscle group filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 10 }}
          >
            {muscleGroups.map((group) => (
              <FilterChip
                key={group.value}
                label={group.label}
                active={muscleFilter === group.value}
                onPress={() => setMuscleFilter(group.value)}
              />
            ))}
          </ScrollView>

          {/* Exercise type filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 2 }}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 10 }}
          >
            {exerciseTypes.map((type) => (
              <FilterChip
                key={type.value}
                label={type.label}
                active={typeFilter === type.value}
                onPress={() => setTypeFilter(type.value)}
              />
            ))}
          </ScrollView>

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
                    accessibilityRole="button"
                    accessibilityLabel={`${isSelected ? 'Already added: ' : 'Add '}${item.name}`}
                  >
                    {({ pressed }) => (
                      <View
                        style={{
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
                        }}
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
                            <MuscleGroupBadges
                              muscleGroups={item.muscleGroups}
                              primaryGroup={item.muscleGroup}
                              compact
                            />
                          </View>
                        </View>
                        {isSelected && (
                          <Check size={18} color={colors.brand.blue} strokeWidth={2} />
                        )}
                      </View>
                    )}
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
