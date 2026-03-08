import { useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { useBadges } from '@/hooks/useBadges';
import { BADGE_DEFINITIONS, TOTAL_BADGES, badgeCategoryColors } from '@/constants/badges';
import type { Badge } from '@/types';

function formatBadgeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

export default function BadgesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { badges, isLoading, reload } = useBadges();

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const unlockedKeys = new Set(badges.map((b) => b.badgeKey));
  const unlockedCount = badges.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={{ marginRight: 12 }}
        >
          {({ pressed }) => (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.bg.tertiary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              }}
            >
              <ArrowLeft size={20} color={colors.text.secondary} strokeWidth={2} />
            </View>
          )}
        </Pressable>
        <Text
          style={{
            flex: 1,
            fontSize: 20,
            fontWeight: '700',
            color: colors.text.primary,
            letterSpacing: -0.3,
          }}
        >
          {t('badges.title')}
        </Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand.blue} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        >
          {/* Counter */}
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Text
              style={{
                fontSize: 32,
                fontWeight: '700',
                color: colors.text.primary,
              }}
            >
              {unlockedCount}/{TOTAL_BADGES}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.text.secondary,
                marginTop: 4,
              }}
            >
              {t('badges.unlocked', { count: unlockedCount, total: TOTAL_BADGES })}
            </Text>
          </View>

          {/* Badge Grid */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {BADGE_DEFINITIONS.map((definition) => {
              const isUnlocked = unlockedKeys.has(definition.key);
              const badge = badges.find((b) => b.badgeKey === definition.key);

              return (
                <BadgeCard
                  key={definition.key}
                  definition={definition}
                  isUnlocked={isUnlocked}
                  badge={badge}
                />
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

interface BadgeCardProps {
  definition: (typeof BADGE_DEFINITIONS)[number];
  isUnlocked: boolean;
  badge: Badge | undefined;
}

function BadgeCard({ definition, isUnlocked, badge }: BadgeCardProps) {
  const { t } = useTranslation();
  const categoryColor = badgeCategoryColors[definition.category];

  return (
    <View
      style={{
        width: '31%',
        backgroundColor: isUnlocked ? colors.bg.secondary : colors.bg.tertiary,
        borderWidth: 1,
        borderColor: isUnlocked ? categoryColor.color + '40' : colors.bg.tertiary,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        opacity: isUnlocked ? 1 : 0.5,
      }}
      accessibilityLabel={
        isUnlocked
          ? `${t(definition.titleKey)}: ${t(definition.descriptionKey)}`
          : `Locked badge: ${t(definition.descriptionKey)}`
      }
    >
      {/* Icon */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: isUnlocked ? categoryColor.bg : colors.bg.elevated,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        {isUnlocked ? (
          <Text style={{ fontSize: 24 }}>{definition.emoji}</Text>
        ) : (
          <Lock size={20} color={colors.text.tertiary} strokeWidth={1.5} />
        )}
      </View>

      {/* Title */}
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: isUnlocked ? colors.text.primary : colors.text.tertiary,
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {isUnlocked ? t(definition.titleKey) : t('badges.locked')}
      </Text>

      {/* Description / Date */}
      <Text
        style={{
          fontSize: 10,
          color: isUnlocked ? categoryColor.color : colors.text.tertiary,
          textAlign: 'center',
          marginTop: 2,
        }}
        numberOfLines={2}
      >
        {isUnlocked && badge
          ? t('badges.unlockedOn', { date: formatBadgeDate(badge.unlockedAt) })
          : t(definition.descriptionKey)}
      </Text>
    </View>
  );
}
