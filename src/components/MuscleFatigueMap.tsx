import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import type { FatigueLevel, MuscleFatigueData, MuscleGroup } from '@/types';

const FATIGUE_COLORS: Record<FatigueLevel, string> = {
  weakened: '#EF4444',
  recovering: '#F59E0B',
  recovered: '#22C55E',
  rested: '#3A3A3A',
};

// Simplified body silhouette paths for each muscle group (front view)
const MUSCLE_PATHS: Record<MuscleGroup, string> = {
  // Head and shoulders area
  shoulders:
    'M30 52 C30 48 35 44 42 44 L42 56 C38 58 30 56 30 52 Z M70 52 C70 48 65 44 58 44 L58 56 C62 58 70 56 70 52 Z',
  // Chest area
  chest: 'M42 56 L58 56 L58 72 C54 76 46 76 42 72 Z',
  // Arms (biceps/triceps)
  arms: 'M28 56 C26 58 24 68 24 78 L30 78 L32 58 Z M72 56 C74 58 76 68 76 78 L70 78 L68 58 Z',
  // Core/abs
  core: 'M42 72 C46 76 54 76 58 72 L58 92 L42 92 Z',
  // Back (shown as upper back area)
  back: 'M42 44 L58 44 L58 56 L42 56 Z',
  // Upper legs/quads
  legs: 'M38 92 L48 92 L46 120 L36 120 Z M52 92 L62 92 L64 120 L54 120 Z',
  // Full body (calves/lower)
  full_body: 'M36 120 L46 120 L44 142 L38 142 Z M54 120 L64 120 L62 142 L56 142 Z',
};

// Head silhouette (decorative, not a muscle group)
const HEAD_PATH = 'M44 20 C44 12 56 12 56 20 C56 28 54 34 54 38 L46 38 C46 34 44 28 44 20 Z';
const NECK_PATH = 'M46 38 L54 38 L56 44 L44 44 Z';

interface MuscleFatigueMapProps {
  data: MuscleFatigueData[];
}

export function MuscleFatigueMap({ data }: MuscleFatigueMapProps) {
  const { t } = useTranslation();
  const fatigueMap = new Map(data.map((d) => [d.muscleGroup, d]));

  const getColor = (group: MuscleGroup): string => {
    const item = fatigueMap.get(group);
    return item ? FATIGUE_COLORS[item.level] : FATIGUE_COLORS.rested;
  };

  // Count unique levels present
  const uniqueLevels = new Set(data.map((d) => d.level));

  return (
    <View
      style={{
        backgroundColor: colors.bg.secondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 16,
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <Svg width={120} height={180} viewBox="20 8 60 140">
          {/* Head (decorative) */}
          <Path d={HEAD_PATH} fill={colors.bg.tertiary} opacity={0.6} />
          <Path d={NECK_PATH} fill={colors.bg.tertiary} opacity={0.6} />

          {/* Muscle groups */}
          {(Object.entries(MUSCLE_PATHS) as Array<[MuscleGroup, string]>).map(([group, path]) => (
            <Path key={group} d={path} fill={getColor(group)} opacity={0.85} />
          ))}
        </Svg>
      </View>

      {/* Labels for each group */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 6,
          marginTop: 12,
          justifyContent: 'center',
        }}
      >
        {data.map((item) => (
          <View
            key={item.muscleGroup}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: colors.bg.tertiary,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: FATIGUE_COLORS[item.level],
              }}
            />
            <Text style={{ fontSize: 11, color: colors.text.secondary }}>
              {t(`muscle.${item.muscleGroup}` as TranslationKey)}
            </Text>
          </View>
        ))}
      </View>

      {/* Legend */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 12,
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        {(['weakened', 'recovering', 'recovered', 'rested'] as FatigueLevel[])
          .filter((level) => uniqueLevels.has(level) || level === 'rested')
          .map((level) => (
            <View key={level} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: FATIGUE_COLORS[level],
                }}
              />
              <Text style={{ fontSize: 10, color: colors.text.tertiary }}>
                {t(`fatigue.${level}` as TranslationKey)}
              </Text>
            </View>
          ))}
      </View>
    </View>
  );
}
