import { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import type { TranslationKey } from '@/i18n';

const SLIDE_COUNT = 9;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SlideConfig {
  emoji: string;
  titleKey: TranslationKey;
  bullets: Array<{ emoji: string; textKey: TranslationKey }>;
}

const FEATURE_SLIDES: SlideConfig[] = [
  {
    emoji: '\u{1F4CB}',
    titleKey: 'onboarding.routines.title',
    bullets: [
      { emoji: '\u{2705}', textKey: 'onboarding.routines.bullet1' },
      { emoji: '\u{1F4E6}', textKey: 'onboarding.routines.bullet2' },
      { emoji: '\u{1F500}', textKey: 'onboarding.routines.bullet3' },
    ],
  },
  {
    emoji: '\u{1F4AA}',
    titleKey: 'onboarding.sets.title',
    bullets: [
      { emoji: '\u{1F3CB}\u{FE0F}', textKey: 'onboarding.sets.bullet1' },
      { emoji: '\u{23F1}\u{FE0F}', textKey: 'onboarding.sets.bullet2' },
      { emoji: '\u{1F517}', textKey: 'onboarding.sets.bullet3' },
    ],
  },
  {
    emoji: '\u{1F4CA}',
    titleKey: 'onboarding.progress.title',
    bullets: [
      { emoji: '\u{1F4C8}', textKey: 'onboarding.progress.bullet1' },
      { emoji: '\u{1F9BE}', textKey: 'onboarding.progress.bullet2' },
      { emoji: '\u{1F4C5}', textKey: 'onboarding.progress.bullet3' },
    ],
  },
  {
    emoji: '\u{1F3C5}',
    titleKey: 'onboarding.badges.title',
    bullets: [
      { emoji: '\u{1F525}', textKey: 'onboarding.badges.bullet1' },
      { emoji: '\u{1F4AA}', textKey: 'onboarding.badges.bullet2' },
      { emoji: '\u{1F389}', textKey: 'onboarding.badges.bullet3' },
    ],
  },
  {
    emoji: '\u{1F4CF}',
    titleKey: 'onboarding.body.title',
    bullets: [
      { emoji: '\u{2696}\u{FE0F}', textKey: 'onboarding.body.bullet1' },
      { emoji: '\u{1F4F8}', textKey: 'onboarding.body.bullet2' },
      { emoji: '\u{1F4C9}', textKey: 'onboarding.body.bullet3' },
    ],
  },
  {
    emoji: '\u{270F}\u{FE0F}',
    titleKey: 'onboarding.exercises.title',
    bullets: [
      { emoji: '\u{2795}', textKey: 'onboarding.exercises.bullet1' },
      { emoji: '\u{1F4DD}', textKey: 'onboarding.exercises.bullet2' },
      { emoji: '\u{1F50D}', textKey: 'onboarding.exercises.bullet3' },
    ],
  },
  {
    emoji: '\u{1F512}',
    titleKey: 'onboarding.backup.title',
    bullets: [
      { emoji: '\u{1F4F1}', textKey: 'onboarding.backup.bullet1' },
      { emoji: '\u{1F4BE}', textKey: 'onboarding.backup.bullet2' },
      { emoji: '\u{1F6AB}', textKey: 'onboarding.backup.bullet3' },
    ],
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPage(page);
  }, []);

  const handleSkip = useCallback(() => {
    scrollRef.current?.scrollTo({
      x: SCREEN_WIDTH * (SLIDE_COUNT - 1),
      animated: true,
    });
  }, []);

  const isLastSlide = currentPage === SLIDE_COUNT - 1;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg.primary,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      {/* Skip button */}
      {!isLastSlide && (
        <Pressable
          onPress={handleSkip}
          accessibilityLabel={t('onboarding.skip')}
          accessibilityRole="button"
          style={{ position: 'absolute', top: insets.top + 16, right: 24, zIndex: 10 }}
        >
          {({ pressed }) => (
            <Text
              style={{
                fontSize: 16,
                color: pressed ? colors.text.tertiary : colors.text.secondary,
              }}
            >
              {t('onboarding.skip')}
            </Text>
          )}
        </Pressable>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        bounces={false}
        style={{ flex: 1 }}
      >
        {/* Slide 1: Welcome */}
        <View
          style={{
            width: SCREEN_WIDTH,
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 40,
          }}
        >
          <Text style={{ fontSize: 56, marginBottom: 24 }} accessibilityLabel="dumbbell">
            {'\u{1F3CB}\u{FE0F}'}
          </Text>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: colors.text.primary,
              textAlign: 'center',
              letterSpacing: -0.5,
              marginBottom: 12,
            }}
          >
            {t('onboarding.welcome.title')}
          </Text>
          <Text
            style={{
              fontSize: 17,
              color: colors.text.secondary,
              textAlign: 'center',
              lineHeight: 24,
            }}
          >
            {t('onboarding.welcome.subtitle')}
          </Text>
        </View>

        {/* Feature slides (2-8) */}
        {FEATURE_SLIDES.map((slide) => (
          <FeatureSlide key={slide.titleKey} slide={slide} />
        ))}

        {/* Slide 9: Get Started */}
        <View
          style={{
            width: SCREEN_WIDTH,
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 40,
          }}
        >
          <Text style={{ fontSize: 56, marginBottom: 24 }}>{'\u{1F680}'}</Text>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: colors.text.primary,
              textAlign: 'center',
              letterSpacing: -0.5,
              marginBottom: 12,
            }}
          >
            {t('onboarding.ready.title')}
          </Text>
          <Text
            style={{
              fontSize: 17,
              color: colors.text.secondary,
              textAlign: 'center',
              lineHeight: 24,
              marginBottom: 40,
            }}
          >
            {t('onboarding.ready.subtitle')}
          </Text>
          <Pressable
            onPress={onComplete}
            accessibilityLabel={t('onboarding.getStarted')}
            accessibilityRole="button"
            style={{
              backgroundColor: colors.brand.blue,
              borderRadius: 12,
              paddingVertical: 16,
              width: '100%',
              alignItems: 'center',
            }}
          >
            {({ pressed }) => (
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '600',
                  color: colors.text.primary,
                  opacity: pressed ? 0.7 : 1,
                }}
              >
                {t('onboarding.getStarted')}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Dot indicators */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingBottom: 32,
          gap: 8,
        }}
        accessibilityLabel={`Page ${currentPage + 1} of ${SLIDE_COUNT}`}
        accessibilityRole="tablist"
      >
        {Array.from({ length: SLIDE_COUNT }, (_, i) => (
          <View
            key={i}
            style={{
              width: currentPage === i ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === currentPage ? colors.brand.blue : colors.text.tertiary,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function FeatureSlide({ slide }: { slide: SlideConfig }) {
  const { t } = useTranslation();

  return (
    <View
      style={{
        width: SCREEN_WIDTH,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
      }}
    >
      <Text style={{ fontSize: 56, marginBottom: 24 }}>{slide.emoji}</Text>
      <Text
        style={{
          fontSize: 28,
          fontWeight: '700',
          color: colors.text.primary,
          textAlign: 'center',
          letterSpacing: -0.5,
          marginBottom: 32,
        }}
      >
        {t(slide.titleKey)}
      </Text>
      {slide.bullets.map((bullet) => (
        <View
          key={bullet.textKey}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
            width: '100%',
          }}
        >
          <Text style={{ fontSize: 24, marginRight: 16, width: 32, textAlign: 'center' }}>
            {bullet.emoji}
          </Text>
          <Text
            style={{
              fontSize: 17,
              color: colors.text.primary,
              flex: 1,
              lineHeight: 24,
            }}
          >
            {t(bullet.textKey)}
          </Text>
        </View>
      ))}
    </View>
  );
}
