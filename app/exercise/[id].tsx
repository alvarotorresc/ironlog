import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Trophy, Calendar, Hash, TrendingUp } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { getDatabase } from '@/db/connection';
import { ExerciseRepository } from '@/repositories/exercise.repo';
import { ExerciseIllustration } from '@/components/ExerciseIllustration';
import { ProgressChart } from '@/components/ProgressChart';
import { PeriodSelector } from '@/components/PeriodSelector';
import { Card } from '@/components/ui';
import { useExerciseStats, useExerciseProgress } from '@/hooks/useStats';
import { useTranslation, type TranslationKey } from '@/i18n';
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

function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k`;
  }
  return String(Math.round(volume));
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

function MuscleGroupBadge({ group }: { group: string }) {
  const { t } = useTranslation();
  const key = `muscle.${group}` as TranslationKey;
  return (
    <View
      style={{
        backgroundColor: colors.bg.tertiary,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '500',
          color: colors.text.secondary,
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
  const exerciseId = parseInt(id ?? '0', 10);

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loadingExercise, setLoadingExercise] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>('3m');

  const { stats, isLoading: statsLoading } = useExerciseStats(exerciseId);
  const {
    maxWeightData,
    volumeData,
    isLoading: progressLoading,
  } = useExerciseProgress(exerciseId, period);

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

  useEffect(() => {
    loadExercise();
  }, [loadExercise]);

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
          paddingHorizontal: 20,
          paddingVertical: 12,
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
            <MuscleGroupBadge group={exercise.muscleGroup} />
          </View>

          {/* Rest time */}
          <Text
            style={{
              fontSize: 13,
              color: colors.text.tertiary,
              marginTop: 8,
            }}
          >
            Rest: {exercise.restSeconds}s
          </Text>
        </View>

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
                value={stats.currentPR !== null ? `${stats.currentPR}kg` : '-'}
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
                value={stats.averageVolume > 0 ? formatVolume(stats.averageVolume) : '-'}
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
                    {t('exercise.maxWeight')} ({t('common.kg')})
                  </Text>
                  <ProgressChart
                    data={maxWeightData.map((d) => ({
                      date: d.date,
                      value: d.maxWeight,
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
                    {t('exercise.volume')} ({t('common.kg')})
                  </Text>
                  <ProgressChart
                    data={volumeData.map((d) => ({
                      date: d.date,
                      value: d.volume,
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
