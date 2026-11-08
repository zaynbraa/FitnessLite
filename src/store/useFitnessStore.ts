import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArchivedDaySummary,
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
import { getDayInitial, getPastNDays, getShortDayName, getTodayDateString } from '../utils/date';

interface FitnessState {
  targets: DailyTargets;
  currentDate: string; // The active day tracked
  selectedDate: string; // Currently viewed date (YYYY-MM-DD)
  foodLogs: FoodLogItem[];
  customPresets: FoodPreset[];
  waterLogs: Record<string, number>; // date -> ml
  supplements: Record<string, DailySupplements>; // date -> checks
  stepsByDate: Record<string, number>; // date -> steps
  weightLogs: WeightEntry[];
  cardioLogs: CardioLog[];
  history: Record<string, ArchivedDaySummary>; // date -> summary

  // Live metrics for UI
  healthKitSteps: number;
  healthKitActiveEnergy: number;

  // Actions
  setSelectedDate: (date: string) => void;
  checkAndRolloverDay: () => void;

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

  // Steps & Activity (Quick PWA manual entry + HealthKit)
  setSteps: (steps: number, date?: string) => void;
  addSteps: (delta: number, date?: string) => void;
  setHealthKitMetrics: (steps: number, activeEnergy: number) => void;

  // Weight
  addWeightEntry: (weightKg: number, date?: string) => void;

  // Cardio
  logCardioWorkout: (type: CardioType, date?: string) => CardioLog;
  removeCardioLog: (id: string) => void;

  // Backup & Restore
  exportStateAsJSON: () => string;
  importStateFromJSON: (jsonStr: string) => boolean;
  resetAllData: () => void;

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
  getStepsForDate: (date?: string) => number;
  getCurrentWeight: () => number;
  get7DayRollingAverage: (targetDate?: string) => number;
  getWeightDelta: () => number; // delta to 77.0 kg
  getWeeklyConsistency: () => DayConsistency[];
}

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
  persist<FitnessState, [], [], any>(
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
      currentDate: getTodayDateString(),
      selectedDate: getTodayDateString(),
      foodLogs: [],
      customPresets: [],
      waterLogs: {
        [getTodayDateString()]: 0,
      },
      supplements: {
        [getTodayDateString()]: {
          creatine: false,
          vitamins: false,
          electrolytes: false,
        },
      },
      stepsByDate: {
        [getTodayDateString()]: 0,
      },
      weightLogs: initialWeightLogs,
      cardioLogs: [],
      history: {},
      healthKitSteps: 0,
      healthKitActiveEnergy: 0,

      setSelectedDate: (date) => set({ selectedDate: date }),

      checkAndRolloverDay: () => {
        const today = getTodayDateString();
        const state = get();
        const prevDate = state.currentDate || today;

        if (prevDate !== today) {
          const foodLogs = state.foodLogs || [];
          const stepsByDate = state.stepsByDate || {};
          const supplements = state.supplements || {};
          const waterLogs = state.waterLogs || {};
          const weightLogs = state.weightLogs || [];
          const targets = state.targets || { calories: 2200, steps: 10000 };

          const prevFood = foodLogs.filter((f) => f.date === prevDate);
          const prevCals = prevFood.reduce((sum, item) => sum + item.calories, 0);
          const prevSteps = stepsByDate[prevDate] || state.healthKitSteps || 0;
          const prevSupps = supplements[prevDate] || {
            creatine: false,
            vitamins: false,
            electrolytes: false,
          };
          const prevSuppsHit = prevSupps.creatine || prevSupps.vitamins || prevSupps.electrolytes;
          const prevWater = waterLogs[prevDate] || 0;
          const prevWeight = weightLogs.find((w) => w.date === prevDate)?.weightKg;

          const caloriesHit =
            prevCals > 0 && Math.abs(prevCals - targets.calories) <= 250;
          const stepsHit = prevSteps >= targets.steps;

          const summary: ArchivedDaySummary = {
            date: prevDate,
            caloriesLogged: prevCals,
            caloriesTarget: targets.calories,
            caloriesHit,
            stepsLogged: prevSteps,
            stepsTarget: targets.steps,
            stepsHit,
            supplementsHit: prevSuppsHit,
            waterLogged: prevWater,
            weightKg: prevWeight,
          };

          set((s) => ({
            currentDate: today,
            selectedDate: today,
            history: {
              ...(s.history || {}),
              [prevDate]: summary,
            },
            waterLogs: {
              ...(s.waterLogs || {}),
              [today]: (s.waterLogs || {})[today] ?? 0,
            },
            supplements: {
              ...(s.supplements || {}),
              [today]: (s.supplements || {})[today] ?? {
                creatine: false,
                vitamins: false,
                electrolytes: false,
              },
            },
            stepsByDate: {
              ...(s.stepsByDate || {}),
              [today]: (s.stepsByDate || {})[today] ?? 0,
            },
            healthKitSteps: (s.stepsByDate || {})[today] ?? 0,
            healthKitActiveEnergy: 0,
          }));
        } else if (!state.currentDate) {
          set({ currentDate: today, selectedDate: today });
        }
      },

      addFoodLog: (item) => {
        const targetDate = item.date || get().selectedDate || getTodayDateString();
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
          foodLogs: [newLog, ...(state.foodLogs || [])],
        }));
      },

      removeFoodLog: (id) => {
        set((state) => ({
          foodLogs: (state.foodLogs || []).filter((log) => log.id !== id),
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
          customPresets: [newPreset, ...(state.customPresets || [])],
        }));
      },

      addWater: (ml, date) => {
        const targetDate = date || get().selectedDate || getTodayDateString();
        set((state) => {
          const waterLogs = state.waterLogs || {};
          const current = waterLogs[targetDate] || 0;
          return {
            waterLogs: {
              ...waterLogs,
              [targetDate]: Math.max(0, current + ml),
            },
          };
        });
      },

      setWater: (ml, date) => {
        const targetDate = date || get().selectedDate || getTodayDateString();
        set((state) => ({
          waterLogs: {
            ...(state.waterLogs || {}),
            [targetDate]: Math.max(0, ml),
          },
        }));
      },

      toggleSupplement: (key, date) => {
        const targetDate = date || get().selectedDate || getTodayDateString();
        set((state) => {
          const supplements = state.supplements || {};
          const current = supplements[targetDate] || {
            creatine: false,
            vitamins: false,
            electrolytes: false,
          };
          return {
            supplements: {
              ...supplements,
              [targetDate]: {
                ...current,
                [key]: !current[key],
              },
            },
          };
        });
      },

      setSteps: (steps, date) => {
        const targetDate = date || get().selectedDate || getTodayDateString();
        const validSteps = Math.max(0, Math.round(steps));
        const activeKcal = Math.round(validSteps * 0.045);

        set((state) => {
          const stepsByDate = state.stepsByDate || {};
          return {
            stepsByDate: {
              ...stepsByDate,
              [targetDate]: validSteps,
            },
            healthKitSteps: targetDate === state.currentDate ? validSteps : state.healthKitSteps,
            healthKitActiveEnergy:
              targetDate === state.currentDate
                ? Math.max(state.healthKitActiveEnergy || 0, activeKcal)
                : state.healthKitActiveEnergy,
          };
        });
      },

      addSteps: (delta, date) => {
        const targetDate = date || get().selectedDate || getTodayDateString();
        const current = get().getStepsForDate(targetDate);
        get().setSteps(current + delta, targetDate);
      },

      setHealthKitMetrics: (steps, activeEnergy) => {
        const targetDate = get().currentDate || getTodayDateString();
        set((state) => ({
          healthKitSteps: steps,
          healthKitActiveEnergy: activeEnergy,
          stepsByDate: {
            ...(state.stepsByDate || {}),
            [targetDate]: steps,
          },
        }));
      },

      addWeightEntry: (weightKg, date) => {
        const targetDate = date || get().selectedDate || getTodayDateString();
        set((state) => {
          const weightLogs = state.weightLogs || [];
          const filtered = weightLogs.filter((w) => w.date !== targetDate);
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
        const targetDate = date || get().selectedDate || getTodayDateString();
        const config =
          type === 'walk'
            ? { title: '40-Min Walk', durationMinutes: 40, caloriesBurned: 210, stepsAdded: 4200 }
            : { title: 'Basketball (30-60m)', durationMinutes: 45, caloriesBurned: 420, stepsAdded: 3100 };

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

        const currentSteps = get().getStepsForDate(targetDate);
        const nextSteps = currentSteps + config.stepsAdded;

        set((state) => ({
          cardioLogs: [newCardio, ...(state.cardioLogs || [])],
          stepsByDate: {
            ...(state.stepsByDate || {}),
            [targetDate]: nextSteps,
          },
          healthKitSteps: targetDate === state.currentDate ? nextSteps : state.healthKitSteps,
          healthKitActiveEnergy: (state.healthKitActiveEnergy || 0) + config.caloriesBurned,
        }));

        return newCardio;
      },

      removeCardioLog: (id) => {
        set((state) => ({
          cardioLogs: (state.cardioLogs || []).filter((c) => c.id !== id),
        }));
      },

      exportStateAsJSON: () => {
        const state = get();
        const exportData = {
          targets: state.targets,
          currentDate: state.currentDate,
          foodLogs: state.foodLogs || [],
          customPresets: state.customPresets || [],
          waterLogs: state.waterLogs || {},
          supplements: state.supplements || {},
          stepsByDate: state.stepsByDate || {},
          weightLogs: state.weightLogs || [],
          cardioLogs: state.cardioLogs || [],
          history: state.history || {},
          exportedAt: new Date().toISOString(),
        };
        return JSON.stringify(exportData, null, 2);
      },

      importStateFromJSON: (jsonStr: string) => {
        try {
          const parsed = JSON.parse(jsonStr);
          if (!parsed || typeof parsed !== 'object') return false;

          set((state) => ({
            targets: parsed.targets || state.targets,
            currentDate: parsed.currentDate || state.currentDate || getTodayDateString(),
            foodLogs: Array.isArray(parsed.foodLogs) ? parsed.foodLogs : state.foodLogs,
            customPresets: Array.isArray(parsed.customPresets) ? parsed.customPresets : state.customPresets,
            waterLogs: parsed.waterLogs || state.waterLogs || {},
            supplements: parsed.supplements || state.supplements || {},
            stepsByDate: parsed.stepsByDate || state.stepsByDate || {},
            weightLogs: Array.isArray(parsed.weightLogs) ? parsed.weightLogs : state.weightLogs,
            cardioLogs: Array.isArray(parsed.cardioLogs) ? parsed.cardioLogs : state.cardioLogs,
            history: parsed.history || state.history || {},
          }));
          return true;
        } catch {
          return false;
        }
      },

      resetAllData: () => {
        const today = getTodayDateString();
        set({
          foodLogs: [],
          customPresets: [],
          waterLogs: { [today]: 0 },
          supplements: { [today]: { creatine: false, vitamins: false, electrolytes: false } },
          stepsByDate: { [today]: 0 },
          weightLogs: initialWeightLogs,
          cardioLogs: [],
          history: {},
          healthKitSteps: 0,
          healthKitActiveEnergy: 0,
          currentDate: today,
          selectedDate: today,
        });
      },

      // SELECTORS
      getTotalsForDate: (date) => {
        const targetDate = date || get().selectedDate || getTodayDateString();
        const logs = (get().foodLogs || []).filter((l) => l.date === targetDate);
        const targets = get().targets || { calories: 2200 };

        const totals = logs.reduce(
          (acc, item) => {
            acc.calories += item.calories || 0;
            acc.protein += item.protein || 0;
            acc.carbs += item.carbs || 0;
            acc.fat += item.fat || 0;
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        const remainingCalories = Math.max(0, targets.calories - totals.calories);

        return {
          calories: Math.round(totals.calories),
          protein: Math.round(totals.protein),
          carbs: Math.round(totals.carbs),
          fat: Math.round(totals.fat),
          remainingCalories,
        };
      },

      getWaterForDate: (date) => {
        const targetDate = date || get().selectedDate || getTodayDateString();
        return (get().waterLogs || {})[targetDate] || 0;
      },

      getSupplementsForDate: (date) => {
        const targetDate = date || get().selectedDate || getTodayDateString();
        return (
          (get().supplements || {})[targetDate] || {
            creatine: false,
            vitamins: false,
            electrolytes: false,
          }
        );
      },

      getStepsForDate: (date) => {
        const targetDate = date || get().selectedDate || getTodayDateString();
        const stepsByDate = get().stepsByDate || {};
        if (targetDate === get().currentDate && (get().healthKitSteps || 0) > 0) {
          return get().healthKitSteps;
        }
        return stepsByDate[targetDate] || 0;
      },

      getCurrentWeight: () => {
        const logs = get().weightLogs || [];
        if (logs.length === 0) return 80.0;
        return logs[logs.length - 1].weightKg;
      },

      get7DayRollingAverage: () => {
        const logs = get().weightLogs || [];
        if (logs.length === 0) return 80.0;
        const last7 = logs.slice(-7);
        const sum = last7.reduce((acc, curr) => acc + curr.weightKg, 0);
        return Number((sum / last7.length).toFixed(1));
      },

      getWeightDelta: () => {
        const current = get().getCurrentWeight();
        const target = (get().targets || {}).targetWeightKg || 77.0;
        return Number((current - target).toFixed(1));
      },

      getWeeklyConsistency: () => {
        const past7 = getPastNDays(7);
        const targets = get().targets || { calories: 2200, steps: 10000 };
        const foodLogs = get().foodLogs || [];
        const supplements = get().supplements || {};
        const stepsByDate = get().stepsByDate || {};
        const history = get().history || {};
        const currentDate = get().currentDate || getTodayDateString();
        const healthKitSteps = get().healthKitSteps || 0;

        return past7.map((dateStr, index) => {
          const isToday = dateStr === currentDate;
          const archived = history[dateStr];

          if (archived && !isToday) {
            return {
              date: dateStr,
              dayLabel: getDayInitial(dateStr),
              dayName: getShortDayName(dateStr),
              caloriesHit: !!archived.caloriesHit,
              stepsHit: !!archived.stepsHit,
              supplementsHit: !!archived.supplementsHit,
              caloriesLogged: archived.caloriesLogged || 0,
              stepsLogged: archived.stepsLogged || 0,
            };
          }

          // Active or un-archived day calculation
          const dayFood = foodLogs.filter((f) => f.date === dateStr);
          const cals = dayFood.reduce((sum, item) => sum + item.calories, 0);
          const steps = isToday
            ? (healthKitSteps > 0 ? healthKitSteps : (stepsByDate[dateStr] || 0))
            : (stepsByDate[dateStr] ?? 9200 + ((index * 370) % 2400));

          const supps = supplements[dateStr] || { creatine: false, vitamins: false, electrolytes: false };
          const caloriesHit = isToday ? (cals > 0 && Math.abs(cals - targets.calories) <= 250) : cals >= 2000;
          const stepsHit = steps >= targets.steps;
          const supplementsHit = !!(supps.creatine || supps.vitamins || supps.electrolytes);

          return {
            date: dateStr,
            dayLabel: getDayInitial(dateStr),
            dayName: getShortDayName(dateStr),
            caloriesHit,
            stepsHit,
            supplementsHit,
            caloriesLogged: isToday ? cals : (cals || 2150),
            stepsLogged: steps,
          };
        });
      },
    }),
    {
      name: 'fitness-lite-storage',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      // Merge function guarantees existing cached data never overwrites new fields with undefined!
      merge: (persistedState: any, currentState: any) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return currentState;
        }
        return {
          ...currentState,
          ...persistedState,
          targets: persistedState.targets || currentState.targets,
          currentDate: persistedState.currentDate || currentState.currentDate || getTodayDateString(),
          selectedDate: persistedState.selectedDate || currentState.selectedDate || getTodayDateString(),
          foodLogs: Array.isArray(persistedState.foodLogs) ? persistedState.foodLogs : currentState.foodLogs,
          customPresets: Array.isArray(persistedState.customPresets) ? persistedState.customPresets : currentState.customPresets,
          waterLogs: persistedState.waterLogs || currentState.waterLogs || {},
          supplements: persistedState.supplements || currentState.supplements || {},
          stepsByDate: persistedState.stepsByDate || currentState.stepsByDate || {},
          weightLogs: Array.isArray(persistedState.weightLogs) ? persistedState.weightLogs : currentState.weightLogs,
          cardioLogs: Array.isArray(persistedState.cardioLogs) ? persistedState.cardioLogs : currentState.cardioLogs,
          history: persistedState.history || currentState.history || {},
        };
      },
      partialize: (state) => ({
        targets: state.targets,
        currentDate: state.currentDate,
        selectedDate: state.selectedDate,
        foodLogs: state.foodLogs,
        customPresets: state.customPresets,
        waterLogs: state.waterLogs,
        supplements: state.supplements,
        stepsByDate: state.stepsByDate,
        weightLogs: state.weightLogs,
        cardioLogs: state.cardioLogs,
        history: state.history,
      }),
    }
  )
);
