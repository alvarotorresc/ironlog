import { View, Text, Pressable, Modal } from 'react-native';
import { Link2, Zap, TrendingDown } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useTranslation, type TranslationKey } from '@/i18n';
import type { GroupType } from '@/types';

interface GroupTypePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (groupType: GroupType) => void;
}

interface GroupOption {
  type: GroupType;
  icon: typeof Link2;
  descriptionKey: TranslationKey;
}

const GROUP_OPTIONS: GroupOption[] = [
  { type: 'superset', icon: Link2, descriptionKey: 'group.superset' },
  { type: 'circuit', icon: Zap, descriptionKey: 'group.circuit' },
  { type: 'dropset', icon: TrendingDown, descriptionKey: 'group.dropset' },
];

export function GroupTypePicker({ visible, onClose, onSelect }: GroupTypePickerProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            width: '100%',
            maxWidth: 320,
            backgroundColor: colors.bg.secondary,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
          }}
          onPress={() => {}}
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.text.primary,
                letterSpacing: -0.3,
              }}
            >
              {t('group.selectType')}
            </Text>
          </View>

          {/* Options */}
          <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 4 }}>
            {GROUP_OPTIONS.map((option) => {
              const Icon = option.icon;
              const groupColor = colors.group[option.type];

              return (
                <Pressable
                  key={option.type}
                  onPress={() => onSelect(option.type)}
                  accessibilityRole="button"
                  accessibilityLabel={t(option.descriptionKey)}
                >
                  {({ pressed }) => (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 14,
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        borderRadius: 10,
                        backgroundColor: pressed ? colors.bg.tertiary : 'transparent',
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          backgroundColor: `${groupColor}15`,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={18} color={groupColor} strokeWidth={2} />
                      </View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '500',
                          color: colors.text.primary,
                        }}
                      >
                        {t(option.descriptionKey)}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Cancel */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.border,
              padding: 12,
            }}
          >
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              {({ pressed }) => (
                <View
                  style={{
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: pressed ? colors.bg.tertiary : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '500',
                      color: colors.text.secondary,
                    }}
                  >
                    {t('common.cancel')}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
