import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { getDatabase } from '@/db/connection';
import { RoutineRepository } from '@/repositories/routine.repo';
import { Button, Input } from '@/components/ui';
import { ExercisePickerModal } from '@/components/ExercisePickerModal';
import { RoutineExerciseList } from '@/components/RoutineExerciseList';
import { useRoutineForm } from '@/hooks/useRoutineForm';
import type { Exercise } from '@/types';

export default function CreateRoutineScreen() {
  const router = useRouter();
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
  } = useRoutineForm();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

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
      const routine = await repo.create(name.trim());

      for (let i = 0; i < exercises.length; i++) {
        await repo.addExercise(routine.id, exercises[i].exerciseId, i + 1);
      }

      router.back();
    } catch (error) {
      console.error('Failed to create routine:', error);
      Alert.alert('Error', 'Failed to save routine. Please try again.');
      setSaving(false);
    }
  }, [name, exercises, validate, router]);

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
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: colors.text.primary,
            }}
          >
            New Routine
          </Text>
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
            autoFocus
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
            title="Save Routine"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
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
