import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Hash,
  TrendingUp,
  Pencil,
  Trash2,
  Check,
  X,
  StickyNote,
} from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { getDatabase } from '@/db/connection';
import { ExerciseRepository } from '@/repositories/exercise.repo';
import { ExerciseIllustration } from '@/components/ExerciseIllustration';
import { MuscleGroupBadges } from '@/components/MuscleGroupBadges';
import { ProgressChart } from '@/components/ProgressChart';
import { PeriodSelector } from '@/components/PeriodSelector';
import { Card } from '@/components/ui';
import { useExerciseStats, useExerciseProgress } from '@/hooks/useStats';
import { useTranslation, type TranslationKey } from '@/i18n';
import { useSettings } from '@/contexts/SettingsContext';
import type { Exercise, TimePeriod } from '@/types';

const typeColors: Record<string, { bg: string; text: string }> = {
  weights: { bg: 'rgba(50, 145, 255, 0.12)', text: colors.brand.blue },
  calisthenics: { bg: 'rgba(34, 197, 94, 0.12)', text: colors.semantic.success },
  cardio: { bg: 'rgba(245, 158, 11, 0.12)', text: colors.semantic.warning },
  hiit: { bg: 'rgba(244, 63, 94, 0.12)', text: colors.brand.red },
  flexibility: { bg: 'rgba(148, 163, 184, 0.12)', text: colors.theme.slateBright },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  return `${parts[1]}/${parts[2]}`;
}

function TypeBadge({ type }: { type: string }) {
  const { t } = useTranslation();
  const c = typeColors[type] ?? typeColors.weights;
  const key = `type.${type}` as TranslationKey;
  return (
    <View
      style={{
        backgroundColor: c.bg,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: c.text,
        }}
      >
        {t(key)}
      </Text>
    </View>
  );
}

interface StatCardProps {
  icon: typeof Trophy;
  value: string;
  label: string;
  color?: string;
}

function StatCard({ icon: Icon, value, label, color = colors.text.primary }: StatCardProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg.secondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        gap: 6,
      }}
    >
      <Icon size={18} color={color} strokeWidth={1.5} />
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color,
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: colors.text.tertiary,
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 12,
      }}
    >
      {title}
    </Text>
  );
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { formatWeight, formatVolume: fmtVolume, weightUnit, convertWeight } = useSettings();
  const exerciseId = parseInt(id ?? '0', 10);

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loadingExercise, setLoadingExercise] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>('3m');
  const [editingRest, setEditingRest] = useState(false);
  const [restInput, setRestInput] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState('');

  const { stats, isLoading: statsLoading } = useExerciseStats(exerciseId);
  const {
    maxWeightData,
    volumeData,
    isLoading: progressLoading,
  } = useExerciseProgress(exerciseId, period);

  const handleSaveNotes = useCallback(async () => {
    try {
      const trimmed = notesInput.trim();
      const db = await getDatabase();
      const repo = new ExerciseRepository(db);
      await repo.update(exerciseId, { notes: trimmed || null });
      setExercise((prev) => (prev ? { ...prev, notes: trimmed || null } : prev));
      setEditingNotes(false);
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  }, [exerciseId, notesInput]);

  const handleSaveRest = useCallback(async () => {
    const parsed = parseInt(restInput, 10);
    if (isNaN(parsed) || parsed < 0) return;
    try {
      const db = await getDatabase();
      const repo = new ExerciseRepository(db);
      await repo.update(exerciseId, { restSeconds: parsed });
      setExercise((prev) => (prev ? { ...prev, restSeconds: parsed } : prev));
      setEditingRest(false);
    } catch (error) {
      console.error('Failed to update rest time:', error);
    }
  }, [exerciseId, restInput]);

  const loadExercise = useCallback(async () => {
    if (!exerciseId) return;
    try {
      const db = await getDatabase();
      const repo = new ExerciseRepository(db);
      const result = await repo.getById(exerciseId);
      setExercise(result);
    } catch (error) {
      console.error('Failed to load exercise:', error);
    } finally {
      setLoadingExercise(false);
    }
  }, [exerciseId]);

  useFocusEffect(
    useCallback(() => {
      loadExercise();
    }, [loadExercise]),
  );

  const handleDelete = useCallback(() => {
    Alert.alert(t('exercise.deleteTitle'), t('exercise.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            const db = await getDatabase();
            const repo = new ExerciseRepository(db);
            await repo.delete(exerciseId);
            router.back();
          } catch (error) {
            console.error('Failed to delete exercise:', error);
          }
        },
      },
    ]);
  }, [exerciseId, router, t]);

  const hasWorkoutData = stats !== null && stats.totalSessions > 0;

  if (loadingExercise) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand.blue} />
        </View>
      </SafeAreaView>
    );
  }

  if (!exercise) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ color: colors.text.secondary, fontSize: 16, textAlign: 'center' }}>
            Exercise not found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      {/* Header with back button */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 12,
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

        {!exercise.isPredefined && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => router.push(`/exercise/edit/${exerciseId}`)}
              accessibilityRole="button"
              accessibilityLabel={t('exercise.edit.title')}
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
                  <Pencil size={18} color={colors.text.primary} strokeWidth={1.5} />
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={handleDelete}
              accessibilityRole="button"
              accessibilityLabel={t('exercise.deleteTitle')}
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
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise illustration and name */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <ExerciseIllustration illustrationKey={exercise.illustration} size={96} />
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: colors.text.primary,
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            {exercise.name}
          </Text>

          {/* Badges row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: 12,
            }}
          >
            <TypeBadge type={exercise.type} />
            <MuscleGroupBadges
              muscleGroups={exercise.muscleGroups}
              primaryGroup={exercise.muscleGroup}
            />
          </View>

          {/* Rest time */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            {editingRest ? (
              <>
                <TextInput
                  value={restInput}
                  onChangeText={setRestInput}
                  keyboardType="number-pad"
                  style={{
                    fontSize: 13,
                    color: colors.text.primary,
                    backgroundColor: colors.bg.tertiary,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    minWidth: 56,
                    textAlign: 'center',
                  }}
                  autoFocus
                  selectTextOnFocus
                  accessibilityLabel={t('exercise.restTimeEdit')}
                />
                <Text style={{ fontSize: 13, color: colors.text.tertiary }}>s</Text>
                <Pressable
                  onPress={handleSaveRest}
                  accessibilityRole="button"
                  accessibilityLabel={t('exercise.restTimeSave')}
                >
                  {({ pressed }) => (
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        backgroundColor: colors.semantic.success,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.7 : 1,
                      }}
                    >
                      <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => setEditingRest(false)}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.cancel')}
                >
                  {({ pressed }) => (
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        backgroundColor: colors.bg.elevated,
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.7 : 1,
                      }}
                    >
                      <X size={14} color={colors.text.secondary} strokeWidth={2} />
                    </View>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 13, color: colors.text.tertiary }}>
                  {t('exercise.restTime')}: {exercise.restSeconds}s
                </Text>
                <Pressable
                  onPress={() => {
                    setRestInput(String(exercise.restSeconds));
                    setEditingRest(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t('exercise.restTimeEdit')}
                >
                  {({ pressed }) => (
                    <View style={{ opacity: pressed ? 0.5 : 1, padding: 2 }}>
                      <Pencil size={14} color={colors.text.tertiary} strokeWidth={1.5} />
                    </View>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* Notes section */}
        {editingNotes ? (
          <Card style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <StickyNote size={16} color={colors.text.tertiary} strokeWidth={1.5} />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text.secondary,
                }}
              >
                {t('exercise.notes')}
              </Text>
            </View>
            <TextInput
              value={notesInput}
              onChangeText={setNotesInput}
              multiline
              placeholder={t('exercise.notesPlaceholder')}
              placeholderTextColor={colors.text.tertiary}
              maxLength={500}
              style={{
                fontSize: 14,
                color: colors.text.primary,
                backgroundColor: colors.bg.tertiary,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                minHeight: 80,
                textAlignVertical: 'top',
                lineHeight: 20,
              }}
              autoFocus
              accessibilityLabel={t('exercise.notes')}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 10,
              }}
            >
              <Pressable
                onPress={() => setEditingNotes(false)}
                accessibilityRole="button"
                accessibilityLabel={t('common.cancel')}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: colors.bg.elevated,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.secondary }}>
                      {t('common.cancel')}
                    </Text>
                  </View>
                )}
              </Pressable>
              <Pressable
                onPress={handleSaveNotes}
                accessibilityRole="button"
                accessibilityLabel={t('common.save')}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: colors.brand.blue,
                      opacity: pressed ? 0.7 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>
                      {t('common.save')}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </Card>
        ) : exercise.notes ? (
          <Pressable
            onPress={() => {
              if (exercise.isPredefined) {
                setNotesInput(exercise.notes ?? '');
                setEditingNotes(true);
              } else {
                router.push(`/exercise/edit/${exerciseId}`);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={t('exercise.notes')}
          >
            {({ pressed }) => (
              <Card
                style={{
                  marginBottom: 24,
                  opacity: pressed ? 0.7 : 1,
                }}
              >
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}
                >
                  <StickyNote size={16} color={colors.text.tertiary} strokeWidth={1.5} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: colors.text.secondary,
                    }}
                  >
                    {t('exercise.notes')}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.text.primary,
                    lineHeight: 20,
                  }}
                >
                  {exercise.notes}
                </Text>
              </Card>
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              if (exercise.isPredefined) {
                setNotesInput('');
                setEditingNotes(true);
              } else {
                router.push(`/exercise/edit/${exerciseId}`);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={t('exercise.addNotes')}
          >
            {({ pressed }) => (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginBottom: 24,
                  opacity: pressed ? 0.7 : 1,
                }}
              >
                <StickyNote size={14} color={colors.brand.blue} strokeWidth={1.5} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: colors.brand.blue,
                  }}
                >
                  {t('exercise.addNotes')}
                </Text>
              </View>
            )}
          </Pressable>
        )}

        {/* Stats section */}
        {statsLoading ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.brand.blue} />
          </View>
        ) : stats !== null ? (
          <View style={{ marginBottom: 24 }}>
            <SectionHeader title={t('exercise.stats')} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <StatCard
                icon={Trophy}
                value={stats.currentPR !== null ? formatWeight(stats.currentPR) : '-'}
                label={t('exercise.currentPR')}
                color={stats.currentPR !== null ? colors.chart.pr : colors.text.tertiary}
              />
              <StatCard
                icon={Calendar}
                value={formatDate(stats.lastWorkoutDate)}
                label={t('exercise.lastWorkout')}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <StatCard
                icon={Hash}
                value={String(stats.totalSessions)}
                label={t('exercise.totalSessions')}
              />
              <StatCard
                icon={TrendingUp}
                value={stats.averageVolume > 0 ? fmtVolume(stats.averageVolume) : '-'}
                label={t('exercise.avgVolume')}
              />
            </View>
          </View>
        ) : null}

        {/* Progress charts section */}
        {hasWorkoutData ? (
          <View>
            <SectionHeader title={t('exercise.progress')} />

            {/* Period selector */}
            <View style={{ marginBottom: 16 }}>
              <PeriodSelector value={period} onChange={setPeriod} />
            </View>

            {progressLoading ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.brand.blue} />
              </View>
            ) : (
              <>
                {/* Max Weight chart */}
                <Card style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: colors.text.primary,
                      marginBottom: 8,
                    }}
                  >
                    {t('exercise.maxWeight')} ({weightUnit()})
                  </Text>
                  <ProgressChart
                    data={maxWeightData.map((d) => ({
                      date: d.date,
                      value: Math.round(convertWeight(d.maxWeight) * 10) / 10,
                    }))}
                    color={colors.chart.line}
                    height={180}
                  />
                </Card>

                {/* Volume chart */}
                <Card>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: colors.text.primary,
                      marginBottom: 8,
                    }}
                  >
                    {t('exercise.volume')} ({weightUnit()})
                  </Text>
                  <ProgressChart
                    data={volumeData.map((d) => ({
                      date: d.date,
                      value: Math.round(convertWeight(d.volume)),
                    }))}
                    color={colors.chart.line}
                    height={180}
                    showArea
                  />
                </Card>
              </>
            )}
          </View>
        ) : (
          /* Empty state when no workout data */
          <Card
            style={{
              alignItems: 'center',
              paddingVertical: 32,
            }}
          >
            <TrendingUp size={40} color={colors.text.tertiary} strokeWidth={1.5} />
            <Text
              style={{
                color: colors.text.secondary,
                fontSize: 14,
                textAlign: 'center',
                marginTop: 12,
                lineHeight: 20,
                paddingHorizontal: 16,
              }}
            >
              {t('exercise.noProgress')}
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
