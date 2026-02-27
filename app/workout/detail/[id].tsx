import { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Timer, Dumbbell, Pencil, Trash2, Check } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { getDatabase } from '@/db/connection';
import {
  WorkoutRepository,
  type WorkoutDetail,
  type WorkoutExerciseGroup,
} from '@/repositories/workout.repo';
import { ExerciseIllustration } from '@/components/ExerciseIllustration';
import type { ExerciseType, WorkoutSet } from '@/types';

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'Z');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString + 'Z');
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
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

function formatSetValues(set: WorkoutSet, exerciseType: ExerciseType): string {
  switch (exerciseType) {
    case 'weights':
      return `${set.weight ?? 0} kg x ${set.reps ?? 0} reps`;
    case 'calisthenics': {
      const parts = [`${set.reps ?? 0} reps`];
      if (set.weight != null && set.weight > 0) {
        parts.push(`+${set.weight} kg`);
      }
      return parts.join(' ');
    }
    case 'cardio': {
      const parts: string[] = [];
      if (set.duration != null) {
        parts.push(`${Math.round(set.duration / 60)} min`);
      }
      if (set.distance != null) {
        parts.push(`${set.distance} km`);
      }
      return parts.join(' / ') || '--';
    }
    case 'hiit': {
      const parts: string[] = [];
      if (set.duration != null) {
        parts.push(`${set.duration} sec`);
      }
      if (set.reps != null) {
        parts.push(`${set.reps} reps`);
      }
      return parts.join(' / ') || '--';
    }
    case 'flexibility':
      return set.duration != null ? `${set.duration} sec` : '--';
    default:
      return '--';
  }
}

type EditedSets = Record<number, { weight?: string; reps?: string; duration?: string }>;

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedSets, setEditedSets] = useState<EditedSets>({});
  const [saving, setSaving] = useState(false);

  const loadWorkout = useCallback(async () => {
    const workoutId = Number(id);
    if (isNaN(workoutId)) {
      setLoading(false);
      return;
    }

    try {
      const db = await getDatabase();
      const repo = new WorkoutRepository(db);
      const data = await repo.getDetail(workoutId);
      setWorkout(data);
    } catch (error) {
      console.error('Failed to load workout detail:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadWorkout();
  }, [loadWorkout]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleDelete = useCallback(() => {
    if (!workout) return;

    Alert.alert('Delete Workout', 'Are you sure? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const db = await getDatabase();
            const repo = new WorkoutRepository(db);
            await repo.delete(workout.id);
            router.back();
          } catch (error) {
            console.error('Failed to delete workout:', error);
          }
        },
      },
    ]);
  }, [workout, router]);

  const handleToggleEdit = useCallback(() => {
    if (editing) {
      setEditing(false);
      setEditedSets({});
    } else {
      setEditing(true);
      const initial: EditedSets = {};
      if (workout) {
        for (const group of workout.exercises) {
          for (const set of group.sets) {
            initial[set.id] = {
              weight: set.weight != null ? String(set.weight) : '',
              reps: set.reps != null ? String(set.reps) : '',
              duration: set.duration != null ? String(set.duration) : '',
            };
          }
        }
      }
      setEditedSets(initial);
    }
  }, [editing, workout]);

  const handleSave = useCallback(async () => {
    if (!workout || saving) return;
    setSaving(true);

    try {
      const db = await getDatabase();
      const repo = new WorkoutRepository(db);

      for (const group of workout.exercises) {
        for (const set of group.sets) {
          const edited = editedSets[set.id];
          if (!edited) continue;

          const newWeight = edited.weight ? parseFloat(edited.weight) : null;
          const newReps = edited.reps ? parseInt(edited.reps, 10) : null;
          const newDuration = edited.duration ? parseInt(edited.duration, 10) : null;

          const hasChanges =
            newWeight !== set.weight || newReps !== set.reps || newDuration !== set.duration;

          if (hasChanges) {
            await repo.updateSet(set.id, {
              weight: newWeight,
              reps: newReps,
              duration: newDuration,
            });
          }
        }
      }

      setEditing(false);
      setEditedSets({});
      await loadWorkout();
    } catch (error) {
      console.error('Failed to save workout changes:', error);
    } finally {
      setSaving(false);
    }
  }, [workout, editedSets, saving, loadWorkout]);

  const updateEditedSet = useCallback(
    (setId: number, field: 'weight' | 'reps' | 'duration', value: string) => {
      setEditedSets((prev) => ({
        ...prev,
        [setId]: { ...prev[setId], [field]: value },
      }));
    },
    [],
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand.blue} />
        </View>
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
        <DetailHeader onBack={handleBack} />
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: colors.text.secondary,
              textAlign: 'center',
            }}
          >
            Workout not found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const routineLabel = workout.routineName ?? 'Free Workout';
  const dateLabel = formatDate(workout.startedAt);
  const timeLabel = formatTime(workout.startedAt);
  const durationLabel = workout.finishedAt
    ? formatDuration(workout.startedAt, workout.finishedAt)
    : '--';
  const totalSets = workout.exercises.reduce((sum, group) => sum + group.sets.length, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }} edges={['top']}>
      <DetailHeader
        onBack={handleBack}
        editing={editing}
        onToggleEdit={handleToggleEdit}
        onDelete={handleDelete}
        onSave={handleSave}
        saving={saving}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Workout summary card */}
        <View
          style={{
            backgroundColor: colors.bg.secondary,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: colors.text.primary,
              letterSpacing: -0.3,
              marginBottom: 4,
            }}
          >
            {routineLabel}
          </Text>

          {/* Date and time */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginBottom: 12,
            }}
          >
            <Calendar size={14} color={colors.text.secondary} strokeWidth={1.5} />
            <Text style={{ fontSize: 14, color: colors.text.secondary }}>
              {dateLabel} at {timeLabel}
            </Text>
          </View>

          {/* Stats row */}
          <View
            style={{
              flexDirection: 'row',
              gap: 20,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Timer size={14} color={colors.text.secondary} strokeWidth={1.5} />
              <Text style={{ fontSize: 14, color: colors.text.secondary }}>{durationLabel}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Dumbbell size={14} color={colors.text.secondary} strokeWidth={1.5} />
              <Text style={{ fontSize: 14, color: colors.text.secondary }}>
                {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
              </Text>
            </View>

            <Text style={{ fontSize: 14, color: colors.text.secondary }}>
              {totalSets} set{totalSets !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Exercise sections */}
        <View style={{ gap: 12 }}>
          {workout.exercises.map((group) => (
            <ExerciseDetailCard
              key={group.exercise.id}
              group={group}
              editing={editing}
              editedSets={editedSets}
              onUpdateSet={updateEditedSet}
            />
          ))}
        </View>

        {workout.exercises.length === 0 && (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: colors.text.secondary }}>
              No exercises recorded in this workout.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface DetailHeaderProps {
  onBack: () => void;
  editing?: boolean;
  onToggleEdit?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  saving?: boolean;
}

function DetailHeader({
  onBack,
  editing,
  onToggleEdit,
  onDelete,
  onSave,
  saving,
}: DetailHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: 12,
      }}
    >
      <Pressable
        onPress={onBack}
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
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={20} color={colors.text.secondary} strokeWidth={2} />
      </Pressable>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: colors.text.primary,
          letterSpacing: -0.3,
          flex: 1,
        }}
      >
        Workout Detail
      </Text>

      {/* Action buttons */}
      {onToggleEdit && onDelete && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {editing && onSave ? (
            <Pressable
              onPress={onSave}
              disabled={saving}
              style={({ pressed }) => ({
                height: 36,
                paddingHorizontal: 14,
                borderRadius: 8,
                backgroundColor: colors.brand.blue,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed || saving ? 0.7 : 1,
              })}
              accessibilityRole="button"
              accessibilityLabel="Save changes"
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onToggleEdit}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: editing ? colors.brand.blue : colors.bg.tertiary,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
            accessibilityRole="button"
            accessibilityLabel={editing ? 'Cancel editing' : 'Edit workout'}
          >
            {editing ? (
              <Check size={18} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <Pencil size={18} color={colors.text.secondary} strokeWidth={1.5} />
            )}
          </Pressable>
          {!editing && (
            <Pressable
              onPress={onDelete}
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
              accessibilityLabel="Delete workout"
            >
              <Trash2 size={18} color={colors.semantic.error} strokeWidth={1.5} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

interface ExerciseDetailCardProps {
  group: WorkoutExerciseGroup;
  editing: boolean;
  editedSets: EditedSets;
  onUpdateSet: (setId: number, field: 'weight' | 'reps' | 'duration', value: string) => void;
}

function ExerciseDetailCard({ group, editing, editedSets, onUpdateSet }: ExerciseDetailCardProps) {
  const { exercise, sets } = group;

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
          marginBottom: sets.length > 0 ? 12 : 0,
        }}
      >
        <ExerciseIllustration illustrationKey={exercise.illustration} size={32} />
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
          <Text
            style={{
              fontSize: 12,
              color: colors.text.tertiary,
              marginTop: 2,
            }}
          >
            {sets.length} set{sets.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Sets list */}
      {sets.length > 0 && (
        <View
          style={{
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: 8,
          }}
        >
          {sets.map((set, index) =>
            editing ? (
              <EditableSetRow
                key={set.id}
                set={set}
                setNumber={index + 1}
                exerciseType={exercise.type}
                editedValues={editedSets[set.id]}
                onUpdate={(field, value) => onUpdateSet(set.id, field, value)}
              />
            ) : (
              <ReadOnlySetRow
                key={set.id}
                set={set}
                setNumber={index + 1}
                exerciseType={exercise.type}
              />
            ),
          )}
        </View>
      )}
    </View>
  );
}

interface ReadOnlySetRowProps {
  set: WorkoutSet;
  setNumber: number;
  exerciseType: ExerciseType;
}

function ReadOnlySetRow({ set, setNumber, exerciseType }: ReadOnlySetRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
      }}
    >
      <SetNumberBadge number={setNumber} />
      <Text
        style={{
          fontSize: 15,
          color: colors.text.primary,
          fontVariant: ['tabular-nums'],
        }}
      >
        {formatSetValues(set, exerciseType)}
      </Text>
    </View>
  );
}

interface EditableSetRowProps {
  set: WorkoutSet;
  setNumber: number;
  exerciseType: ExerciseType;
  editedValues?: { weight?: string; reps?: string; duration?: string };
  onUpdate: (field: 'weight' | 'reps' | 'duration', value: string) => void;
}

function EditableSetRow({ setNumber, exerciseType, editedValues, onUpdate }: EditableSetRowProps) {
  const showWeight = exerciseType === 'weights' || exerciseType === 'calisthenics';
  const showReps =
    exerciseType === 'weights' || exerciseType === 'calisthenics' || exerciseType === 'hiit';
  const showDuration =
    exerciseType === 'cardio' || exerciseType === 'hiit' || exerciseType === 'flexibility';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
      }}
    >
      <SetNumberBadge number={setNumber} />
      {showWeight && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <TextInput
            value={editedValues?.weight ?? ''}
            onChangeText={(v) => onUpdate('weight', v)}
            keyboardType="decimal-pad"
            style={{
              width: 60,
              height: 34,
              borderRadius: 8,
              backgroundColor: colors.bg.tertiary,
              borderWidth: 1,
              borderColor: colors.borderBright,
              color: colors.text.primary,
              fontSize: 14,
              textAlign: 'center',
              fontVariant: ['tabular-nums'],
              padding: 0,
            }}
            placeholderTextColor={colors.text.tertiary}
            placeholder="0"
          />
          <Text style={{ fontSize: 12, color: colors.text.secondary }}>kg</Text>
        </View>
      )}
      {showReps && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {showWeight && <Text style={{ fontSize: 14, color: colors.text.tertiary }}>x</Text>}
          <TextInput
            value={editedValues?.reps ?? ''}
            onChangeText={(v) => onUpdate('reps', v)}
            keyboardType="number-pad"
            style={{
              width: 50,
              height: 34,
              borderRadius: 8,
              backgroundColor: colors.bg.tertiary,
              borderWidth: 1,
              borderColor: colors.borderBright,
              color: colors.text.primary,
              fontSize: 14,
              textAlign: 'center',
              fontVariant: ['tabular-nums'],
              padding: 0,
            }}
            placeholderTextColor={colors.text.tertiary}
            placeholder="0"
          />
          <Text style={{ fontSize: 12, color: colors.text.secondary }}>reps</Text>
        </View>
      )}
      {showDuration && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <TextInput
            value={editedValues?.duration ?? ''}
            onChangeText={(v) => onUpdate('duration', v)}
            keyboardType="number-pad"
            style={{
              width: 60,
              height: 34,
              borderRadius: 8,
              backgroundColor: colors.bg.tertiary,
              borderWidth: 1,
              borderColor: colors.borderBright,
              color: colors.text.primary,
              fontSize: 14,
              textAlign: 'center',
              fontVariant: ['tabular-nums'],
              padding: 0,
            }}
            placeholderTextColor={colors.text.tertiary}
            placeholder="0"
          />
          <Text style={{ fontSize: 12, color: colors.text.secondary }}>sec</Text>
        </View>
      )}
    </View>
  );
}

function SetNumberBadge({ number }: { number: number }) {
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: colors.bg.tertiary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: colors.text.secondary,
        }}
      >
        {number}
      </Text>
    </View>
  );
}
