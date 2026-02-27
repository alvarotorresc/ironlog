import { useEffect, useState } from 'react';
import { Animated, Text } from 'react-native';
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
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [translateAnim] = useState(() => new Animated.Value(8));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateAnim]);

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: colors.bg.secondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        borderLeftWidth: accentColor ? 3 : 1,
        borderLeftColor: accentColor ?? colors.border,
        opacity: fadeAnim,
        transform: [{ translateY: translateAnim }],
      }}
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="text"
    >
      <Icon size={20} color={accentColor ?? colors.text.tertiary} strokeWidth={1.5} />
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
    </Animated.View>
  );
}
