import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lock, Delete, ShieldCheck } from 'lucide-react-native';
import { triggerLightHaptic, triggerMediumHaptic, triggerSuccessHaptic } from '../utils/haptics';

const STORAGE_KEY = 'fitnesslite_unlocked';
const CORRECT_PIN = process.env.EXPO_PUBLIC_APP_PIN || '2026';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const checkUnlockStatus = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'true') {
          setIsUnlocked(true);
        }
      } catch (e) {
        console.error('Error reading auth state:', e);
      } finally {
        setIsChecking(false);
      }
    };

    checkUnlockStatus();
  }, []);

  const handleKeyPress = useCallback(
    async (digit: string) => {
      if (pin.length >= 4) return;
      triggerLightHaptic();
      setHasError(false);

      const nextPin = pin + digit;
      setPin(nextPin);

      if (nextPin.length === 4) {
        if (nextPin === CORRECT_PIN) {
          triggerSuccessHaptic();
          try {
            await AsyncStorage.setItem(STORAGE_KEY, 'true');
          } catch (e) {
            console.error('Error persisting auth state:', e);
          }
          setIsUnlocked(true);
        } else {
          triggerMediumHaptic();
          setHasError(true);
          setTimeout(() => {
            setPin('');
            setHasError(false);
          }, 600);
        }
      }
    },
    [pin]
  );

  const handleDelete = useCallback(() => {
    if (pin.length > 0) {
      triggerLightHaptic();
      setPin((prev) => prev.slice(0, -1));
      setHasError(false);
    }
  }, [pin]);

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  const digits = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete'],
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Lock Icon */}
        <View style={styles.iconCircle}>
          <Lock size={28} color="#007AFF" strokeWidth={2} />
        </View>

        {/* Title */}
        <Text style={styles.title}>FitnessLite</Text>
        <Text style={styles.subtitle}>
          {hasError ? 'Incorrect Passcode' : 'Enter 4-Digit Passcode'}
        </Text>

        {/* 4 Pin Circles */}
        <View style={styles.pinCirclesContainer}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <View
                key={index}
                style={[
                  styles.pinCircle,
                  isFilled && styles.pinCircleFilled,
                  hasError && styles.pinCircleError,
                ]}
              />
            );
          })}
        </View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {digits.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((item, colIndex) => {
                if (item === '') {
                  return <View key={colIndex} style={styles.keyButtonPlaceholder} />;
                }
                if (item === 'delete') {
                  return (
                    <TouchableOpacity
                      key={colIndex}
                      onPress={handleDelete}
                      style={styles.keyButtonSpecial}
                      activeOpacity={0.6}
                    >
                      <Delete size={22} color="#000000" strokeWidth={1.75} />
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={colIndex}
                    onPress={() => handleKeyPress(item)}
                    style={styles.keyButton}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.keyNumber}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Private Local Device Note */}
        <View style={styles.footerNote}>
          <ShieldCheck size={13} color="#8E8E93" strokeWidth={2} style={{ marginRight: 5 }} />
          <Text style={styles.footerText}>Private Offline Vault • Unlocked on this device</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    marginBottom: 24,
  },
  pinCirclesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  pinCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
    marginHorizontal: 12,
  },
  pinCircleFilled: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  pinCircleError: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  keypad: {
    width: 270,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  keyButtonSpecial: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyButtonPlaceholder: {
    width: 72,
    height: 72,
  },
  keyNumber: {
    fontSize: 28,
    fontWeight: '500',
    color: '#000000',
    fontVariant: ['tabular-nums'],
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 11,
    color: '#8E8E93',
  },
});
