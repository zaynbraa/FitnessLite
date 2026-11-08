import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CardioLog,
  CardioType,
  DailySupplements,
  DailyTargets,
  DayConsistency,
  FoodCategory,
  FoodLogItem,
  FoodPreset,
  WeightEntry,
} from '../types';
import { FOOD_PRESETS } from '../data/foodPresets';
import { getDayInitial, getPastNDays, getShortDayName, getTodayDateString } from '../utils/date';

interface FitnessState {
  targets: DailyTargets;
  foodLogs: FoodLogItem[];
  customPresets: FoodPreset[];
  waterLogs: Record<string, number>; // date -> ml
  supplements: Record<string, DailySupplements>; // date -> checks
  weightLogs: WeightEntry[];
  cardioLogs: CardioLog[];
  selectedDate: string; // YYYY-MM-DD

  // HealthKit synced values
  healthKitSteps: number;
  healthKitActiveEnergy: number;

  // Actions
  setSelectedDate: (date: string) => void;
  addFoodLog: (item: {
    presetId?: string;
    name: string;
    category: FoodCategory;
    grams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    unitCount?: number;
    unitLabel?: string;
    date?: string;
  }) => void;
  removeFoodLog: (id: string) => void;
  addCustomPreset: (preset: {
    name: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    defaultGrams: number;
  }) => void;
  
  // Water
  addWater: (ml: number, date?: string) => void;
  setWater: (ml: number, date?: string) => void;

  // Supplements
  toggleSupplement: (key: keyof DailySupplements, date?: string) => void;

  // Weight
  addWeightEntry: (weightKg: number, date?: string) => void;

  // Cardio
  logCardioWorkout: (type: CardioType, date?: string) => CardioLog;
  removeCardioLog: (id: string) => void;

  // HealthKit
  setHealthKitMetrics: (steps: number, activeEnergy: number) => void;

  // Selectors / Helpers
  getTotalsForDate: (date?: string) => {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    remainingCalories: number;
  };
  getWaterForDate: (date?: string) => number;
  getSupplementsForDate: (date?: string) => DailySupplements;
  getCurrentWeight: () => number;
  get7DayRollingAverage: (targetDate?: string) => number;
  getWeightDelta: () => number; // delta to 77.0 kg
  getWeeklyConsistency: () => DayConsistency[];
}

// Initial realistic weight history leading from 85 kg down to ~79.5 kg
const initialWeightLogs: WeightEntry[] = [
  { id: 'w-1', date: '2026-10-18', weightKg: 85.0, timestamp: 1729209600000 },
  { id: 'w-2', date: '2026-10-22', weightKg: 84.4, timestamp: 1729555200000 },
  { id: 'w-3', date: '2026-10-26', weightKg: 83.8, timestamp: 1729900800000 },
  { id: 'w-4', date: '2026-10-30', weightKg: 83.0, timestamp: 1730246400000 },
  { id: 'w-5', date: '2026-11-02', weightKg: 82.2, timestamp: 1730505600000 },
  { id: 'w-6', date: '2026-11-04', weightKg: 81.6, timestamp: 1730678400000 },
  { id: 'w-7', date: '2026-11-05', weightKg: 81.2, timestamp: 1730764800000 },
  { id: 'w-8', date: '2026-11-06', weightKg: 80.7, timestamp: 1730851200000 },
  { id: 'w-9', date: '2026-11-07', weightKg: 80.1, timestamp: 1730937600000 },
  { id: 'w-10', date: '2026-11-08', weightKg: 79.5, timestamp: 1731024000000 },
];

export const useFitnessStore = create<FitnessState>()(
  persist(
    (set, get) => ({
      targets: {
        calories: 2200,
        protein: 175,
        carbs: 225,
        fat: 67,
        steps: 10000,
        targetWeightKg: 77.0,
        waterMl: 2500,
      },
      foodLogs: [],
      customPresets: [],
      waterLogs: {
        [getTodayDateString()]: 750, // realistic default morning hydration
      },
      supplements: {
        [getTodayDateString()]: {
          creatine: true,
          vitamins: false,
          electrolytes: false,
        },
      },
      weightLogs: initialWeightLogs,
      cardioLogs: [],
      selectedDate: getTodayDateString(),
      healthKitSteps: 7420, // realistic mock baseline steps
      healthKitActiveEnergy: 480,

      setSelectedDate: (date) => set({ selectedDate: date }),

      addFoodLog: (item) => {
        const targetDate = item.date || get().selectedDate;
        const newLog: FoodLogItem = {
          id: `food-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          presetId: item.presetId,
          name: item.name,
          category: item.category,
          grams: item.grams,
          calories: Math.round(item.calories),
          protein: Number(item.protein.toFixed(1)),
          carbs: Number(item.carbs.toFixed(1)),
          fat: Number(item.fat.toFixed(1)),
          timestamp: Date.now(),
          date: targetDate,
          unitCount: item.unitCount,
          unitLabel: item.unitLabel,
        };

        set((state) => ({
          foodLogs: [newLog, ...state.foodLogs],
        }));
      },

      removeFoodLog: (id) => {
        set((state) => ({
          foodLogs: state.foodLogs.filter((log) => log.id !== id),
        }));
      },

      addCustomPreset: (preset) => {
        const newPreset: FoodPreset = {
          id: `custom-${Date.now()}`,
          name: preset.name,
          category: 'custom',
          caloriesPer100g: preset.caloriesPer100g,
          proteinPer100g: preset.proteinPer100g,
          carbsPer100g: preset.carbsPer100g,
          fatPer100g: preset.fatPer100g,
          defaultGrams: preset.defaultGrams,
          quickChips: [50, 100, 150, 200],
        };

        set((state) => ({
          customPresets: [newPreset, ...state.customPresets],
        }));
      },

      addWater: (ml, date) => {
        const targetDate = date || get().selectedDate;
        set((state) => {
          const current = state.waterLogs[targetDate] || 0;
          return {
            waterLogs: {
              ...state.waterLogs,
              [targetDate]: Math.max(0, current + ml),
            },
          };
        });
      },

      setWater: (ml, date) => {
        const targetDate = date || get().selectedDate;
        set((state) => ({
          waterLogs: {
            ...state.waterLogs,
            [targetDate]: Math.max(0, ml),
          },
        }));
      },

      toggleSupplement: (key, date) => {
        const targetDate = date || get().selectedDate;
        set((state) => {
          const current = state.supplements[targetDate] || {
            creatine: false,
            vitamins: false,
            electrolytes: false,
          };
          return {
            supplements: {
              ...state.supplements,
              [targetDate]: {
                ...current,
                [key]: !current[key],
              },
            },
          };
        });
      },

      addWeightEntry: (weightKg, date) => {
        const targetDate = date || get().selectedDate;
        set((state) => {
          const filtered = state.weightLogs.filter((w) => w.date !== targetDate);
          const newEntry: WeightEntry = {
            id: `w-${Date.now()}`,
            date: targetDate,
            weightKg: Number(weightKg.toFixed(1)),
            timestamp: Date.now(),
          };
          const updated = [...filtered, newEntry].sort((a, b) => a.date.localeCompare(b.date));
          return { weightLogs: updated };
        });
      },

      logCardioWorkout: (type, date) => {
        const targetDate = date || get().selectedDate;
        const config =
          type === 'walk'
            ? { title: '40-Min Walk', durationMinutes: 40, caloriesBurned: 210 }
            : { title: 'Basketball (30-60m)', durationMinutes: 45, caloriesBurned: 420 };

        const newCardio: CardioLog = {
          id: `cardio-${Date.now()}`,
          date: targetDate,
          type,
          title: config.title,
          durationMinutes: config.durationMinutes,
          caloriesBurned: config.caloriesBurned,
          timestamp: Date.now(),
          syncedToHealthKit: false,
        };

        set((state) => ({
          cardioLogs: [newCardio, ...state.cardioLogs],
          // Increase steps slightly for walk
          healthKitSteps:
            type === 'walk' ? state.healthKitSteps + 4200 : state.healthKitSteps + 3100,
          healthKitActiveEnergy: state.healthKitActiveEnergy + config.caloriesBurned,
        }));

        return newCardio;
      },

      removeCardioLog: (id) => {
        set((state) => ({
          cardioLogs: state.cardioLogs.filter((c) => c.id !== id),
        }));
      },

      setHealthKitMetrics: (steps, activeEnergy) => {
        set({
          healthKitSteps: steps,
          healthKitActiveEnergy: activeEnergy,
        });
      },

      // SELECTORS
      getTotalsForDate: (date) => {
        const targetDate = date || get().selectedDate;
        const logs = get().foodLogs.filter((l) => l.date === targetDate);

        const totals = logs.reduce(
          (acc, item) => {
            acc.calories += item.calories;
            acc.protein += item.protein;
            acc.carbs += item.carbs;
            acc.fat += item.fat;
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        const remainingCalories = Math.max(0, get().targets.calories - totals.calories);

        return {
          calories: Math.round(totals.calories),
          protein: Math.round(totals.protein),
          carbs: Math.round(totals.carbs),
          fat: Math.round(totals.fat),
          remainingCalories,
        };
      },

      getWaterForDate: (date) => {
        const targetDate = date || get().selectedDate;
        return get().waterLogs[targetDate] || 0;
      },

      getSupplementsForDate: (date) => {
        const targetDate = date || get().selectedDate;
        return (
          get().supplements[targetDate] || {
            creatine: false,
            vitamins: false,
            electrolytes: false,
          }
        );
      },

      getCurrentWeight: () => {
        const logs = get().weightLogs;
        if (logs.length === 0) return 80.0;
        return logs[logs.length - 1].weightKg;
      },

      get7DayRollingAverage: (targetDate) => {
        const logs = get().weightLogs;
        if (logs.length === 0) return 80.0;
        
        // Take the latest 7 entries
        const last7 = logs.slice(-7);
        const sum = last7.reduce((acc, curr) => acc + curr.weightKg, 0);
        return Number((sum / last7.length).toFixed(1));
      },

      getWeightDelta: () => {
        const current = get().getCurrentWeight();
        const target = get().targets.targetWeightKg;
        return Number((current - target).toFixed(1));
      },

      getWeeklyConsistency: () => {
        const past7 = getPastNDays(7);
        const { targets, foodLogs, supplements, healthKitSteps } = get();

        return past7.map((dateStr, index) => {
          const isToday = dateStr === getTodayDateString();
          const dayFood = foodLogs.filter((f) => f.date === dateStr);
          const cals = dayFood.reduce((sum, item) => sum + item.calories, 0);
          const supps = supplements[dateStr] || { creatine: false, vitamins: false, electrolytes: false };
          const allSuppsHit = supps.creatine && supps.vitamins && supps.electrolytes;

          // For past days, generate consistent realistic data if no logs exist yet
          const simulatedSteps = isToday ? healthKitSteps : 9200 + ((index * 370) % 2400);
          const simulatedCals = isToday ? cals : 2100 + ((index * 80) % 250);
          const caloriesHit = isToday ? cals > 0 && Math.abs(cals - targets.calories) <= 250 : simulatedCals >= 2000;
          const stepsHit = simulatedSteps >= targets.steps;
          const supplementsHit = isToday ? (supps.creatine || supps.vitamins || supps.electrolytes) : index % 7 !== 2;

          return {
            date: dateStr,
            dayLabel: getDayInitial(dateStr),
            dayName: getShortDayName(dateStr),
            caloriesHit,
            stepsHit,
            supplementsHit,
            caloriesLogged: isToday ? cals : simulatedCals,
            stepsLogged: simulatedSteps,
          };
        });
      },
    }),
    {
      name: 'fitness-lite-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        targets: state.targets,
        foodLogs: state.foodLogs,
        customPresets: state.customPresets,
        waterLogs: state.waterLogs,
        supplements: state.supplements,
        weightLogs: state.weightLogs,
        cardioLogs: state.cardioLogs,
      }),
    }
  )
);
