import { useEffect, useMemo } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import { SkipForward, Plus, Timer } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useTranslation } from '@/i18n';

interface RestTimerProps {
  state: 'idle' | 'running' | 'finished';
  remainingSeconds: number;
  totalSeconds: number;
  exerciseName?: string;
  onSkip: () => void;
  onAddTime: (seconds: number) => void;
  onDismiss: () => void;
}

function formatTime(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

export function RestTimer({
  state,
  remainingSeconds,
  totalSeconds,
  exerciseName,
  onSkip,
  onAddTime,
  onDismiss,
}: RestTimerProps) {
  const { t } = useTranslation();

  if (state === 'idle') return null;

  const isFinished = state === 'finished';
  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
      }}
    >
      {/* Progress bar */}
      <View
        style={{
          height: 3,
          backgroundColor: colors.border,
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: isFinished ? colors.semantic.success : colors.semantic.warning,
          }}
        />
      </View>

      {/* Banner content */}
      <View
        style={{
          backgroundColor: colors.bg.elevated,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: 20,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Timer circle + info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          {/* Timer circle */}
          <TimerCircle remainingSeconds={remainingSeconds} isFinished={isFinished} />

          {/* Timer info */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: isFinished ? colors.semantic.success : colors.text.primary,
              }}
            >
              {isFinished ? 'GO!' : t('restTimer.title')}
            </Text>
            {exerciseName && (
              <Text
                style={{
                  fontSize: 12,
                  color: colors.text.secondary,
                  marginTop: 1,
                }}
                numberOfLines={1}
              >
                {exerciseName}
                {!isFinished && totalSeconds > 0 ? ` · ${formatTime(totalSeconds)}` : ''}
              </Text>
            )}
          </View>
        </View>

        {/* Right: Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {isFinished ? (
            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => ({
                paddingVertical: 6,
                paddingHorizontal: 14,
                borderRadius: 6,
                backgroundColor: colors.semantic.success,
                opacity: pressed ? 0.7 : 1,
              })}
              accessibilityRole="button"
              accessibilityLabel="Dismiss timer"
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>OK</Text>
            </Pressable>
          ) : (
            <>
              {/* +15s button */}
              <Pressable
                onPress={() => onAddTime(15)}
                accessibilityRole="button"
                accessibilityLabel={t('restTimer.addTime')}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 2,
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 6,
                      backgroundColor: colors.bg.tertiary,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                    }}
                  >
                    <Plus size={12} color={colors.text.secondary} strokeWidth={2} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        fontVariant: ['tabular-nums'],
                        color: colors.text.secondary,
                      }}
                    >
                      15s
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* Skip button */}
              <Pressable
                onPress={onSkip}
                accessibilityRole="button"
                accessibilityLabel={t('restTimer.skip')}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                    }}
                  >
                    <SkipForward size={14} color={colors.text.secondary} strokeWidth={2} />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: colors.text.secondary,
                      }}
                    >
                      {t('restTimer.skip')}
                    </Text>
                  </View>
                )}
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

interface TimerCircleProps {
  remainingSeconds: number;
  isFinished: boolean;
}

function TimerCircle({ remainingSeconds, isFinished }: TimerCircleProps) {
  const pulseAnim = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    if (isFinished) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isFinished, pulseAnim]);

  const borderColor = isFinished ? colors.semantic.success : colors.semantic.warning;
  const textColor = isFinished ? colors.semantic.success : colors.semantic.warning;

  return (
    <Animated.View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 3,
        borderColor,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: pulseAnim }],
      }}
    >
      {isFinished ? (
        <Timer size={18} color={textColor} strokeWidth={2} />
      ) : (
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            fontVariant: ['tabular-nums'],
            color: textColor,
          }}
        >
          {formatTime(remainingSeconds)}
        </Text>
      )}
    </Animated.View>
  );
}
