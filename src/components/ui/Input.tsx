import { View, Text, TextInput, type TextInputProps } from 'react-native';
import { colors } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '500',
          color: colors.text.secondary,
        }}
      >
        {label}
      </Text>
      <TextInput
        style={[
          {
            backgroundColor: colors.bg.tertiary,
            borderWidth: 1,
            borderColor: error ? colors.semantic.error : colors.border,
            borderRadius: 8,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 16,
            color: colors.text.primary,
          },
          style,
        ]}
        placeholderTextColor={colors.text.tertiary}
        cursorColor={colors.brand.blue}
        selectionColor={colors.brand.blue}
        {...props}
      />
      {error && <Text style={{ fontSize: 13, color: colors.semantic.error }}>{error}</Text>}
    </View>
  );
}
