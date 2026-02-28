import { View, Text, LayoutChangeEvent } from 'react-native';
import { useState } from 'react';
import { colors } from '@/constants/theme';
import { useTranslation, type TranslationKey } from '@/i18n';
import type { MuscleGroupVolume, MuscleGroup } from '@/types';

interface MuscleDistributionProps {
  data: MuscleGroupVolume[];
}

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  chest: '#3291FF',
  back: '#22C55E',
  legs: '#EF4444',
  shoulders: '#F59E0B',
  arms: '#A855F7',
  core: '#06B6D4',
  full_body: '#64748B',
};

function computePercentages(
  data: MuscleGroupVolume[],
  translate: (key: TranslationKey) => string,
): Array<{
  muscleGroup: MuscleGroup;
  label: string;
  percentage: number;
  color: string;
}> {
  const totalVolume = data.reduce((sum, item) => sum + item.totalVolume, 0);
  if (totalVolume === 0) return [];

  return data
    .map((item) => ({
      muscleGroup: item.muscleGroup,
      label: translate(`muscle.${item.muscleGroup}` as TranslationKey),
      percentage: (item.totalVolume / totalVolume) * 100,
      color: MUSCLE_COLORS[item.muscleGroup],
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

export function MuscleDistribution({ data }: MuscleDistributionProps) {
  const { t } = useTranslation();
  const [barMaxWidth, setBarMaxWidth] = useState(0);
  const entries = computePercentages(data, t);

  const handleLayout = (event: LayoutChangeEvent) => {
    setBarMaxWidth(event.nativeEvent.layout.width);
  };

  if (data.length === 0) {
    return (
      <View
        style={{
          backgroundColor: colors.bg.secondary,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 20,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: colors.text.tertiary,
            fontStyle: 'italic',
          }}
        >
          {t('common.noData')}
        </Text>
      </View>
    );
  }

  const maxPercentage = entries.length > 0 ? entries[0].percentage : 100;

  return (
    <View
      style={{
        backgroundColor: colors.bg.secondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        gap: 10,
      }}
      accessibilityLabel="Muscle group volume distribution"
    >
      {entries.map((entry) => (
        <View
          key={entry.muscleGroup}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
          accessibilityLabel={`${entry.label}: ${Math.round(entry.percentage)}%`}
        >
          <Text
            style={{
              width: 72,
              fontSize: 13,
              color: colors.text.secondary,
              fontWeight: '500',
            }}
            numberOfLines={1}
          >
            {entry.label}
          </Text>
          <View
            style={{ flex: 1, height: 20, borderRadius: 4, overflow: 'hidden' }}
            onLayout={handleLayout}
          >
            <View
              style={{
                height: '100%',
                width:
                  barMaxWidth > 0
                    ? (entry.percentage / maxPercentage) * barMaxWidth
                    : `${(entry.percentage / maxPercentage) * 100}%`,
                backgroundColor: entry.color,
                borderRadius: 4,
                minWidth: 4,
              }}
            />
          </View>
          <Text
            style={{
              width: 40,
              fontSize: 12,
              color: colors.text.tertiary,
              textAlign: 'right',
              fontWeight: '600',
            }}
          >
            {Math.round(entry.percentage)}%
          </Text>
        </View>
      ))}
    </View>
  );
}
