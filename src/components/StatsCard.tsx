import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '@/constants/theme';

interface StatsCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color?: string;
  accentColor?: string;
}

export function StatsCard({ label, value, icon: Icon, color, accentColor }: StatsCardProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg.secondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        borderLeftWidth: accentColor ? 3 : 1,
        borderLeftColor: accentColor ?? colors.border,
      }}
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="text"
    >
      <Icon size={20} color={colors.text.tertiary} strokeWidth={1.5} />
      <Text
        style={{
          fontSize: 24,
          fontWeight: '700',
          color: color ?? colors.text.primary,
          marginTop: 8,
          letterSpacing: -0.5,
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: colors.text.secondary,
          marginTop: 2,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}
