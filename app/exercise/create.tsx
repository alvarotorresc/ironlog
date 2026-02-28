import { useState, useCallback, useMemo } from 'react';
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
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { getDatabase } from '@/db/connection';
import { ExerciseRepository } from '@/repositories/exercise.repo';
import { Button, Input, Select } from '@/components/ui';
import { useTranslation, type TranslationKey } from '@/i18n';
import type { ExerciseType, MuscleGroup } from '@/types';

const EXERCISE_TYPE_VALUES = ['weights', 'calisthenics', 'cardio', 'hiit', 'flexibility'] as const;
const MUSCLE_GROUP_VALUES = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'full_body',
] as const;

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
  const { t } = useTranslation();

  const exerciseTypeOptions = useMemo(
    () => EXERCISE_TYPE_VALUES.map((v) => ({ label: t(`type.${v}` as TranslationKey), value: v })),
    [t],
  );
  const muscleGroupOptions = useMemo(
    () => MUSCLE_GROUP_VALUES.map((v) => ({ label: t(`muscle.${v}` as TranslationKey), value: v })),
    [t],
  );

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
      Alert.alert('Error', 'Could not save exercise. Please try again.');
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
            accessibilityLabel={t('common.back')}
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
            {t('exercise.create.title')}
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
            label={t('exercise.create.name')}
            placeholder={t('exercise.create.namePlaceholder')}
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
            label={t('exercise.create.type')}
            placeholder="Select type..."
            options={exerciseTypeOptions}
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
            label={t('exercise.create.muscleGroup')}
            placeholder="Select muscle group..."
            options={muscleGroupOptions}
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
            title={t('common.save')}
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
