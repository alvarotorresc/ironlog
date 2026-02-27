import { Text, Pressable, ScrollView } from 'react-native';
import { colors } from '@/constants/theme';
import type { TimePeriod } from '@/types';

interface PeriodSelectorProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

const PERIODS: Array<{ label: string; value: TimePeriod }> = [
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: 'All', value: 'all' },
];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {PERIODS.map((period) => {
        const active = value === period.value;
        return (
          <Pressable
            key={period.value}
            onPress={() => onChange(period.value)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 14,
              borderRadius: 999,
              backgroundColor: active ? colors.brand.blue : colors.bg.tertiary,
              borderWidth: active ? 0 : 1,
              borderColor: colors.border,
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Filter by ${period.label}`}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: active ? '600' : '400',
                color: active ? '#FFFFFF' : colors.text.secondary,
              }}
            >
              {period.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
