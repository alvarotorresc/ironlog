import { useCallback, useEffect, useState as useLocalState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Check, ChevronDown, ChevronUp, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/theme';
import { useWorkout, type WorkoutExerciseState } from '@/hooks/useWorkout';
import { useRestTimer } from '@/hooks/useRestTimer';
import { useBadgeCheck } from '@/hooks/useBadges';
import { ExerciseIllustration } from '@/components/ExerciseIllustration';
import { WorkoutSetRow } from '@/components/WorkoutSetRow';
import { RestTimer } from '@/components/RestTimer';
import {
  ExerciseGroupBadge,
  getGroupLetterFromId,
  getGroupBorderColor,
} from '@/components/ExerciseGroupBadge';
import { BadgeCelebrationModal } from '@/components/BadgeCelebrationModal';
import { useTranslation } from '@/i18n';
import type { Badge, WorkoutSet, GroupType } from '@/types';

function formatElapsedTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export default function WorkoutScreen() {
  const { routineId, workoutId } = useLocalSearchParams<{
    routineId: string;
    workoutId: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const [lastExerciseName, setLastExerciseName] = useLocalState('');

  const workout = useWorkout(routineId ?? 'empty', workoutId ?? '0');
  const restTimer = useRestTimer();
  const navigation = useNavigation();
  const { checkBadges } = useBadgeCheck();
  const [celebrationBadge, setCelebrationBadge] = useLocalState<Badge | null>(null);
  const [pendingBadges, setPendingBadges] = useLocalState<Badge[]>([]);

  const runBadgeCheck = useCallback(async () => {
    const newBadges = await checkBadges();
    if (newBadges.length > 0) {
      setCelebrationBadge(newBadges[0]);
      setPendingBadges(newBadges.slice(1));
      return true;
    }
    return false;
  }, [checkBadges, setCelebrationBadge, setPendingBadges]);

  const handleCelebrationDismiss = useCallback(() => {
    if (pendingBadges.length > 0) {
      setCelebrationBadge(pendingBadges[0]);
      setPendingBadges(pendingBadges.slice(1));
    } else {
      setCelebrationBadge(null);
      router.back();
    }
  }, [pendingBadges, setCelebrationBadge, setPendingBadges, router]);

  useEffect(() => {
    if (workout.isFinished) return;

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (workout.isFinished) return;

      e.preventDefault();

      const hasProgress = workout.exercises.some((ex) => ex.sets.length > 0);

      if (!hasProgress) {
        Alert.alert(t('workout.abandonTitle'), t('workout.abandonMessage'), [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('workout.abandon'),
            style: 'destructive',
            onPress: async () => {
              restTimer.reset();
              await workout.abandonWorkout();
              navigation.dispatch(e.data.action);
            },
          },
        ]);
      } else {
        Alert.alert(t('workout.abandonTitle'), t('workout.abandonMessage'), [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('workout.finishConfirm'),
            onPress: async () => {
              restTimer.reset();
              await workout.finishWorkout();
              const hasNewBadges = await runBadgeCheck();
              if (!hasNewBadges) {
                navigation.dispatch(e.data.action);
              }
              // If badges found, modal shows and handles navigation on dismiss
            },
          },
          {
            text: t('workout.abandon'),
            style: 'destructive',
            onPress: async () => {
              restTimer.reset();
              await workout.abandonWorkout();
              navigation.dispatch(e.data.action);
            },
          },
        ]);
      }
    });

    return unsubscribe;
  }, [navigation, workout, restTimer, runBadgeCheck, t]);

  // Determine if an exercise is the last in its group (for rest timer logic)
  const isLastInGroup = useCallback(
    (exerciseId: number): boolean => {
      const exerciseState = workout.exercises.find((e) => e.exercise.id === exerciseId);
      if (!exerciseState?.groupId) return true;

      const groupMembers = workout.exercises.filter((e) => e.groupId === exerciseState.groupId);
      const lastMember = groupMembers[groupMembers.length - 1];
      return lastMember?.exercise.id === exerciseId;
    },
    [workout.exercises],
  );

  const handleAddSet = useCallback(
    async (exerciseId: number): Promise<WorkoutSet | null> => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newSet = await workout.addSet(exerciseId);

      if (newSet) {
        const exerciseState = workout.exercises.find((e) => e.exercise.id === exerciseId);
        if (exerciseState && exerciseState.exercise.restSeconds > 0) {
          // Only start rest timer if this is the last exercise in a group,
          // or if the exercise is not in a group
          if (isLastInGroup(exerciseId)) {
            setLastExerciseName(exerciseState.exercise.name);
            restTimer.start(exerciseState.exercise.restSeconds);
          }
        }
      }

      return newSet;
    },
    [workout, restTimer, setLastExerciseName, isLastInGroup],
  );

  const handleFinish = useCallback(() => {
    const totalSets = workout.exercises.reduce((sum, e) => sum + e.sets.length, 0);

    if (totalSets === 0) {
      Alert.alert(t('workout.discardTitle'), t('workout.discardMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('workout.discard'),
          style: 'destructive',
          onPress: async () => {
            restTimer.reset();
            await workout.finishWorkout();
            router.back();
          },
        },
      ]);
      return;
    }

    Alert.alert(t('workout.finishTitle'), t('workout.finishMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('workout.finishConfirm'),
        onPress: async () => {
          restTimer.reset();
          await workout.finishWorkout();
          const hasNewBadges = await runBadgeCheck();
          if (!hasNewBadges) {
            router.back();
          }
          // If badges found, modal shows and handles navigation on dismiss
        },
      },
    ]);
  }, [workout, router, restTimer, runBadgeCheck, t]);

  if (workout.loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand.blue} />
        </View>
      </SafeAreaView>
    );
  }

  const isTimerVisible = restTimer.state !== 'idle';
  const allGroupIds = workout.exercises
    .map((e) => e.groupId)
    .filter((id): id is number => id !== null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }} edges={['top']}>
      {/* Badge Celebration Modal */}
      <BadgeCelebrationModal badge={celebrationBadge} onDismiss={handleCelebrationDismiss} />

      {/* Header */}
      <WorkoutHeader
        routineName={workout.routineName}
        elapsedSeconds={workout.elapsedSeconds}
        onFinish={handleFinish}
      />

      {/* Body */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: isTimerVisible ? 140 : 120,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {workout.exercises.map((exerciseState, index) => {
          const isFirstInGroup =
            exerciseState.groupId !== null &&
            (index === 0 || workout.exercises[index - 1].groupId !== exerciseState.groupId);
          const isLastInGroupVisual =
            exerciseState.groupId !== null &&
            (index === workout.exercises.length - 1 ||
              workout.exercises[index + 1].groupId !== exerciseState.groupId);

          return (
            <ExerciseSection
              key={exerciseState.exercise.id}
              exerciseState={exerciseState}
              exerciseIndex={index}
              exerciseCount={workout.exercises.length}
              onAddSet={handleAddSet}
              onUpdateSet={workout.updateSet}
              onUpdateNotes={workout.updateSetNotes}
              onDeleteSet={workout.deleteSet}
              onReorder={workout.reorderExercise}
              isFirstInGroup={isFirstInGroup}
              isLastInGroup={isLastInGroupVisual}
              groupLetter={
                exerciseState.groupId !== null
                  ? getGroupLetterFromId(exerciseState.groupId, allGroupIds)
                  : null
              }
            />
          );
        })}

        {workout.exercises.length === 0 && (
          <View
            style={{
              paddingVertical: 64,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: colors.text.secondary,
                textAlign: 'center',
                lineHeight: 24,
              }}
            >
              {t('routine.noExercises')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Rest Timer Banner */}
      <RestTimer
        state={restTimer.state}
        remainingSeconds={restTimer.remainingSeconds}
        totalSeconds={restTimer.totalSeconds}
        exerciseName={lastExerciseName}
        onSkip={restTimer.skip}
        onAddTime={restTimer.addTime}
        onDismiss={restTimer.reset}
      />
    </SafeAreaView>
  );
}

interface WorkoutHeaderProps {
  routineName: string;
  elapsedSeconds: number;
  onFinish: () => void;
}

function WorkoutHeader({ routineName, elapsedSeconds, onFinish }: WorkoutHeaderProps) {
  const { t } = useTranslation();
  return (
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
          {routineName}
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            fontVariant: ['tabular-nums'],
            color: colors.brand.blue,
            marginTop: 2,
          }}
        >
          {formatElapsedTime(elapsedSeconds)}
        </Text>
      </View>

      <Pressable
        onPress={onFinish}
        accessibilityRole="button"
        accessibilityLabel={t('workout.finish')}
      >
        {({ pressed }) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: pressed ? '#1DA34E' : colors.semantic.success,
            }}
          >
            <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: '#FFFFFF',
              }}
            >
              {t('workout.finishConfirm')}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

interface ExerciseSectionProps {
  exerciseState: WorkoutExerciseState;
  exerciseIndex: number;
  exerciseCount: number;
  onAddSet: (exerciseId: number) => Promise<WorkoutSet | null>;
  onUpdateSet: (
    setId: number,
    data: {
      weight?: number | null;
      reps?: number | null;
      duration?: number | null;
      distance?: number | null;
    },
  ) => void;
  onUpdateNotes: (setId: number, notes: string | null) => void;
  onDeleteSet: (setId: number, exerciseId: number) => void;
  onReorder: (exerciseIndex: number, direction: 'up' | 'down') => void;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  groupLetter: string | null;
}

function ExerciseSection({
  exerciseState,
  exerciseIndex,
  exerciseCount,
  onAddSet,
  onUpdateSet,
  onUpdateNotes,
  onDeleteSet,
  onReorder,
  isFirstInGroup,
  isLastInGroup,
  groupLetter,
}: ExerciseSectionProps) {
  const { t } = useTranslation();
  const { exercise, sets, groupId, groupType } = exerciseState;
  const hasSets = sets.length > 0;
  const hasGroup = groupId !== null && groupType !== null;
  const borderColor = hasGroup ? getGroupBorderColor(groupType as GroupType) : undefined;

  const isFirst = exerciseIndex === 0;
  const isLast = exerciseIndex === exerciseCount - 1;

  const handleAddSet = useCallback(() => {
    onAddSet(exercise.id);
  }, [onAddSet, exercise.id]);

  const handleDeleteSet = useCallback(
    (setId: number) => {
      onDeleteSet(setId, exercise.id);
    },
    [onDeleteSet, exercise.id],
  );

  const handleMoveUp = useCallback(() => {
    onReorder(exerciseIndex, 'up');
  }, [onReorder, exerciseIndex]);

  const handleMoveDown = useCallback(() => {
    onReorder(exerciseIndex, 'down');
  }, [onReorder, exerciseIndex]);

  return (
    <View
      style={{
        backgroundColor: colors.bg.secondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: hasGroup ? 3 : 1,
        borderLeftColor: hasGroup ? borderColor : colors.border,
        marginTop: hasGroup && !isFirstInGroup ? -12 : 0,
        borderTopLeftRadius: hasGroup && !isFirstInGroup ? 0 : 12,
        borderTopRightRadius: hasGroup && !isFirstInGroup ? 0 : 12,
        borderBottomLeftRadius: hasGroup && !isLastInGroup ? 0 : 12,
        borderBottomRightRadius: hasGroup && !isLastInGroup ? 0 : 12,
        borderTopWidth: hasGroup && !isFirstInGroup ? 0 : 1,
      }}
    >
      {/* Group badge - only show for first exercise in group */}
      {hasGroup && isFirstInGroup && groupLetter && (
        <View style={{ marginBottom: 8 }}>
          <ExerciseGroupBadge groupType={groupType as GroupType} letter={groupLetter} />
        </View>
      )}

      {/* Exercise header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: hasSets ? 12 : 0,
        }}
      >
        <ExerciseIllustration illustrationKey={exercise.illustration} size={36} />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.text.primary,
            }}
            numberOfLines={1}
          >
            {exercise.name}
          </Text>
          {hasSets && (
            <Text
              style={{
                fontSize: 12,
                color: colors.text.tertiary,
                marginTop: 2,
              }}
            >
              {sets.length} set{sets.length !== 1 ? 's' : ''}
              {exercise.restSeconds > 0 ? ` · Rest ${exercise.restSeconds}s` : ''}
            </Text>
          )}
        </View>

        {/* Reorder buttons */}
        {exerciseCount > 1 && (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Pressable
              onPress={handleMoveUp}
              disabled={isFirst}
              accessibilityRole="button"
              accessibilityLabel={t('workout.moveUp')}
              hitSlop={6}
            >
              {({ pressed }) => (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: pressed && !isFirst ? colors.bg.tertiary : 'transparent',
                    opacity: isFirst ? 0.3 : 1,
                  }}
                >
                  <ChevronUp size={16} color={colors.text.secondary} strokeWidth={2} />
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={handleMoveDown}
              disabled={isLast}
              accessibilityRole="button"
              accessibilityLabel={t('workout.moveDown')}
              hitSlop={6}
            >
              {({ pressed }) => (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: pressed && !isLast ? colors.bg.tertiary : 'transparent',
                    opacity: isLast ? 0.3 : 1,
                  }}
                >
                  <ChevronDown size={16} color={colors.text.secondary} strokeWidth={2} />
                </View>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* Column headers */}
      {hasSets && <SetColumnHeaders exerciseType={exercise.type} />}

      {/* Sets */}
      {sets.map((set, index) => (
        <WorkoutSetRow
          key={set.id}
          set={set}
          setNumber={index + 1}
          exerciseType={exercise.type}
          onUpdate={onUpdateSet}
          onUpdateNotes={onUpdateNotes}
          onDelete={handleDeleteSet}
        />
      ))}

      {/* Add Set button */}
      <Pressable
        onPress={handleAddSet}
        accessibilityRole="button"
        accessibilityLabel={`${t('workout.addSet')} - ${exercise.name}`}
      >
        {({ pressed }) => (
          <View
            style={{
              width: '100%',
              height: 44,
              marginTop: hasSets ? 12 : 8,
              backgroundColor: pressed ? colors.bg.elevated : colors.bg.tertiary,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors.borderBright,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <Plus size={18} color={colors.brand.blue} strokeWidth={2} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.brand.blue,
              }}
            >
              {t('workout.addSet')}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function SetColumnHeaders({ exerciseType }: { exerciseType: string }) {
  const getHeaders = () => {
    switch (exerciseType) {
      case 'weights':
        return ['SET', 'WEIGHT', 'REPS', ''];
      case 'calisthenics':
        return ['SET', 'REPS', 'WEIGHT', ''];
      case 'cardio':
        return ['SET', 'DURATION', 'DISTANCE', ''];
      case 'hiit':
        return ['SET', 'DURATION', 'REPS', ''];
      case 'flexibility':
        return ['SET', 'DURATION', ''];
      default:
        return ['SET', 'VALUE', ''];
    }
  };

  const headers = getHeaders();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 4,
        marginBottom: 4,
      }}
    >
      <View style={{ width: 28, alignItems: 'center' }}>
        <Text style={{ fontSize: 11, color: colors.text.tertiary, fontWeight: '500' }}>
          {headers[0]}
        </Text>
      </View>
      {headers.slice(1, -1).map((header, i) => (
        <View key={`${header}-${i}`} style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: colors.text.tertiary, fontWeight: '500' }}>
            {header}
          </Text>
        </View>
      ))}
      <View style={{ width: 32 }} />
    </View>
  );
}
