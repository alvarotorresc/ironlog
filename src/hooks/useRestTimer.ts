import { useState, useCallback, useRef, useEffect } from 'react';
import { AppState } from 'react-native';
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
  const startedAtRef = useRef(0);
  const totalMsRef = useRef(0);

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

  const calcRemaining = useCallback(() => {
    if (startedAtRef.current === 0) return 0;
    const elapsed = Date.now() - startedAtRef.current;
    return Math.ceil((totalMsRef.current - elapsed) / 1000);
  }, []);

  const finishTimer = useCallback(() => {
    clearTimer();
    startedAtRef.current = 0;
    setRemainingSeconds(0);
    setState('finished');
    playFinishFeedback();
  }, [clearTimer, playFinishFeedback]);

  // Recalculate on AppState change (background -> foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && startedAtRef.current > 0) {
        const remaining = calcRemaining();
        if (remaining <= 0) {
          finishTimer();
        } else {
          setRemainingSeconds(remaining);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [calcRemaining, finishTimer]);

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
      startedAtRef.current = Date.now();
      totalMsRef.current = duration * 1000;
      setRemainingSeconds(duration);
      setTotalSeconds(duration);
      setState('running');

      intervalRef.current = setInterval(() => {
        const remaining = calcRemaining();
        if (remaining <= 0) {
          finishTimer();
        } else {
          setRemainingSeconds(remaining);
        }
      }, 1000);
    },
    [defaultSeconds, clearTimer, calcRemaining, finishTimer],
  );

  const skip = useCallback(() => {
    clearTimer();
    startedAtRef.current = 0;
    setState('idle');
    setRemainingSeconds(0);
    setTotalSeconds(0);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    startedAtRef.current = 0;
    setState('idle');
    setRemainingSeconds(0);
    setTotalSeconds(0);
  }, [clearTimer]);

  const addTime = useCallback(
    (seconds: number) => {
      if (state !== 'running') return;
      totalMsRef.current += seconds * 1000;
      setRemainingSeconds(calcRemaining());
      setTotalSeconds((prev) => prev + seconds);
    },
    [state, calcRemaining],
  );

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
