import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, ListChecks } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { getDatabase } from '@/db/connection';
import { RoutineRepository, type RoutineWithExercises } from '@/repositories/routine.repo';
import { WorkoutRepository } from '@/repositories/workout.repo';
import { RoutineCard } from '@/components/RoutineCard';
import { EmptyState } from '@/components/ui';
import { useTranslation } from '@/i18n';
import type { Routine } from '@/types';

export default function RoutinesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoutines = useCallback(async () => {
    try {
      const db = await getDatabase();
      const repo = new RoutineRepository(db);
      const data = await repo.getAllWithExercises();
      setRoutines(data);
    } catch (error) {
      console.error('Failed to load routines:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [loadRoutines]),
  );

  const handleRoutinePress = useCallback(
    (routine: Routine) => {
      router.push(`/routine/${routine.id}`);
    },
    [router],
  );

  const handleStartPress = useCallback(
    async (routine: Routine) => {
      try {
        const db = await getDatabase();
        const workoutRepo = new WorkoutRepository(db);
        const workout = await workoutRepo.start(routine.id);
        router.push(`/workout/${routine.id}?workoutId=${workout.id}`);
      } catch (error) {
        console.error('Failed to start workout:', error);
      }
    },
    [router],
  );

  const handleCreatePress = useCallback(() => {
    router.push('/routine/create');
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
          {t('routines.title')}
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
          accessibilityLabel={t('routines.createNew')}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </View>

      {/* Routine count */}
      {!loading && routines.length > 0 && (
        <Text
          style={{
            paddingHorizontal: 20,
            paddingBottom: 8,
            fontSize: 13,
            color: colors.text.tertiary,
          }}
        >
          {routines.length} routine{routines.length !== 1 ? 's' : ''}
        </Text>
      )}

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand.blue} />
        </View>
      ) : routines.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          message={t('routines.empty')}
          actionLabel={t('routines.createRoutine')}
          onAction={handleCreatePress}
        />
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <RoutineCard
              routine={item}
              exercises={item.exercises.map((re) => ({
                exerciseId: re.exercise.id,
                exerciseName: re.exercise.name,
                illustration: re.exercise.illustration,
              }))}
              onPress={handleRoutinePress}
              onStart={handleStartPress}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: 32,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
