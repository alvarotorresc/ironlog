import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Clock, ChevronRight, Dumbbell, Timer, Archive } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { getDatabase } from '@/db/connection';
import { WorkoutRepository } from '@/repositories/workout.repo';
import { EmptyState } from '@/components/ui';
import { useTranslation } from '@/i18n';
import type { WorkoutHistoryItem } from '@/types';

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString + 'Z');
  const now = new Date();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = todayStart.getTime() - dateDay.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatDuration(startedAt: string, finishedAt: string): string {
  const start = new Date(startedAt + 'Z');
  const end = new Date(finishedAt + 'Z');
  const totalSeconds = Math.round((end.getTime() - start.getTime()) / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString + 'Z');
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function HistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const db = await getDatabase();
      const repo = new WorkoutRepository(db);
      const data = await repo.getHistoryWithRoutineNames();
      setWorkouts(data);
    } catch (error) {
      console.error('Failed to load workout history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  const handleWorkoutPress = useCallback(
    (workoutId: number) => {
      router.push(`/workout/detail/${workoutId}`);
    },
    [router],
  );

  const handleDeleteWorkout = useCallback(
    (workoutId: number) => {
      Alert.alert(t('history.deleteTitle'), t('history.deleteMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              const repo = new WorkoutRepository(db);
              await repo.delete(workoutId);
              setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
            } catch (error) {
              console.error('Failed to delete workout:', error);
            }
          },
        },
      ]);
    },
    [t],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: colors.text.primary,
            letterSpacing: -0.5,
            flex: 1,
          }}
        >
          {t('history.title')}
        </Text>

        <Pressable
          onPress={() => router.push('/backup')}
          accessibilityRole="button"
          accessibilityLabel="Backup & Restore"
        >
          {({ pressed }) => (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.bg.tertiary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              }}
            >
              <Archive size={18} color={colors.text.secondary} strokeWidth={1.5} />
            </View>
          )}
        </Pressable>
      </View>

      {/* Workout count */}
      {!loading && workouts.length > 0 && (
        <Text
          style={{
            paddingHorizontal: 20,
            paddingBottom: 8,
            fontSize: 13,
            color: colors.text.tertiary,
          }}
        >
          {workouts.length} workout{workouts.length !== 1 ? 's' : ''}
        </Text>
      )}

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand.blue} />
        </View>
      ) : workouts.length === 0 ? (
        <EmptyState icon={Clock} message={t('history.empty')} />
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <HistoryItem
              workout={item}
              onPress={handleWorkoutPress}
              onDelete={handleDeleteWorkout}
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

interface HistoryItemProps {
  workout: WorkoutHistoryItem;
  onPress: (workoutId: number) => void;
  onDelete: (workoutId: number) => void;
}

function HistoryItem({ workout, onPress, onDelete }: HistoryItemProps) {
  const routineLabel = workout.routineName ?? 'Free Workout';
  const dateLabel = formatRelativeDate(workout.startedAt);
  const timeLabel = formatTime(workout.startedAt);
  const durationLabel = workout.finishedAt
    ? formatDuration(workout.startedAt, workout.finishedAt)
    : '--';

  return (
    <Pressable
      onPress={() => onPress(workout.id)}
      onLongPress={() => onDelete(workout.id)}
      delayLongPress={500}
      accessibilityRole="button"
      accessibilityLabel={`View ${routineLabel} workout from ${dateLabel}. Long press to delete.`}
    >
      {({ pressed }) => (
        <View
          style={{
            backgroundColor: pressed ? colors.bg.elevated : colors.bg.secondary,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 16,
            opacity: pressed ? 0.85 : 1,
          }}
        >
          {/* Top row: routine name + chevron */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.text.primary,
                flex: 1,
                marginRight: 8,
              }}
              numberOfLines={1}
            >
              {routineLabel}
            </Text>
            <ChevronRight size={18} color={colors.text.tertiary} strokeWidth={1.5} />
          </View>

          {/* Bottom row: date, duration, exercises */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {/* Date + time */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={13} color={colors.text.secondary} strokeWidth={1.5} />
              <Text style={{ fontSize: 13, color: colors.text.secondary }}>
                {dateLabel} {timeLabel}
              </Text>
            </View>

            {/* Duration */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Timer size={13} color={colors.text.secondary} strokeWidth={1.5} />
              <Text style={{ fontSize: 13, color: colors.text.secondary }}>{durationLabel}</Text>
            </View>

            {/* Exercise count */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Dumbbell size={13} color={colors.text.secondary} strokeWidth={1.5} />
              <Text style={{ fontSize: 13, color: colors.text.secondary }}>
                {workout.exerciseCount}
              </Text>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}
