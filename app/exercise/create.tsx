import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { getDatabase } from '@/db/connection';
import { ExerciseRepository } from '@/repositories/exercise.repo';
import { Button, Input, Select } from '@/components/ui';
import type { ExerciseType, MuscleGroup } from '@/types';

const EXERCISE_TYPE_OPTIONS = [
  { label: 'Weights', value: 'weights' },
  { label: 'Calisthenics', value: 'calisthenics' },
  { label: 'Cardio', value: 'cardio' },
  { label: 'HIIT', value: 'hiit' },
  { label: 'Flexibility', value: 'flexibility' },
];

const MUSCLE_GROUP_OPTIONS = [
  { label: 'Chest', value: 'chest' },
  { label: 'Back', value: 'back' },
  { label: 'Legs', value: 'legs' },
  { label: 'Shoulders', value: 'shoulders' },
  { label: 'Arms', value: 'arms' },
  { label: 'Core', value: 'core' },
  { label: 'Full Body', value: 'full_body' },
];

interface FormErrors {
  name?: string;
  type?: string;
  muscleGroup?: string;
}

function validate(name: string, type: string, muscleGroup: string): FormErrors {
  const errors: FormErrors = {};
  if (!name.trim()) {
    errors.name = 'Name is required';
  }
  if (!type) {
    errors.type = 'Type is required';
  }
  if (!muscleGroup) {
    errors.muscleGroup = 'Muscle group is required';
  }
  return errors;
}

export default function CreateExerciseScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const validationErrors = validate(name, type, muscleGroup);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      const db = await getDatabase();
      const repo = new ExerciseRepository(db);
      await repo.create({
        name: name.trim(),
        type: type as ExerciseType,
        muscleGroup: muscleGroup as MuscleGroup,
        illustration: null,
      });
      router.back();
    } catch (error) {
      console.error('Failed to create exercise:', error);
      setSaving(false);
    }
  }, [name, type, muscleGroup, router]);

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
            New Exercise
          </Text>
        </View>

        {/* Form */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 32,
            gap: 20,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="Name"
            placeholder="e.g. Bench Press"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) {
                setErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            error={errors.name}
            autoFocus
            returnKeyType="done"
          />

          <Select
            label="Type"
            placeholder="Select type..."
            options={EXERCISE_TYPE_OPTIONS}
            value={type}
            onChange={(val) => {
              setType(val);
              if (errors.type) {
                setErrors((prev) => ({ ...prev, type: undefined }));
              }
            }}
            error={errors.type}
          />

          <Select
            label="Muscle Group"
            placeholder="Select muscle group..."
            options={MUSCLE_GROUP_OPTIONS}
            value={muscleGroup}
            onChange={(val) => {
              setMuscleGroup(val);
              if (errors.muscleGroup) {
                setErrors((prev) => ({ ...prev, muscleGroup: undefined }));
              }
            }}
            error={errors.muscleGroup}
          />
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
            title="Save Exercise"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
