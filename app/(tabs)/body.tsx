import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Scale, TrendingDown, TrendingUp, Minus, Trash2 } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { getDatabase } from '@/db/connection';
import { BodyRepository } from '@/repositories/body.repo';
import { useBodyMeasurements, useWeightProgress } from '@/hooks/useBodyMetrics';
import { EmptyState } from '@/components/ui';
import type { BodyMeasurement } from '@/types';

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

function SimpleWeightChart({ data }: { data: Array<{ date: string; weight: number }> }) {
  if (data.length < 2) return null;

  const weights = data.map((d) => d.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const chartHeight = 120;
  const chartWidth = 300;
  const pointSpacing = Math.min(chartWidth / (data.length - 1), 40);
  const actualWidth = pointSpacing * (data.length - 1);

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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 13, color: colors.text.tertiary }}>{max.toFixed(1)} kg</Text>
        <Text style={{ fontSize: 13, color: colors.text.tertiary }}>{min.toFixed(1)} kg</Text>
      </View>
      <View
        style={{
          height: chartHeight,
          width: actualWidth,
          alignSelf: 'center',
        }}
      >
        {data.map((point, i) => {
          const x = i * pointSpacing;
          const y = chartHeight - ((point.weight - min) / range) * (chartHeight - 8);
          return (
            <View
              key={point.date}
              style={{
                position: 'absolute',
                left: x - 3,
                top: y - 3,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.brand.blue,
              }}
            />
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ fontSize: 11, color: colors.text.tertiary }}>
          {data.length > 0 ? formatDate(data[0].date) : ''}
        </Text>
        <Text style={{ fontSize: 11, color: colors.text.tertiary }}>
          {data.length > 0 ? formatDate(data[data.length - 1].date) : ''}
        </Text>
      </View>
    </View>
  );
}

function MeasurementCard({
  measurement,
  previousWeight,
  onDelete,
}: {
  measurement: BodyMeasurement;
  previousWeight: number | null;
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
        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 4 })}
          accessibilityRole="button"
          accessibilityLabel="Delete measurement"
        >
          <Trash2 size={16} color={colors.text.tertiary} strokeWidth={1.5} />
        </Pressable>
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
  const { data: weightData, reload: reloadWeight } = useWeightProgress();

  useFocusEffect(
    useCallback(() => {
      reloadMeasurements();
      reloadWeight();
    }, [reloadMeasurements, reloadWeight]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([reloadMeasurements(), reloadWeight()]);
    setRefreshing(false);
  }, [reloadMeasurements, reloadWeight]);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        const db = await getDatabase();
        const repo = new BodyRepository(db);
        await repo.delete(id);
        await Promise.all([reloadMeasurements(), reloadWeight()]);
      } catch (error) {
        console.error('Failed to delete measurement:', error);
      }
    },
    [reloadMeasurements, reloadWeight],
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
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: colors.brand.blue,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
          accessibilityRole="button"
          accessibilityLabel="Add measurement"
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2} />
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
              <SimpleWeightChart data={weightData} />
            </View>
          }
          renderItem={({ item, index }) => {
            const prevMeasurement = measurements[index + 1];
            const previousWeight = prevMeasurement?.weight ?? null;
            return (
              <MeasurementCard
                measurement={item}
                previousWeight={previousWeight}
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
