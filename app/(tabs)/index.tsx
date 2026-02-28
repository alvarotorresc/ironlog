import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Play,
  Dumbbell,
  X,
  ListChecks,
  Calendar,
  Flame,
  TrendingUp,
  BarChart3,
  Trophy,
  PieChart,
  Target,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { getDatabase } from '@/db/connection';
import { RoutineRepository, type RoutineWithExercises } from '@/repositories/routine.repo';
import { WorkoutRepository } from '@/repositories/workout.repo';
import { ExerciseIllustration } from '@/components/ExerciseIllustration';
import { StatsCard } from '@/components/StatsCard';
import { MuscleDistribution } from '@/components/MuscleDistribution';
import { PeriodSelector } from '@/components/PeriodSelector';
import { useDashboardStats, useMuscleDistribution, useMuscleFatigue } from '@/hooks/useStats';
import { MuscleFatigueMap } from '@/components/MuscleFatigueMap';
import type { ExercisePR, TimePeriod } from '@/types';

function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k kg`;
  }
  return `${volume} kg`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${day}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(false);
  const [starting, setStarting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [musclePeriod, setMusclePeriod] = useState<TimePeriod>('1m');

  const { stats, isLoading: statsLoading, reload: reloadStats } = useDashboardStats();
  const {
    distribution,
    isLoading: distributionLoading,
    reload: reloadDistribution,
  } = useMuscleDistribution(musclePeriod);
  const { fatigueData, reload: reloadFatigue } = useMuscleFatigue();

  const loadRoutines = useCallback(async () => {
    setLoadingRoutines(true);
    try {
      const db = await getDatabase();
      const repo = new RoutineRepository(db);
      const data = await repo.getAllWithExercises();
      setRoutines(data);
    } catch (error) {
      console.error('Failed to load routines:', error);
    } finally {
      setLoadingRoutines(false);
    }
  }, []);

  const handleStartPress = useCallback(() => {
    loadRoutines();
    setShowPicker(true);
  }, [loadRoutines]);

  const handleSelectRoutine = useCallback(
    async (routineId: number) => {
      if (starting) return;
      setStarting(true);
      try {
        const db = await getDatabase();
        const workoutRepo = new WorkoutRepository(db);
        const workout = await workoutRepo.start(routineId);
        setShowPicker(false);
        router.push(`/workout/${routineId}?workoutId=${workout.id}`);
      } catch (error) {
        console.error('Failed to start workout:', error);
      } finally {
        setStarting(false);
      }
    },
    [router, starting],
  );

  const handleStartEmpty = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    try {
      const db = await getDatabase();
      const workoutRepo = new WorkoutRepository(db);
      const workout = await workoutRepo.start();
      setShowPicker(false);
      router.push(`/workout/empty?workoutId=${workout.id}`);
    } catch (error) {
      console.error('Failed to start empty workout:', error);
    } finally {
      setStarting(false);
    }
  }, [router, starting]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([reloadStats(), reloadDistribution(), reloadFatigue()]);
    setRefreshing(false);
  }, [reloadStats, reloadDistribution, reloadFatigue]);

  useFocusEffect(
    useCallback(() => {
      reloadStats();
      reloadDistribution();
      reloadFatigue();
    }, [reloadStats, reloadDistribution, reloadFatigue]),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand.blue}
            colors={[colors.brand.blue]}
          />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: colors.text.primary,
              letterSpacing: -0.5,
              marginTop: 2,
            }}
          >
            {t('home.title')}
          </Text>
        </View>

        {/* Start Workout CTA */}
        <CTAButton onPress={handleStartPress} />

        {/* Welcome state when no workouts yet */}
        {stats && stats.totalWorkouts === 0 && !statsLoading ? (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 20,
              padding: 24,
              backgroundColor: colors.bg.secondary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                backgroundColor: colors.accent.blue10,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <Target size={28} color={colors.brand.blue} strokeWidth={1.5} />
            </View>
            <Text
              style={{
                fontSize: 17,
                fontWeight: '700',
                color: colors.text.primary,
                marginBottom: 6,
              }}
            >
              {t('home.readyTitle')}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.text.secondary,
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              {t('home.readyMessage')}
            </Text>
          </View>
        ) : null}

        {/* Stats Grid */}
        {statsLoading && !stats ? (
          <View style={{ paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.brand.blue} />
          </View>
        ) : stats && stats.totalWorkouts > 0 ? (
          <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatsCard
                label={t('home.thisWeek')}
                value={String(stats.workoutsThisWeek)}
                icon={Calendar}
                accentColor={colors.brand.blue}
              />
              <StatsCard
                label={t('home.streak')}
                value={stats.currentStreak > 0 ? `${stats.currentStreak} \uD83D\uDD25` : '0'}
                icon={Flame}
                color={stats.currentStreak > 0 ? colors.semantic.warning : undefined}
                accentColor={colors.semantic.warning}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <StatsCard
                label={t('home.totalLifted')}
                value={formatVolume(stats.volumeThisWeek)}
                icon={TrendingUp}
                accentColor={colors.semantic.success}
              />
              <StatsCard
                label={t('home.thisMonth')}
                value={String(stats.workoutsThisMonth)}
                icon={BarChart3}
                accentColor={colors.theme.slate}
              />
            </View>
          </View>
        ) : null}

        {/* Recent PRs */}
        {stats && stats.totalWorkouts > 0 ? (
          <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Trophy size={18} color={colors.chart.pr} strokeWidth={1.5} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.text.primary,
                }}
              >
                {t('home.recentPRs')}
              </Text>
            </View>
            {stats.recentPRs.length > 0 ? (
              <View
                style={{
                  backgroundColor: colors.bg.secondary,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                {stats.recentPRs.slice(0, 5).map((pr, index) => (
                  <PRRow
                    key={`${pr.exerciseId}-${pr.date}`}
                    pr={pr}
                    isLast={index === Math.min(stats.recentPRs.length, 5) - 1}
                  />
                ))}
              </View>
            ) : (
              <Text
                style={{
                  fontSize: 14,
                  color: colors.text.tertiary,
                  fontStyle: 'italic',
                }}
              >
                {t('home.noPRs')}
              </Text>
            )}
          </View>
        ) : null}

        {/* Muscle Distribution */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PieChart size={18} color={colors.brand.blue} strokeWidth={1.5} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.text.primary,
                }}
              >
                {t('home.muscleDistribution')}
              </Text>
            </View>
          </View>
          <View style={{ marginBottom: 12 }}>
            <PeriodSelector value={musclePeriod} onChange={setMusclePeriod} />
          </View>
          {distributionLoading && distribution.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <ActivityIndicator size="small" color={colors.brand.blue} />
            </View>
          ) : (
            <MuscleDistribution data={distribution} />
          )}
        </View>

        {/* Muscle Fatigue */}
        {fatigueData.length > 0 && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Target size={18} color={colors.semantic.warning} strokeWidth={1.5} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.text.primary,
                }}
              >
                {t('home.muscleFatigue')}
              </Text>
            </View>
            <MuscleFatigueMap data={fatigueData} />
          </View>
        )}

        {/* Footer */}
        <Text
          style={{
            fontSize: 12,
            color: colors.text.tertiary,
            textAlign: 'center',
            marginTop: 24,
          }}
        >
          Made with {'\uD83C\uDFCB\uFE0F'} by Alvaro Torres
        </Text>
      </ScrollView>

      {/* Routine Picker Modal */}
      <Modal
        visible={showPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPicker(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.bg.primary,
            paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 32) : 0,
          }}
        >
          {/* Modal Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.text.primary,
                letterSpacing: -0.3,
              }}
            >
              {t('home.selectRoutine')}
            </Text>
            <Pressable
              onPress={() => setShowPicker(false)}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.bg.tertiary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={20} color={colors.text.secondary} strokeWidth={2} />
            </Pressable>
          </View>

          {/* Start Empty Workout option (only when routines exist) */}
          {!loadingRoutines && routines.length > 0 && (
            <>
              <Pressable
                onPress={handleStartEmpty}
                disabled={starting}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginHorizontal: 20,
                  marginTop: 16,
                  marginBottom: 8,
                  padding: 16,
                  backgroundColor: pressed ? colors.bg.elevated : colors.bg.secondary,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  borderStyle: 'dashed',
                  opacity: starting ? 0.5 : 1,
                })}
                accessibilityRole="button"
                accessibilityLabel="Start empty workout without a routine"
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: colors.bg.tertiary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Dumbbell size={20} color={colors.text.tertiary} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: colors.text.primary,
                    }}
                  >
                    {t('home.emptyWorkout')}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.text.secondary,
                      marginTop: 2,
                    }}
                  >
                    {t('home.emptyWorkoutDesc')}
                  </Text>
                </View>
              </Pressable>

              {/* Divider */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  gap: 12,
                }}
              >
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                <Text style={{ fontSize: 12, color: colors.text.tertiary }}>{t('common.or')}</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              </View>
            </>
          )}

          {/* Routine List */}
          {loadingRoutines ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={colors.brand.blue} />
            </View>
          ) : routines.length === 0 ? (
            <View
              style={{
                paddingHorizontal: 24,
                paddingTop: 24,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  backgroundColor: colors.bg.tertiary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <ListChecks size={32} color={colors.text.tertiary} strokeWidth={1.5} />
              </View>
              <Text
                style={{
                  color: colors.text.primary,
                  fontSize: 16,
                  fontWeight: '600',
                  textAlign: 'center',
                  marginBottom: 6,
                }}
              >
                {t('home.noRoutines')}
              </Text>
              <Text
                style={{
                  color: colors.text.secondary,
                  fontSize: 14,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                {t('home.noRoutinesDesc')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={routines}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 32,
                gap: 12,
              }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <RoutinePickerItem
                  routine={item}
                  onSelect={handleSelectRoutine}
                  disabled={starting}
                />
              )}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

interface PRRowProps {
  pr: ExercisePR;
  isLast: boolean;
}

function PRRow({ pr, isLast }: PRRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }}
      accessibilityLabel={`PR: ${pr.exerciseName}, ${pr.maxWeight} kg on ${formatDate(pr.date)}`}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.text.primary,
          }}
          numberOfLines={1}
        >
          {pr.exerciseName}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: colors.text.tertiary,
            marginTop: 2,
          }}
        >
          {formatDate(pr.date)}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 15,
          fontWeight: '700',
          color: colors.chart.pr,
        }}
      >
        {pr.maxWeight} kg
      </Text>
    </View>
  );
}

interface RoutinePickerItemProps {
  routine: RoutineWithExercises;
  onSelect: (routineId: number) => void;
  disabled: boolean;
}

function CTAButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel="Start workout"
      >
        <Animated.View
          style={{
            backgroundColor: colors.brand.blue,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 10,
            shadowColor: colors.brand.blue,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <Play size={20} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#FFFFFF',
              letterSpacing: -0.3,
            }}
          >
            {t('home.startWorkout')}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

function RoutinePickerItem({ routine, onSelect, disabled }: RoutinePickerItemProps) {
  const { t } = useTranslation();
  const exerciseCount = routine.exercises.length;

  return (
    <Pressable
      onPress={() => onSelect(routine.id)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Start ${routine.name} workout`}
    >
      {({ pressed }) => (
        <View
          style={{
            backgroundColor: pressed ? colors.bg.elevated : colors.bg.tertiary,
            borderWidth: 1,
            borderColor: colors.borderBright,
            borderRadius: 12,
            padding: 16,
            opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: exerciseCount > 0 ? 12 : 0,
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: colors.text.primary,
                  letterSpacing: -0.3,
                }}
                numberOfLines={1}
              >
                {routine.name}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.text.secondary,
                  marginTop: 2,
                }}
              >
                {exerciseCount !== 1
                  ? t('home.exerciseCountPlural', { count: exerciseCount })
                  : t('home.exerciseCount', { count: exerciseCount })}
              </Text>
            </View>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: colors.brand.blue,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Play size={18} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
            </View>
          </View>

          {/* Exercise preview */}
          {exerciseCount > 0 && (
            <View
              style={{
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                gap: 6,
              }}
            >
              {routine.exercises.slice(0, 4).map((re) => (
                <View
                  key={re.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <ExerciseIllustration illustrationKey={re.exercise.illustration} size={24} />
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.text.secondary,
                    }}
                    numberOfLines={1}
                  >
                    {re.exercise.name}
                  </Text>
                </View>
              ))}
              {exerciseCount > 4 && (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.text.tertiary,
                    marginLeft: 32,
                  }}
                >
                  {t('home.moreExercises', { count: exerciseCount - 4 })}
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}
