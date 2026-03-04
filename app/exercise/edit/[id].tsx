import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, Check } from 'lucide-react-native';
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
  muscleGroups?: string;
}

function validate(name: string, type: string, muscleGroups: string[]): FormErrors {
  const errors: FormErrors = {};
  if (!name.trim()) {
    errors.name = 'Name is required';
  }
  if (!type) {
    errors.type = 'Type is required';
  }
  if (muscleGroups.length === 0) {
    errors.muscleGroups = 'At least one muscle group is required';
  }
  return errors;
}

export default function EditExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const exerciseId = parseInt(id ?? '0', 10);

  const exerciseTypeOptions = useMemo(
    () => EXERCISE_TYPE_VALUES.map((v) => ({ label: t(`type.${v}` as TranslationKey), value: v })),
    [t],
  );
  const muscleGroupOptions = useMemo(
    () => MUSCLE_GROUP_VALUES.map((v) => ({ label: t(`muscle.${v}` as TranslationKey), value: v })),
    [t],
  );

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  const [muscleGroupModalVisible, setMuscleGroupModalVisible] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const db = await getDatabase();
        const repo = new ExerciseRepository(db);
        const exercise = await repo.getById(exerciseId);
        if (!exercise || exercise.isPredefined) {
          setNotFound(true);
          return;
        }
        setName(exercise.name);
        setType(exercise.type);
        setSelectedMuscleGroups(exercise.muscleGroups);
      } catch (error) {
        console.error('Failed to load exercise:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [exerciseId]);

  const toggleMuscleGroup = useCallback((value: string) => {
    setSelectedMuscleGroups((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }, []);

  const selectedMuscleGroupLabels = useMemo(
    () =>
      selectedMuscleGroups.map((v) => muscleGroupOptions.find((o) => o.value === v)?.label ?? v),
    [selectedMuscleGroups, muscleGroupOptions],
  );

  const handleSave = useCallback(async () => {
    const validationErrors = validate(name, type, selectedMuscleGroups);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      const db = await getDatabase();
      const repo = new ExerciseRepository(db);
      const groups = selectedMuscleGroups as MuscleGroup[];
      await repo.update(exerciseId, {
        name: name.trim(),
        type: type as ExerciseType,
        muscleGroup: groups[0],
        muscleGroups: groups,
      });
      router.back();
    } catch (error) {
      console.error('Failed to update exercise:', error);
      Alert.alert(t('common.error'), t('exercise.edit.saveError'));
      setSaving(false);
    }
  }, [name, type, selectedMuscleGroups, exerciseId, router, t]);

  if (loading) {
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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ color: colors.text.secondary, fontSize: 16, textAlign: 'center' }}>
            {t('exercise.edit.notFound')}
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
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: colors.text.primary,
            }}
          >
            {t('exercise.edit.title')}
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
            maxLength={100}
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

          {/* Multi-select muscle groups */}
          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: colors.text.secondary,
              }}
            >
              {t('exercise.create.muscleGroups')}
            </Text>

            <Pressable
              onPress={() => setMuscleGroupModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={t('exercise.create.muscleGroups')}
            >
              {({ pressed }) => (
                <View
                  style={{
                    backgroundColor: colors.bg.tertiary,
                    borderWidth: 1,
                    borderColor: errors.muscleGroups ? colors.semantic.error : colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: pressed ? 0.7 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color:
                        selectedMuscleGroups.length > 0
                          ? colors.text.primary
                          : colors.text.tertiary,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {selectedMuscleGroups.length > 0
                      ? selectedMuscleGroupLabels.join(', ')
                      : t('exercise.create.muscleGroupsPlaceholder')}
                  </Text>
                  <ChevronDown size={18} color={colors.text.tertiary} strokeWidth={1.5} />
                </View>
              )}
            </Pressable>

            {errors.muscleGroups && (
              <Text style={{ fontSize: 13, color: colors.semantic.error }}>
                {errors.muscleGroups}
              </Text>
            )}

            <Modal
              visible={muscleGroupModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setMuscleGroupModalVisible(false)}
            >
              <Pressable
                onPress={() => setMuscleGroupModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  justifyContent: 'flex-end',
                }}
              >
                <View
                  style={{
                    backgroundColor: colors.bg.elevated,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    maxHeight: '50%',
                    paddingBottom: 34,
                  }}
                >
                  {/* Handle */}
                  <View
                    style={{
                      alignSelf: 'center',
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: colors.text.tertiary,
                      marginTop: 12,
                      marginBottom: 8,
                    }}
                  />

                  {/* Title */}
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: colors.text.primary,
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                    }}
                  >
                    {t('exercise.create.muscleGroups')}
                  </Text>

                  <FlatList
                    data={muscleGroupOptions}
                    keyExtractor={(item) => item.value}
                    ItemSeparatorComponent={() => (
                      <View
                        style={{
                          height: 1,
                          backgroundColor: colors.border,
                          marginHorizontal: 20,
                        }}
                      />
                    )}
                    renderItem={({ item }) => {
                      const isSelected = selectedMuscleGroups.includes(item.value);
                      return (
                        <Pressable
                          onPress={() => {
                            toggleMuscleGroup(item.value);
                            if (errors.muscleGroups) {
                              setErrors((prev) => ({ ...prev, muscleGroups: undefined }));
                            }
                          }}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: isSelected }}
                        >
                          {({ pressed }) => (
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingHorizontal: 20,
                                paddingVertical: 16,
                                backgroundColor: pressed
                                  ? colors.bg.tertiary
                                  : isSelected
                                    ? colors.accent.blue10
                                    : 'transparent',
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 16,
                                  color: isSelected ? colors.brand.blue : colors.text.primary,
                                  fontWeight: isSelected ? '600' : '400',
                                  flex: 1,
                                }}
                                numberOfLines={1}
                              >
                                {item.label}
                              </Text>
                              {isSelected && (
                                <Check size={20} color={colors.brand.blue} strokeWidth={2} />
                              )}
                            </View>
                          )}
                        </Pressable>
                      );
                    }}
                  />
                </View>
              </Pressable>
            </Modal>
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
            disabled={saving}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
