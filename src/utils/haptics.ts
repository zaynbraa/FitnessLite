import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const triggerSelectionHaptic = () => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      Haptics.selectionAsync();
    } catch {
      // safe fallback
    }
  }
};

export const triggerLightHaptic = () => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // safe fallback
    }
  }
};

export const triggerMediumHaptic = () => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // safe fallback
    }
  }
};

export const triggerSuccessHaptic = () => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // safe fallback
    }
  }
};
