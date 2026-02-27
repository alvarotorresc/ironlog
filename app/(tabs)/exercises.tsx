import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Dumbbell } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { getDatabase } from '@/db/connection';
import { ExerciseRepository } from '@/repositories/exercise.repo';
import { ExerciseCard } from '@/components/ExerciseCard';
import { EmptyState } from '@/components/ui';
import type { Exercise, MuscleGroup } from '@/types';

const MUSCLE_GROUPS: Array<{ label: string; value: MuscleGroup | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Chest', value: 'chest' },
  { label: 'Back', value: 'back' },
  { label: 'Legs', value: 'legs' },
  { label: 'Shoulders', value: 'shoulders' },
  { label: 'Arms', value: 'arms' },
  { label: 'Core', value: 'core' },
  { label: 'Full Body', value: 'full_body' },
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
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: active ? colors.brand.blue : colors.bg.tertiary,
        borderWidth: 1,
        borderColor: active ? colors.brand.blue : colors.border,
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Filter by ${label}`}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: active ? '600' : '400',
          color: active ? '#FFFFFF' : colors.text.secondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function ExercisesScreen() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<MuscleGroup | 'all'>('all');

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
          Exercises
        </Text>
        <Pressable
          onPress={handleCreatePress}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: colors.brand.blue,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
          accessibilityRole="button"
          accessibilityLabel="Create new exercise"
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 12,
          gap: 8,
        }}
      >
        {MUSCLE_GROUPS.map((group) => (
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
          {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
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
          message="No exercises yet. Create your first exercise to get started."
          actionLabel="Create Exercise"
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
