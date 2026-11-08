import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useFitnessStore } from '../store/useFitnessStore';

export function useDayRollover() {
  const checkAndRolloverDay = useFitnessStore((state) => state.checkAndRolloverDay);

  useEffect(() => {
    // 1. Initial check on mount/load
    try {
      checkAndRolloverDay();
    } catch (e) {
      console.error('Error in initial day rollover:', e);
    }

    // 2. 60-second polling interval
    const intervalId = setInterval(() => {
      try {
        checkAndRolloverDay();
      } catch (e) {
        console.error('Error in interval day rollover:', e);
      }
    }, 60 * 1000);

    // 3. React Native AppState listener (active / foreground)
    let subscription: any = null;
    try {
      subscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          checkAndRolloverDay();
        }
      });
    } catch {
      // safe fallback on platforms without AppState
    }

    // 4. Web / PWA document visibilitychange & window focus listeners
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          try {
            checkAndRolloverDay();
          } catch (e) {
            console.error('Error in visibility rollover:', e);
          }
        }
      };
      const handleWindowFocus = () => {
        try {
          checkAndRolloverDay();
        } catch (e) {
          console.error('Error in focus rollover:', e);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleWindowFocus);

      return () => {
        clearInterval(intervalId);
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove();
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleWindowFocus);
      };
    }

    return () => {
      clearInterval(intervalId);
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, [checkAndRolloverDay]);
}
