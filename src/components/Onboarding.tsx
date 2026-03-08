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

const SLIDE_COUNT = 3;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

        {/* Slide 2: Features */}
        <View
          style={{
            width: SCREEN_WIDTH,
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 40,
          }}
        >
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
            {t('onboarding.features.title')}
          </Text>
          <FeatureBullet emoji={'\u{1F4AA}'} text={t('onboarding.features.workouts')} />
          <FeatureBullet emoji={'\u{1F4CA}'} text={t('onboarding.features.progress')} />
          <FeatureBullet emoji={'\u{1F3C5}'} text={t('onboarding.features.badges')} />
        </View>

        {/* Slide 3: Get Started */}
        <View
          style={{
            width: SCREEN_WIDTH,
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 40,
          }}
        >
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
              width: 8,
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

function FeatureBullet({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
      }}
    >
      <Text style={{ fontSize: 28, marginRight: 16 }}>{emoji}</Text>
      <Text
        style={{
          fontSize: 17,
          color: colors.text.primary,
          flex: 1,
          lineHeight: 24,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
