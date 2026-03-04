import { renderHook, act } from '@testing-library/react';
import { AppState } from 'react-native';
import { useRestTimer } from './useRestTimer';

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn().mockResolvedValue(undefined),
          unloadAsync: jest.fn().mockResolvedValue(undefined),
        },
      }),
    },
  },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: {
    Success: 'success',
  },
}));

// Mock AppState
let appStateCallback: ((state: string) => void) | null = null;
const mockRemove = jest.fn();
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn((_, callback) => {
      appStateCallback = callback;
      return { remove: mockRemove };
    }),
  },
}));

describe('useRestTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    appStateCallback = null;
    mockRemove.mockClear();
    (AppState.addEventListener as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useRestTimer());

    expect(result.current.state).toBe('idle');
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.totalSeconds).toBe(0);
  });

  it('should start countdown with given seconds', () => {
    const { result } = renderHook(() => useRestTimer());

    act(() => {
      result.current.start(60);
    });

    expect(result.current.state).toBe('running');
    expect(result.current.remainingSeconds).toBe(60);
    expect(result.current.totalSeconds).toBe(60);
  });

  it('should decrement every second', () => {
    const { result } = renderHook(() => useRestTimer());

    act(() => {
      result.current.start(60);
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.remainingSeconds).toBe(59);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.remainingSeconds).toBe(56);
  });

  it('should transition to finished state when countdown reaches 0', () => {
    const { result } = renderHook(() => useRestTimer());

    act(() => {
      result.current.start(3);
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.state).toBe('finished');
    expect(result.current.remainingSeconds).toBe(0);
  });

  it('should reset to idle when skip is called', () => {
    const { result } = renderHook(() => useRestTimer());

    act(() => {
      result.current.start(60);
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.state).toBe('running');
    expect(result.current.remainingSeconds).toBe(55);

    act(() => {
      result.current.skip();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.remainingSeconds).toBe(0);
  });

  it('should use default 90s when no duration provided', () => {
    const { result } = renderHook(() => useRestTimer(90));

    act(() => {
      result.current.start();
    });

    expect(result.current.state).toBe('running');
    expect(result.current.remainingSeconds).toBe(90);
    expect(result.current.totalSeconds).toBe(90);
  });

  it('should use exercise restSeconds when provided as default', () => {
    const { result } = renderHook(() => useRestTimer(120));

    act(() => {
      result.current.start();
    });

    expect(result.current.remainingSeconds).toBe(120);
    expect(result.current.totalSeconds).toBe(120);
  });

  it('should support custom duration override', () => {
    const { result } = renderHook(() => useRestTimer(90));

    act(() => {
      result.current.start(45);
    });

    expect(result.current.remainingSeconds).toBe(45);
    expect(result.current.totalSeconds).toBe(45);
  });

  it('should reset timer when reset is called', () => {
    const { result } = renderHook(() => useRestTimer());

    act(() => {
      result.current.start(60);
    });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.totalSeconds).toBe(0);
  });

  it('should not go below 0', () => {
    const { result } = renderHook(() => useRestTimer());

    act(() => {
      result.current.start(2);
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.state).toBe('finished');
  });

  it('should allow restarting after finished', () => {
    const { result } = renderHook(() => useRestTimer());

    act(() => {
      result.current.start(2);
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.state).toBe('finished');

    act(() => {
      result.current.start(30);
    });

    expect(result.current.state).toBe('running');
    expect(result.current.remainingSeconds).toBe(30);
  });

  it('should allow adding time while running', () => {
    const { result } = renderHook(() => useRestTimer());

    act(() => {
      result.current.start(60);
    });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(result.current.remainingSeconds).toBe(50);

    act(() => {
      result.current.addTime(15);
    });

    expect(result.current.remainingSeconds).toBe(65);
    expect(result.current.totalSeconds).toBe(75);
  });

  it('should register AppState listener on mount', () => {
    renderHook(() => useRestTimer());
    expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should remove AppState listener on unmount', () => {
    const { unmount } = renderHook(() => useRestTimer());
    unmount();
    expect(mockRemove).toHaveBeenCalled();
  });

  it('should recalculate remaining time when app returns to foreground', () => {
    const { result } = renderHook(() => useRestTimer());

    act(() => {
      result.current.start(60);
    });

    // Simulate 20s passing (app goes to background, timers paused but Date.now advances)
    act(() => {
      jest.advanceTimersByTime(20000);
    });

    expect(result.current.remainingSeconds).toBe(40);

    // Simulate AppState returning to active
    act(() => {
      appStateCallback?.('active');
    });

    expect(result.current.state).toBe('running');
    expect(result.current.remainingSeconds).toBe(40);
  });

  it('should finish timer when app returns to foreground after time expired', () => {
    const { result } = renderHook(() => useRestTimer());

    act(() => {
      result.current.start(10);
    });

    // Simulate more time passing than the timer duration
    act(() => {
      jest.advanceTimersByTime(15000);
    });

    // Timer should have already finished via interval
    expect(result.current.state).toBe('finished');
    expect(result.current.remainingSeconds).toBe(0);
  });

  it('should not recalculate when app returns to foreground if timer is idle', () => {
    const { result } = renderHook(() => useRestTimer());

    act(() => {
      appStateCallback?.('active');
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.remainingSeconds).toBe(0);
  });
});
