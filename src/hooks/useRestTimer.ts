import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

type TimerState = 'idle' | 'running' | 'finished';

interface UseRestTimerReturn {
  state: TimerState;
  remainingSeconds: number;
  totalSeconds: number;
  start: (seconds?: number) => void;
  skip: () => void;
  reset: () => void;
  addTime: (seconds: number) => void;
}

export function useRestTimer(defaultSeconds: number = 90): UseRestTimerReturn {
  const [state, setState] = useState<TimerState>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const playFinishFeedback = useCallback(async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('@/assets/sounds/timer-done.mp3'),
      );
      await sound.playAsync();
      // Unload after playing
      setTimeout(() => {
        sound.unloadAsync();
      }, 3000);
    } catch {
      // Sound playback is non-critical, silently fail
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics is non-critical
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  const start = useCallback(
    (seconds?: number) => {
      clearTimer();

      const duration = seconds ?? defaultSeconds;
      setRemainingSeconds(duration);
      setTotalSeconds(duration);
      setState('running');

      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearTimer();
            setState('finished');
            playFinishFeedback();
            return 0;
          }
          return next;
        });
      }, 1000);
    },
    [defaultSeconds, clearTimer, playFinishFeedback],
  );

  const skip = useCallback(() => {
    clearTimer();
    setState('idle');
    setRemainingSeconds(0);
    setTotalSeconds(0);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setState('idle');
    setRemainingSeconds(0);
    setTotalSeconds(0);
  }, [clearTimer]);

  const addTime = useCallback((seconds: number) => {
    setRemainingSeconds((prev) => prev + seconds);
    setTotalSeconds((prev) => prev + seconds);
  }, []);

  return {
    state,
    remainingSeconds,
    totalSeconds,
    start,
    skip,
    reset,
    addTime,
  };
}
