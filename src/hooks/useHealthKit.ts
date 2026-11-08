import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useFitnessStore } from '../store/useFitnessStore';
import { CardioType } from '../types';

export interface HealthKitState {
  isAvailable: boolean;
  isAuthorized: boolean;
  isMockMode: boolean;
  steps: number;
  activeEnergy: number;
  loading: boolean;
  refreshHealthData: () => Promise<void>;
  logDedicatedWorkout: (type: CardioType) => Promise<boolean>;
  syncWeightToHealthKit: (weightKg: number) => Promise<boolean>;
}

// Dynamic safe-loader for @kingstinct/react-native-healthkit (native iOS only, never on Web/PWA)
let HealthKitModule: any = null;
let isNativeModuleReady = false;

if (Platform.OS === 'ios' && typeof window === 'undefined') {
  try {
    HealthKitModule = require('@kingstinct/react-native-healthkit');
    if (HealthKitModule && typeof HealthKitModule.isHealthDataAvailable === 'function') {
      isNativeModuleReady = HealthKitModule.isHealthDataAvailable();
    }
  } catch (error) {
    console.log('[HealthKit Safe-Mode] Native module not linked in current runtime. Using safe fallback:', error);
    isNativeModuleReady = false;
  }
}

export function useHealthKit(): HealthKitState {
  const [isAvailable, setIsAvailable] = useState<boolean>(isNativeModuleReady);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const steps = useFitnessStore((state) => state.healthKitSteps);
  const activeEnergy = useFitnessStore((state) => state.healthKitActiveEnergy);
  const setHealthKitMetrics = useFitnessStore((state) => state.setHealthKitMetrics);
  const logCardioWorkout = useFitnessStore((state) => state.logCardioWorkout);

  const isMockMode = !isAvailable || !isAuthorized || Platform.OS !== 'ios';

  // Request permissions on native iOS
  const initHealthKit = useCallback(async () => {
    if (Platform.OS !== 'ios' || !HealthKitModule) {
      setIsAvailable(false);
      setIsAuthorized(false);
      return;
    }

    try {
      setLoading(true);
      const available = HealthKitModule.isHealthDataAvailable();
      setIsAvailable(available);

      if (!available) {
        setLoading(false);
        return;
      }

      // Permissions: Step count, Active energy burned, Workouts, Body mass
      const permissions = {
        read: [
          'HKQuantityTypeIdentifierStepCount',
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          'HKQuantityTypeIdentifierBodyMass',
        ],
        write: [
          'HKQuantityTypeIdentifierBodyMass',
        ],
      };

      const authorized = await HealthKitModule.requestAuthorization(permissions.read, permissions.write);
      setIsAuthorized(authorized);

      if (authorized) {
        await fetchTodayData();
      }
    } catch (err) {
      console.log('[HealthKit] Authorization error, falling back to mock mode:', err);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch real steps and active energy from HealthKit
  const fetchTodayData = useCallback(async () => {
    if (!HealthKitModule || Platform.OS !== 'ios') return;

    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

      // Query steps
      let querySteps = steps;
      let queryEnergy = activeEnergy;

      if (typeof HealthKitModule.queryStatisticsForQuantity === 'function') {
        const stepStats = await HealthKitModule.queryStatisticsForQuantity(
          'HKQuantityTypeIdentifierStepCount',
          ['sum'],
          startOfDay,
          now
        );
        if (stepStats?.sumQuantity?.quantity) {
          querySteps = Math.round(stepStats.sumQuantity.quantity);
        }

        const energyStats = await HealthKitModule.queryStatisticsForQuantity(
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          ['sum'],
          startOfDay,
          now
        );
        if (energyStats?.sumQuantity?.quantity) {
          queryEnergy = Math.round(energyStats.sumQuantity.quantity);
        }

        setHealthKitMetrics(querySteps, queryEnergy);
      }
    } catch (err) {
      console.log('[HealthKit] Error reading statistics:', err);
    }
  }, [steps, activeEnergy, setHealthKitMetrics]);

  // Dedicated cardio workout logger
  const logDedicatedWorkout = useCallback(
    async (type: CardioType): Promise<boolean> => {
      // Always log in local store first for instant UI response
      const cardio = logCardioWorkout(type);

      // If real HealthKit is available on iPhone 12, write native workout sample
      if (HealthKitModule && isAuthorized && Platform.OS === 'ios') {
        try {
          const endDate = new Date();
          const startDate = new Date(endDate.getTime() - cardio.durationMinutes * 60 * 1000);
          
          // Activity types: walking (52), basketball (6)
          const activityType = type === 'walk' ? 52 : 6;

          if (typeof HealthKitModule.saveWorkoutSample === 'function') {
            await HealthKitModule.saveWorkoutSample(
              activityType,
              [],
              startDate,
              endDate,
              {
                totalEnergyBurned: {
                  unit: 'kcal',
                  quantity: cardio.caloriesBurned,
                },
              },
              {
                HKMetadataKeyWorkoutBrandName: 'FitnessLite',
              }
            );
          }
          return true;
        } catch (err) {
          console.log('[HealthKit] Error saving workout sample:', err);
          return false;
        }
      }

      return true; // Mock mode success
    },
    [isAuthorized, logCardioWorkout]
  );

  // Sync morning weight to Apple Health
  const syncWeightToHealthKit = useCallback(
    async (weightKg: number): Promise<boolean> => {
      if (HealthKitModule && isAuthorized && Platform.OS === 'ios') {
        try {
          if (typeof HealthKitModule.saveQuantitySample === 'function') {
            await HealthKitModule.saveQuantitySample(
              'HKQuantityTypeIdentifierBodyMass',
              'kg',
              weightKg,
              new Date()
            );
            return true;
          }
        } catch (err) {
          console.log('[HealthKit] Error saving body weight sample:', err);
          return false;
        }
      }
      return true; // Safe mode success
    },
    [isAuthorized]
  );

  useEffect(() => {
    initHealthKit();
  }, [initHealthKit]);

  return {
    isAvailable,
    isAuthorized,
    isMockMode,
    steps,
    activeEnergy,
    loading,
    refreshHealthData: fetchTodayData,
    logDedicatedWorkout,
    syncWeightToHealthKit,
  };
}
