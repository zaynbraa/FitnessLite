import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useFitnessStore } from '../store/useFitnessStore';

export function useDayRollover() {
  const checkAndRolloverDay = useFitnessStore((state) => state.checkAndRolloverDay);

  useEffect(() => {
    // 1. Initial check on mount/load
    checkAndRolloverDay();

    // 2. 60-second polling interval
    const intervalId = setInterval(() => {
      checkAndRolloverDay();
    }, 60 * 1000);

    // 3. React Native AppState listener (active / foreground)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkAndRolloverDay();
      }
    });

    // 4. Web / PWA document visibilitychange & window focus listeners
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          checkAndRolloverDay();
        }
      };
      const handleWindowFocus = () => {
        checkAndRolloverDay();
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleWindowFocus);

      return () => {
        clearInterval(intervalId);
        subscription.remove();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleWindowFocus);
      };
    }

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [checkAndRolloverDay]);
}
