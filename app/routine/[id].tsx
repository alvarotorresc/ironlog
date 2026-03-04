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
import { useTranslation } from '@/i18n';
import type { Exercise } from '@/types';

function routineToExerciseItems(routine: RoutineWithExercises): RoutineExerciseItem[] {
  return routine.exercises.map((re) => ({
    exerciseId: re.exercise.id,
    name: re.exercise.name,
    illustration: re.exercise.illustration,
    muscleGroup: re.exercise.muscleGroup,
    notes: re.exercise.notes,
  }));
}

export default function EditRoutineScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const routineId = Number(id);
  const isValidId = !isNaN(routineId) && routineId > 0;

  const [loadingRoutine, setLoadingRoutine] = useState(isValidId);
  const [notFound, setNotFound] = useState(!isValidId);
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
    if (!isValidId) return;

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
  }, [routineId, resetForm, isValidId]);

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

      // Replace exercises atomically in a transaction
      await repo.replaceExercises(
        routineId,
        exercises.map((e) => e.exerciseId),
      );

      router.back();
    } catch (error) {
      console.error('Failed to update routine:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
      setSaving(false);
    }
  }, [name, exercises, validate, router, routineId, originalRoutine]);

  const handleDelete = useCallback(() => {
    Alert.alert(t('routine.deleteTitle'), t('routine.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
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
            Alert.alert('Error', 'Failed to delete routine. Please try again.');
            setDeleting(false);
          }
        },
      },
    ]);
  }, [routineId, router, t]);

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
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
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
                <ArrowLeft size={20} color={colors.text.primary} strokeWidth={1.5} />
              </View>
            )}
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 16, color: colors.text.secondary, textAlign: 'center' }}>
            {t('common.noData')}
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
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
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
                  <ArrowLeft size={20} color={colors.text.primary} strokeWidth={1.5} />
                </View>
              )}
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
            accessibilityRole="button"
            accessibilityLabel={t('routine.deleteTitle')}
          >
            {({ pressed }) => (
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: pressed ? 'rgba(239, 68, 68, 0.15)' : colors.bg.tertiary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: deleting ? 0.5 : pressed ? 0.7 : 1,
                }}
              >
                <Trash2 size={18} color={colors.semantic.error} strokeWidth={1.5} />
              </View>
            )}
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
            label={t('routine.create.name')}
            placeholder={t('routine.create.namePlaceholder')}
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearNameError();
            }}
            error={errors.name}
            returnKeyType="done"
            maxLength={100}
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
                {t('routine.exercises')}
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
              accessibilityRole="button"
              accessibilityLabel={t('routine.create.addExercise')}
            >
              {({ pressed }) => (
                <View
                  style={{
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
                  }}
                >
                  <Plus size={18} color={colors.brand.blue} strokeWidth={2} />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '500',
                      color: colors.brand.blue,
                    }}
                  >
                    {t('routine.create.addExercise')}
                  </Text>
                </View>
              )}
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
            title={t('common.save')}
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
