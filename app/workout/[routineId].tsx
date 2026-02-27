import { useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Plus } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useWorkout, type WorkoutExerciseState } from '@/hooks/useWorkout';
import { ExerciseIllustration } from '@/components/ExerciseIllustration';
import { WorkoutSetRow } from '@/components/WorkoutSetRow';

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

  const workout = useWorkout(routineId ?? 'empty', workoutId ?? '0');

  const handleFinish = useCallback(() => {
    const totalSets = workout.exercises.reduce((sum, e) => sum + e.sets.length, 0);

    if (totalSets === 0) {
      Alert.alert('No sets recorded', 'Are you sure you want to finish this workout?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            await workout.finishWorkout();
            router.back();
          },
        },
      ]);
      return;
    }

    Alert.alert(
      'Finish Workout',
      `You completed ${totalSets} set${totalSets !== 1 ? 's' : ''} in ${formatElapsedTime(workout.elapsedSeconds)}. Finish?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
            await workout.finishWorkout();
            router.back();
          },
        },
      ],
    );
  }, [workout, router]);

  if (workout.loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand.blue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }} edges={['top']}>
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
          paddingBottom: 120,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {workout.exercises.map((exerciseState) => (
          <ExerciseSection
            key={exerciseState.exercise.id}
            exerciseState={exerciseState}
            onAddSet={workout.addSet}
            onUpdateSet={workout.updateSet}
            onDeleteSet={workout.deleteSet}
          />
        ))}

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
              No exercises in this workout yet.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface WorkoutHeaderProps {
  routineName: string;
  elapsedSeconds: number;
  onFinish: () => void;
}

function WorkoutHeader({ routineName, elapsedSeconds, onFinish }: WorkoutHeaderProps) {
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
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 8,
          backgroundColor: pressed ? '#1DA34E' : colors.semantic.success,
        })}
        accessibilityRole="button"
        accessibilityLabel="Finish workout"
      >
        <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: '#FFFFFF',
          }}
        >
          Finish
        </Text>
      </Pressable>
    </View>
  );
}

interface ExerciseSectionProps {
  exerciseState: WorkoutExerciseState;
  onAddSet: (exerciseId: number) => Promise<unknown>;
  onUpdateSet: (
    setId: number,
    data: {
      weight?: number | null;
      reps?: number | null;
      duration?: number | null;
      distance?: number | null;
    },
  ) => void;
  onDeleteSet: (setId: number, exerciseId: number) => void;
}

function ExerciseSection({
  exerciseState,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
}: ExerciseSectionProps) {
  const { exercise, sets } = exerciseState;
  const hasSets = sets.length > 0;

  const handleAddSet = useCallback(() => {
    onAddSet(exercise.id);
  }, [onAddSet, exercise.id]);

  const handleDeleteSet = useCallback(
    (setId: number) => {
      onDeleteSet(setId, exercise.id);
    },
    [onDeleteSet, exercise.id],
  );

  return (
    <View
      style={{
        backgroundColor: colors.bg.secondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 16,
      }}
    >
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
          onDelete={handleDeleteSet}
        />
      ))}

      {/* Add Set button */}
      <Pressable
        onPress={handleAddSet}
        style={({ pressed }) => ({
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
        })}
        accessibilityRole="button"
        accessibilityLabel={`Add set for ${exercise.name}`}
      >
        <Plus size={18} color={colors.brand.blue} strokeWidth={2} />
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.brand.blue,
          }}
        >
          Add Set
        </Text>
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
