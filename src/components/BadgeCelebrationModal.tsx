import { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import {
  getBadgeEmoji,
  getBadgeCategoryColor,
  getBadgeTitleKey,
  getBadgeDescriptionKey,
} from '@/constants/badges';
import type { Badge } from '@/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#FFD700',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
];

const PARTICLE_COUNT = 40;

interface ConfettiParticleData {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
}

interface BadgeCelebrationModalProps {
  badge: Badge | null;
  onDismiss: () => void;
}

function ConfettiParticle({ particle }: { particle: ConfettiParticleData }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      particle.delay,
      withTiming(1, { duration: particle.duration, easing: Easing.out(Easing.quad) }),
    );
  }, [particle.delay, particle.duration, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const wobble = Math.sin(progress.value * 6 * Math.PI) * 30;

    return {
      position: 'absolute',
      left: particle.x + wobble,
      top: -20 + progress.value * (SCREEN_HEIGHT + 40),
      width: particle.size,
      height: particle.size * 1.5,
      backgroundColor: particle.color,
      borderRadius: 2,
      opacity: 1 - progress.value * 0.6,
      transform: [{ rotate: `${progress.value * 720}deg` }],
    };
  });

  return <Animated.View style={animatedStyle} />;
}

function BadgeContent({ badge, onDismiss }: { badge: Badge; onDismiss: () => void }) {
  const { t } = useTranslation();
  const iconScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  const emoji = getBadgeEmoji(badge.badgeKey);
  const categoryColor = getBadgeCategoryColor(badge.badgeKey);
  const titleKey = getBadgeTitleKey(badge.badgeKey);
  const descriptionKey = getBadgeDescriptionKey(badge.badgeKey);

  const [particles] = useState<ConfettiParticleData[]>(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 6,
      delay: Math.random() * 500,
      duration: 2000 + Math.random() * 1000,
    })),
  );

  useEffect(() => {
    iconScale.value = 0;
    contentOpacity.value = 0;

    iconScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 120 }));
    contentOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
  }, [badge.id, iconScale, contentOpacity]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Confetti layer */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        pointerEvents="none"
      >
        {particles.map((particle) => (
          <ConfettiParticle key={particle.id} particle={particle} />
        ))}
      </View>

      {/* Center content */}
      <View style={{ alignItems: 'center', paddingHorizontal: 40 }}>
        {/* Badge emoji circle */}
        <Animated.View
          style={[
            {
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: categoryColor.bg,
              borderWidth: 2,
              borderColor: categoryColor.color,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            },
            iconAnimatedStyle,
          ]}
        >
          <Text style={{ fontSize: 44 }}>{emoji}</Text>
        </Animated.View>

        {/* Text content */}
        <Animated.View style={[{ alignItems: 'center' }, contentAnimatedStyle]}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: categoryColor.color,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              marginBottom: 8,
            }}
          >
            {t('badges.newBadge')}
          </Text>

          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: colors.text.primary,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {t(titleKey)}
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: colors.text.secondary,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 40,
            }}
          >
            {t(descriptionKey)}
          </Text>

          {/* Continue button */}
          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel={t('badges.continue')}
          >
            {({ pressed }) => (
              <View
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 48,
                  borderRadius: 12,
                  backgroundColor: pressed ? categoryColor.color + 'CC' : categoryColor.color,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#000000',
                  }}
                >
                  {t('badges.continue')}
                </Text>
              </View>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

export function BadgeCelebrationModal({ badge, onDismiss }: BadgeCelebrationModalProps) {
  return (
    <Modal
      visible={!!badge}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      {badge && <BadgeContent badge={badge} onDismiss={onDismiss} />}
    </Modal>
  );
}
