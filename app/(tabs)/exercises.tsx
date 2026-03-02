import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Dumbbell } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { getDatabase } from '@/db/connection';
import { ExerciseRepository } from '@/repositories/exercise.repo';
import { ExerciseCard } from '@/components/ExerciseCard';
import { EmptyState } from '@/components/ui';
import { useTranslation } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import type { Exercise, MuscleGroup } from '@/types';

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

export default function ExercisesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<MuscleGroup | 'all'>('all');

  const muscleGroups = useMemo(
    () =>
      MUSCLE_GROUP_VALUES.map((value) => ({
        value,
        label: value === 'all' ? t('exercises.filterAll') : t(`muscle.${value}` as TranslationKey),
      })),
    [t],
  );

  const loadExercises = useCallback(async () => {
    try {
      const db = await getDatabase();
      const repo = new ExerciseRepository(db);
      const data =
        activeFilter === 'all' ? await repo.getAll() : await repo.getByMuscleGroup(activeFilter);
      setExercises(data);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  useFocusEffect(
    useCallback(() => {
      loadExercises();
    }, [loadExercises]),
  );

  const handleExercisePress = useCallback(
    (exercise: Exercise) => {
      router.push(`/exercise/${exercise.id}`);
    },
    [router],
  );

  const handleCreatePress = useCallback(() => {
    router.push('/exercise/create');
  }, [router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: colors.text.primary,
            letterSpacing: -0.5,
          }}
        >
          {t('exercises.title')}
        </Text>
        <Pressable
          onPress={handleCreatePress}
          accessibilityRole="button"
          accessibilityLabel={t('exercises.createNew')}
        >
          {({ pressed }) => (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.brand.blue,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              }}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={2} />
            </View>
          )}
        </Pressable>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          gap: 8,
        }}
      >
        {muscleGroups.map((group) => (
          <FilterChip
            key={group.value}
            label={group.label}
            active={activeFilter === group.value}
            onPress={() => setActiveFilter(group.value)}
          />
        ))}
      </ScrollView>

      {/* Exercise count */}
      {!loading && exercises.length > 0 && (
        <Text
          style={{
            paddingHorizontal: 20,
            paddingBottom: 8,
            fontSize: 13,
            color: colors.text.tertiary,
          }}
        >
          {exercises.length !== 1
            ? t('exercises.countPlural', { count: exercises.length })
            : t('exercises.count', { count: exercises.length })}
        </Text>
      )}

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand.blue} />
        </View>
      ) : exercises.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          message={t('exercises.empty')}
          actionLabel={t('exercises.createExercise')}
          onAction={handleCreatePress}
        />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ExerciseCard exercise={item} onPress={handleExercisePress} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
