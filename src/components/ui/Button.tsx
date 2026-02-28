import { View, Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';
import { colors } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; pressedBg: string }> = {
  primary: {
    bg: colors.brand.blue,
    text: '#FFFFFF',
    pressedBg: '#2B7FE0',
  },
  secondary: {
    bg: colors.bg.tertiary,
    text: colors.text.primary,
    pressedBg: colors.bg.elevated,
  },
  danger: {
    bg: colors.semantic.error,
    text: '#FFFFFF',
    pressedBg: '#DC2626',
  },
};

const sizeStyles: Record<ButtonSize, { height: number; fontSize: number; paddingH: number }> = {
  sm: { height: 36, fontSize: 14, paddingH: 12 },
  md: { height: 44, fontSize: 16, paddingH: 16 },
  lg: { height: 52, fontSize: 18, paddingH: 20 },
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable disabled={isDisabled} {...props}>
      {({ pressed }) => (
        <View
          style={{
            height: s.height,
            paddingHorizontal: s.paddingH,
            backgroundColor: pressed ? v.pressedBg : v.bg,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            opacity: isDisabled ? 0.5 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={v.text} />
          ) : (
            <Text
              style={{
                color: v.text,
                fontSize: s.fontSize,
                fontWeight: '600',
              }}
            >
              {title}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}
