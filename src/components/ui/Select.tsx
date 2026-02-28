import { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { colors } from '@/constants/theme';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function Select({ label, placeholder, options, value, onChange, error }: SelectProps) {
  const [visible, setVisible] = useState(false);

  const selectedOption = options.find((o) => o.value === value);

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

      <Pressable
        onPress={() => setVisible(true)}
        style={({ pressed }) => ({
          backgroundColor: colors.bg.tertiary,
          borderWidth: 1,
          borderColor: error ? colors.semantic.error : colors.border,
          borderRadius: 8,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: pressed ? 0.7 : 1,
        })}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selectedOption?.label ?? placeholder ?? 'Select'}`}
      >
        <Text
          style={{
            fontSize: 16,
            color: selectedOption ? colors.text.primary : colors.text.tertiary,
          }}
        >
          {selectedOption?.label ?? placeholder ?? 'Select...'}
        </Text>
        <ChevronDown size={18} color={colors.text.tertiary} strokeWidth={1.5} />
      </Pressable>

      {error && <Text style={{ fontSize: 13, color: colors.semantic.error }}>{error}</Text>}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          onPress={() => setVisible(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: colors.bg.elevated,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '50%',
              paddingBottom: 34,
            }}
          >
            {/* Handle */}
            <View
              style={{
                alignSelf: 'center',
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.text.tertiary,
                marginTop: 12,
                marginBottom: 8,
              }}
            />

            {/* Title */}
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.text.primary,
                paddingHorizontal: 20,
                paddingVertical: 12,
              }}
            >
              {label}
            </Text>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              ItemSeparatorComponent={() => (
                <View
                  style={{
                    height: 1,
                    backgroundColor: colors.border,
                    marginHorizontal: 20,
                  }}
                />
              )}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setVisible(false);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    backgroundColor: pressed
                      ? colors.bg.tertiary
                      : item.value === value
                        ? colors.accent.blue10
                        : 'transparent',
                  })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: item.value === value }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: item.value === value ? colors.brand.blue : colors.text.primary,
                      fontWeight: item.value === value ? '600' : '400',
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Check size={20} color={colors.brand.blue} strokeWidth={2} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
