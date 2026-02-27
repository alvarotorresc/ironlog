import { View, type ViewProps } from 'react-native';
import { colors } from '@/constants/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...props }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.bg.secondary,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 16,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
