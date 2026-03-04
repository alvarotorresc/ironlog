import { View, Text } from 'react-native';
import { colors } from '@/constants/theme';
import { useTranslation, type TranslationKey } from '@/i18n';
import type { MuscleGroup } from '@/types';

interface MuscleGroupBadgesProps {
  muscleGroups: MuscleGroup[];
  primaryGroup: MuscleGroup;
  compact?: boolean;
}

const MAX_COMPACT = 2;

export function MuscleGroupBadges({
  muscleGroups,
  primaryGroup,
  compact = false,
}: MuscleGroupBadgesProps) {
  const { t } = useTranslation();

  const groups = compact ? muscleGroups.slice(0, MAX_COMPACT) : muscleGroups;
  const overflow = compact ? muscleGroups.length - MAX_COMPACT : 0;

  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 4 : 6, flexWrap: 'wrap' }}
    >
      {groups.map((group) => {
        const isPrimary = group === primaryGroup;
        return (
          <View
            key={group}
            style={{
              backgroundColor: isPrimary ? colors.accent.blue10 : colors.bg.tertiary,
              paddingVertical: compact ? 2 : 4,
              paddingHorizontal: compact ? 6 : 10,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: isPrimary ? colors.brand.blue : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: compact ? 10 : 12,
                fontWeight: isPrimary ? '600' : '500',
                color: isPrimary ? colors.brand.blue : colors.text.secondary,
              }}
              numberOfLines={1}
            >
              {t(`muscle.${group}` as TranslationKey)}
            </Text>
          </View>
        );
      })}
      {overflow > 0 && (
        <Text
          style={{
            fontSize: compact ? 10 : 12,
            color: colors.text.tertiary,
          }}
        >
          {t('muscle.more', { count: String(overflow) })}
        </Text>
      )}
    </View>
  );
}
