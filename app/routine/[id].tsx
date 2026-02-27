import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { getDatabase } from '@/db/connection';
import { RoutineRepository, type RoutineWithExercises } from '@/repositories/routine.repo';
import { Button, Input } from '@/components/ui';
import { ExercisePickerModal } from '@/components/ExercisePickerModal';
import { RoutineExerciseList } from '@/components/RoutineExerciseList';
import { useRoutineForm, type RoutineExerciseItem } from '@/hooks/useRoutineForm';
import type { Exercise } from '@/types';

function routineToExerciseItems(routine: RoutineWithExercises): RoutineExerciseItem[] {
  return routine.exercises.map((re) => ({
    exerciseId: re.exercise.id,
    name: re.exercise.name,
    illustration: re.exercise.illustration,
    muscleGroup: re.exercise.muscleGroup,
  }));
}

export default function EditRoutineScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const routineId = Number(id);

  const [loadingRoutine, setLoadingRoutine] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    name,
    setName,
    exercises,
    errors,
    addExercise,
    removeExercise,
    moveExercise,
    validate,
    clearNameError,
    resetForm,
  } = useRoutineForm();

  const [originalRoutine, setOriginalRoutine] = useState<RoutineWithExercises | null>(null);

  useEffect(() => {
    async function loadRoutine() {
      try {
        const db = await getDatabase();
        const repo = new RoutineRepository(db);
        const routine = await repo.getById(routineId);

        if (!routine) {
          setNotFound(true);
          return;
        }

        setOriginalRoutine(routine);
        resetForm(routine.name, routineToExerciseItems(routine));
      } catch (error) {
        console.error('Failed to load routine:', error);
        setNotFound(true);
      } finally {
        setLoadingRoutine(false);
      }
    }
    loadRoutine();
  }, [routineId, resetForm]);

  const handleAddExercise = useCallback(
    (exercise: Exercise) => {
      addExercise(exercise);
      setPickerVisible(false);
    },
    [addExercise],
  );

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const db = await getDatabase();
      const repo = new RoutineRepository(db);

      // Update name if changed
      if (originalRoutine && name.trim() !== originalRoutine.name) {
        await repo.updateName(routineId, name.trim());
      }

      // Remove all existing routine_exercises and re-add in new order
      if (originalRoutine) {
        for (const re of originalRoutine.exercises) {
          await repo.removeExercise(re.id);
        }
      }

      // Add exercises in current order
      for (let i = 0; i < exercises.length; i++) {
        await repo.addExercise(routineId, exercises[i].exerciseId, i + 1);
      }

      router.back();
    } catch (error) {
      console.error('Failed to update routine:', error);
      setSaving(false);
    }
  }, [name, exercises, validate, router, routineId, originalRoutine]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${name.trim() || 'this routine'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const db = await getDatabase();
              const repo = new RoutineRepository(db);
              await repo.delete(routineId);
              router.back();
            } catch (error) {
              console.error('Failed to delete routine:', error);
              setDeleting(false);
            }
          },
        },
      ],
    );
  }, [name, routineId, router]);

  if (loadingRoutine) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand.blue} />
        </View>
      </SafeAreaView>
    );
  }

  if (notFound) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => router.back()}
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
            <ArrowLeft size={20} color={colors.text.primary} strokeWidth={1.5} />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 16, color: colors.text.secondary, textAlign: 'center' }}>
            Routine not found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={() => router.back()}
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
              <ArrowLeft size={20} color={colors.text.primary} strokeWidth={1.5} />
            </Pressable>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: colors.text.primary,
              }}
            >
              Edit Routine
            </Text>
          </View>
          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: pressed ? 'rgba(239, 68, 68, 0.15)' : colors.bg.tertiary,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: deleting ? 0.5 : pressed ? 0.7 : 1,
            })}
            accessibilityRole="button"
            accessibilityLabel="Delete routine"
          >
            <Trash2 size={18} color={colors.semantic.error} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* Form */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 32,
            gap: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name input */}
          <Input
            label="Routine Name"
            placeholder="e.g. Push Day"
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearNameError();
            }}
            error={errors.name}
            returnKeyType="done"
          />

          {/* Exercises section */}
          <View style={{ gap: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.text.secondary,
                }}
              >
                Exercises
              </Text>
              {exercises.length > 0 && (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.text.tertiary,
                  }}
                >
                  {exercises.length} added
                </Text>
              )}
            </View>

            {/* Exercise list */}
            <RoutineExerciseList
              exercises={exercises}
              onRemove={removeExercise}
              onMove={moveExercise}
            />

            {/* Error message */}
            {errors.exercises && (
              <Text style={{ fontSize: 13, color: colors.semantic.error }}>{errors.exercises}</Text>
            )}

            {/* Add exercise button */}
            <Pressable
              onPress={() => setPickerVisible(true)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                borderStyle: 'dashed',
                backgroundColor: pressed ? colors.bg.tertiary : 'transparent',
                opacity: pressed ? 0.7 : 1,
              })}
              accessibilityRole="button"
              accessibilityLabel="Add exercise to routine"
            >
              <Plus size={18} color={colors.brand.blue} strokeWidth={2} />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '500',
                  color: colors.brand.blue,
                }}
              >
                Add Exercise
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Save button */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={saving}
            disabled={saving || deleting}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>

      {/* Exercise picker modal */}
      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleAddExercise}
        selectedExerciseIds={exercises.map((e) => e.exerciseId)}
      />
    </SafeAreaView>
  );
}
