import { View, Text } from 'react-native';
import { colors } from '@/constants/theme';
import type { GroupType } from '@/types';

interface ExerciseGroupBadgeProps {
  groupType: GroupType;
  letter: string;
}

const GROUP_LABELS: Record<GroupType, string> = {
  superset: 'Superset',
  circuit: 'Circuit',
  dropset: 'Dropset',
};

function getGroupColor(groupType: GroupType): string {
  return colors.group[groupType];
}

function getGroupBgColor(groupType: GroupType): string {
  const bgMap: Record<GroupType, string> = {
    superset: colors.group.supersetBg,
    circuit: colors.group.circuitBg,
    dropset: colors.group.dropsetBg,
  };
  return bgMap[groupType];
}

export function ExerciseGroupBadge({ groupType, letter }: ExerciseGroupBadgeProps) {
  const groupColor = getGroupColor(groupType);
  const bgColor = getGroupBgColor(groupType);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: bgColor,
      }}
      accessibilityLabel={`${GROUP_LABELS[groupType]} ${letter}`}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: groupColor,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        }}
      >
        {GROUP_LABELS[groupType]} {letter}
      </Text>
    </View>
  );
}

export function getGroupLetterFromId(groupId: number, allGroupIds: number[]): string {
  const uniqueIds = [...new Set(allGroupIds.filter((id) => id !== null))].sort((a, b) => a - b);
  const index = uniqueIds.indexOf(groupId);
  return String.fromCharCode(65 + (index >= 0 ? index : 0));
}

export function getGroupBorderColor(groupType: GroupType): string {
  return getGroupColor(groupType);
}
