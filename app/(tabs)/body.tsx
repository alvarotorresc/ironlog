import { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Scale, TrendingDown, TrendingUp, Minus, Trash2, Pencil } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import { getDatabase } from '@/db/connection';
import { BodyRepository } from '@/repositories/body.repo';
import { useBodyMeasurements, useBodyMetricProgress } from '@/hooks/useBodyMetrics';
import { ProgressChart } from '@/components/ProgressChart';
import { PeriodSelector } from '@/components/PeriodSelector';
import { EmptyState } from '@/components/ui';
import type { BodyMeasurement, BodyMetricField, TimePeriod } from '@/types';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

function WeightTrend({ current, previous }: { current: number; previous: number | null }) {
  const { t } = useTranslation();
  if (previous === null) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.1) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Minus size={14} color={colors.text.tertiary} strokeWidth={1.5} />
        <Text style={{ fontSize: 12, color: colors.text.tertiary }}>{t('body.same')}</Text>
      </View>
    );
  }
  const isUp = diff > 0;
  const Icon = isUp ? TrendingUp : TrendingDown;
  const color = isUp ? colors.semantic.warning : colors.semantic.success;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon size={14} color={color} strokeWidth={1.5} />
      <Text style={{ fontSize: 12, color }}>
        {isUp ? '+' : ''}
        {diff.toFixed(1)} kg
      </Text>
    </View>
  );
}

type MetricConfig = {
  field: BodyMetricField;
  labelKey: TranslationKey;
  unit: string;
  color: string;
};

const METRICS: MetricConfig[] = [
  { field: 'weight', labelKey: 'body.chartWeight', unit: 'kg', color: colors.brand.blue },
  { field: 'body_fat', labelKey: 'body.chartBodyFat', unit: '%', color: colors.brand.red },
  { field: 'waist', labelKey: 'body.chartWaist', unit: 'cm', color: colors.semantic.warning },
  { field: 'chest', labelKey: 'body.chartChest', unit: 'cm', color: colors.semantic.success },
  { field: 'hips', labelKey: 'body.chartHips', unit: 'cm', color: colors.theme.slateBright },
  { field: 'biceps', labelKey: 'body.chartBiceps', unit: 'cm', color: colors.brand.blue },
  { field: 'thighs', labelKey: 'body.chartThighs', unit: 'cm', color: colors.semantic.success },
];

function BodyMetricsCharts({ measurements }: { measurements: BodyMeasurement[] }) {
  const { t } = useTranslation();
  const [selectedMetric, setSelectedMetric] = useState<BodyMetricField | null>(null);
  const [period, setPeriod] = useState<TimePeriod>('3m');

  const availableMetrics = useMemo(() => {
    return METRICS.filter((m) => {
      const count = measurements.filter((entry) => {
        if (m.field === 'weight') return entry.weight !== null;
        if (m.field === 'body_fat') return entry.bodyFat !== null;
        const val =
          entry[
            m.field as keyof Pick<BodyMeasurement, 'chest' | 'waist' | 'hips' | 'biceps' | 'thighs'>
          ];
        return val !== null && val !== undefined;
      }).length;
      return count >= 2;
    });
  }, [measurements]);

  const activeMetric = useMemo<BodyMetricField>(() => {
    if (selectedMetric !== null && availableMetrics.some((m) => m.field === selectedMetric)) {
      return selectedMetric;
    }
    return availableMetrics[0]?.field ?? 'weight';
  }, [selectedMetric, availableMetrics]);

  const activeConfig = METRICS.find((m) => m.field === activeMetric) ?? null;

  const { data, isLoading } = useBodyMetricProgress(activeMetric, period);

  if (availableMetrics.length === 0) return null;

  return (
    <View
      style={{
        backgroundColor: colors.bg.secondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, marginBottom: 12 }}
      >
        {availableMetrics.map((m) => {
          const active = activeMetric === m.field;
          return (
            <Pressable
              key={m.field}
              onPress={() => setSelectedMetric(m.field)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              {({ pressed }) => (
                <View
                  style={{
                    height: 30,
                    paddingHorizontal: 12,
                    borderRadius: 15,
                    backgroundColor: active ? m.color : colors.bg.tertiary,
                    borderWidth: 1,
                    borderColor: active ? m.color : colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.7 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: active ? '600' : '400',
                      color: active ? '#FFFFFF' : colors.text.secondary,
                    }}
                  >
                    {t(m.labelKey)}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ marginBottom: 12 }}>
        <PeriodSelector value={period} onChange={setPeriod} />
      </View>

      {isLoading ? (
        <View style={{ height: 160, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={colors.brand.blue} />
        </View>
      ) : data.length < 2 ? (
        <View style={{ height: 160, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 13, color: colors.text.tertiary }}>{t('body.chartNoData')}</Text>
        </View>
      ) : (
        <ProgressChart
          data={data}
          color={activeConfig?.color ?? colors.brand.blue}
          height={160}
          showArea
        />
      )}
    </View>
  );
}

function MeasurementCard({
  measurement,
  previousWeight,
  onEdit,
  onDelete,
}: {
  measurement: BodyMeasurement;
  previousWeight: number | null;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const { t } = useTranslation();

  const handleDelete = () => {
    Alert.alert(t('body.deleteTitle'), t('body.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => onDelete(measurement.id) },
    ]);
  };

  const details: Array<{ label: string; value: string }> = [];
  if (measurement.bodyFat !== null)
    details.push({ label: t('body.bodyFat'), value: `${measurement.bodyFat}%` });
  if (measurement.chest !== null)
    details.push({ label: t('body.chest'), value: `${measurement.chest} cm` });
  if (measurement.waist !== null)
    details.push({ label: t('body.waist'), value: `${measurement.waist} cm` });
  if (measurement.hips !== null)
    details.push({ label: t('body.hips'), value: `${measurement.hips} cm` });
  if (measurement.biceps !== null)
    details.push({ label: t('body.biceps'), value: `${measurement.biceps} cm` });
  if (measurement.thighs !== null)
    details.push({ label: t('body.thighs'), value: `${measurement.thighs} cm` });

  return (
    <View
      style={{
        backgroundColor: colors.bg.secondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        marginHorizontal: 20,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 13, color: colors.text.tertiary }}>
          {formatDate(measurement.measuredAt)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            onPress={() => onEdit(measurement.id)}
            accessibilityRole="button"
            accessibilityLabel="Edit measurement"
          >
            {({ pressed }) => (
              <View style={{ opacity: pressed ? 0.5 : 1, padding: 4 }}>
                <Pencil size={16} color={colors.text.tertiary} strokeWidth={1.5} />
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete measurement"
          >
            {({ pressed }) => (
              <View style={{ opacity: pressed ? 0.5 : 1, padding: 4 }}>
                <Trash2 size={16} color={colors.text.tertiary} strokeWidth={1.5} />
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
        {measurement.weight !== null && (
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text.primary }}>
            {measurement.weight} kg
          </Text>
        )}
        {measurement.weight !== null && (
          <WeightTrend current={measurement.weight} previous={previousWeight} />
        )}
      </View>

      {details.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 10,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          {details.map((d) => (
            <View
              key={d.label}
              style={{
                backgroundColor: colors.bg.tertiary,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontSize: 11, color: colors.text.tertiary }}>{d.label}</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.primary }}>
                {d.value}
              </Text>
            </View>
          ))}
        </View>
      )}

      {measurement.notes && (
        <Text
          style={{
            fontSize: 13,
            color: colors.text.secondary,
            fontStyle: 'italic',
            marginTop: 8,
          }}
        >
          {measurement.notes}
        </Text>
      )}
    </View>
  );
}

export default function BodyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const { measurements, isLoading, reload: reloadMeasurements } = useBodyMeasurements();

  useFocusEffect(
    useCallback(() => {
      reloadMeasurements();
    }, [reloadMeasurements]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await reloadMeasurements();
    setRefreshing(false);
  }, [reloadMeasurements]);

  const handleEdit = useCallback(
    (id: number) => {
      router.push(`/body/${id}`);
    },
    [router],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        const db = await getDatabase();
        const repo = new BodyRepository(db);
        await repo.delete(id);
        await reloadMeasurements();
      } catch (error) {
        console.error('Failed to delete measurement:', error);
      }
    },
    [reloadMeasurements],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: colors.text.primary,
            letterSpacing: -0.5,
          }}
        >
          {t('body.title')}
        </Text>
        <Pressable
          onPress={() => router.push('/body/add')}
          accessibilityRole="button"
          accessibilityLabel="Add measurement"
        >
          {({ pressed }) => (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.brand.blue,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              }}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={2} />
            </View>
          )}
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand.blue} />
        </View>
      ) : measurements.length === 0 ? (
        <EmptyState
          icon={Scale}
          message={t('body.empty')}
          actionLabel={t('body.addMeasurement')}
          onAction={() => router.push('/body/add')}
        />
      ) : (
        <FlatList
          data={measurements}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
              <BodyMetricsCharts measurements={measurements} />
            </View>
          }
          renderItem={({ item, index }) => {
            const prevMeasurement = measurements[index + 1];
            const previousWeight = prevMeasurement?.weight ?? null;
            return (
              <MeasurementCard
                measurement={item}
                previousWeight={previousWeight}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            );
          }}
          contentContainerStyle={{ gap: 10, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brand.blue}
              colors={[colors.brand.blue]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
