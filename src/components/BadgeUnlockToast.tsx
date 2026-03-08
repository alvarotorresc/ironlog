import { useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { colors } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { getBadgeEmoji, getBadgeCategoryColor, getBadgeTitleKey } from '@/constants/badges';
import type { Badge } from '@/types';

interface BadgeUnlockToastProps {
  badge: Badge | null;
  onDismiss: () => void;
}

const TOAST_DURATION = 3000;
const FADE_DURATION = 300;

/**
 * Toast notification shown when a badge is unlocked.
 * @deprecated Use BadgeCelebrationModal instead.
 */
export function BadgeUnlockToast({ badge, onDismiss }: BadgeUnlockToastProps) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(-20));

  useEffect(() => {
    if (!badge) return;

    opacity.setValue(0);
    translateY.setValue(-20);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss());
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [badge, opacity, translateY, onDismiss]);

  if (!badge) return null;

  const emoji = getBadgeEmoji(badge.badgeKey);
  const categoryColor = getBadgeCategoryColor(badge.badgeKey);
  const titleKey = getBadgeTitleKey(badge.badgeKey);

  return (
    <BadgeToastContent
      opacity={opacity}
      translateY={translateY}
      emoji={emoji}
      categoryColor={categoryColor.color}
      titleKey={titleKey}
    />
  );
}

interface BadgeToastContentProps {
  opacity: Animated.Value;
  translateY: Animated.Value;
  emoji: string;
  categoryColor: string;
  titleKey: ReturnType<typeof getBadgeTitleKey>;
}

function BadgeToastContent({
  opacity,
  translateY,
  emoji,
  categoryColor,
  titleKey,
}: BadgeToastContentProps) {
  const { t } = useTranslation();

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        zIndex: 1000,
        opacity,
        transform: [{ translateY }],
      }}
      accessibilityRole="alert"
      accessibilityLabel={`${t('badges.newBadge')} ${t(titleKey)}`}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.bg.secondary,
          borderWidth: 1,
          borderColor: categoryColor,
          borderRadius: 12,
          padding: 14,
          gap: 12,
          shadowColor: categoryColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: categoryColor + '1A',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 20 }}>{emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '500',
              color: colors.brand.blue,
              marginBottom: 2,
            }}
          >
            {t('badges.newBadge')}
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: colors.text.primary,
            }}
            numberOfLines={1}
          >
            {t(titleKey)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
