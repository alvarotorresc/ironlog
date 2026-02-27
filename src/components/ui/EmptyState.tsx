import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 64,
      }}
    >
      <Icon size={48} color={colors.text.tertiary} strokeWidth={1.5} />
      <Text
        style={{
          color: colors.text.secondary,
          fontSize: 16,
          textAlign: 'center',
          marginTop: 16,
          lineHeight: 24,
        }}
      >
        {message}
      </Text>
      {actionLabel && onAction && (
        <View style={{ marginTop: 24 }}>
          <Button title={actionLabel} onPress={onAction} size="md" />
        </View>
      )}
    </View>
  );
}
