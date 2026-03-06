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
import {
  ExerciseGroupBadge,
  getGroupLetterFromId,
  getGroupBorderColor,
} from '@/components/ExerciseGroupBadge';
import { useTranslation } from '@/i18n';
import type { ExerciseType, WorkoutSet, GroupType } from '@/types';

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

interface ExerciseGroupInfo {
  groupId: number | null;
  groupType: GroupType | null;
}

function getExerciseGroupInfo(group: WorkoutExerciseGroup): ExerciseGroupInfo {
  if (group.sets.length === 0) return { groupId: null, groupType: null };
  const firstSet = group.sets[0];
  return { groupId: firstSet.groupId, groupType: firstSet.groupType };
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
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

    Alert.alert(t('history.deleteTitle'), t('history.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
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
  }, [workout, router, t]);

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
            {t('common.noData')}
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
          {(() => {
            const exerciseGroupInfos = workout.exercises.map(getExerciseGroupInfo);
            const allGroupIds = exerciseGroupInfos
              .map((info) => info.groupId)
              .filter((id): id is number => id !== null);

            return workout.exercises.map((group, index) => {
              const info = exerciseGroupInfos[index];
              const isFirstInGroup =
                info.groupId !== null &&
                (index === 0 || exerciseGroupInfos[index - 1].groupId !== info.groupId);
              const isLastInGroup =
                info.groupId !== null &&
                (index === workout.exercises.length - 1 ||
                  exerciseGroupInfos[index + 1].groupId !== info.groupId);
              const groupLetter =
                info.groupId !== null ? getGroupLetterFromId(info.groupId, allGroupIds) : null;

              return (
                <ExerciseDetailCard
                  key={group.exercise.id}
                  group={group}
                  editing={editing}
                  editedSets={editedSets}
                  onUpdateSet={updateEditedSet}
                  groupId={info.groupId}
                  groupType={info.groupType}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                  groupLetter={groupLetter}
                />
              );
            });
          })()}
        </View>

        {workout.exercises.length === 0 && (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: colors.text.secondary }}>
              {t('routine.noExercises')}
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
  const { t } = useTranslation();
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
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('common.back')}>
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
            <ArrowLeft size={20} color={colors.text.secondary} strokeWidth={2} />
          </View>
        )}
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
        {t('workoutDetail.title')}
      </Text>

      {/* Action buttons */}
      {onToggleEdit && onDelete && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {editing && onSave ? (
            <Pressable
              onPress={onSave}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={t('common.save')}
            >
              {({ pressed }) => (
                <View
                  style={{
                    height: 36,
                    paddingHorizontal: 14,
                    borderRadius: 8,
                    backgroundColor: colors.brand.blue,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed || saving ? 0.7 : 1,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                    {saving ? `${t('common.loading')}` : t('common.save')}
                  </Text>
                </View>
              )}
            </Pressable>
          ) : null}
          <Pressable
            onPress={onToggleEdit}
            accessibilityRole="button"
            accessibilityLabel={editing ? t('common.cancel') : t('workoutDetail.title')}
          >
            {({ pressed }) => (
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: editing ? colors.brand.blue : colors.bg.tertiary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                }}
              >
                {editing ? (
                  <Check size={18} color="#FFFFFF" strokeWidth={2} />
                ) : (
                  <Pencil size={18} color={colors.text.secondary} strokeWidth={1.5} />
                )}
              </View>
            )}
          </Pressable>
          {!editing && (
            <Pressable
              onPress={onDelete}
              accessibilityRole="button"
              accessibilityLabel={t('history.deleteTitle')}
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
                  <Trash2 size={18} color={colors.semantic.error} strokeWidth={1.5} />
                </View>
              )}
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
  groupId: number | null;
  groupType: GroupType | null;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  groupLetter: string | null;
}

function ExerciseDetailCard({
  group,
  editing,
  editedSets,
  onUpdateSet,
  groupId,
  groupType,
  isFirstInGroup,
  isLastInGroup,
  groupLetter,
}: ExerciseDetailCardProps) {
  const { exercise, sets } = group;
  const hasGroup = groupId !== null && groupType !== null;
  const borderColor = hasGroup ? getGroupBorderColor(groupType as GroupType) : undefined;

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
    <View style={{ paddingVertical: 4 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
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
      {set.notes ? (
        <Text
          style={{
            fontSize: 13,
            color: colors.text.secondary,
            fontStyle: 'italic',
            marginLeft: 40,
            marginTop: 2,
          }}
        >
          {set.notes}
        </Text>
      ) : null}
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
