export type FoodCategory = 'protein' | 'carbs' | 'dairy-fats' | 'produce-drinks' | 'custom';

export interface FoodPreset {
  id: string;
  name: string;
  category: FoodCategory;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  defaultGrams: number;
  unitLabel?: string;
  unitGrams?: number;
  quickChips?: number[]; // custom gram increments
}

export interface FoodLogItem {
  id: string;
  presetId?: string;
  name: string;
  category: FoodCategory;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: number;
  date: string; // YYYY-MM-DD
  unitCount?: number;
  unitLabel?: string;
}

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  timestamp: number;
}

export interface DailySupplements {
  creatine: boolean;
  vitamins: boolean;
  electrolytes: boolean;
}

export type CardioType = 'walk' | 'basketball' | 'gym';

export interface CardioLog {
  id: string;
  date: string; // YYYY-MM-DD
  type: CardioType;
  title: string;
  durationMinutes: number;
  caloriesBurned: number;
  intensity?: string;
  met?: number;
  timestamp: number;
  syncedToHealthKit: boolean;
}

export interface DailyTargets {
  calories: number; // 2,200 kcal
  protein: number;  // 175g
  carbs: number;    // 225g
  fat: number;      // 67g
  steps: number;    // 10,000 steps
  targetWeightKg: number; // 77 kg
  waterMl: number;  // 2500 ml
}

export interface ArchivedDaySummary {
  date: string; // YYYY-MM-DD
  caloriesLogged: number;
  caloriesTarget: number;
  caloriesHit: boolean;
  stepsLogged: number;
  stepsTarget: number;
  stepsHit: boolean;
  supplementsHit: boolean;
  waterLogged: number;
  weightKg?: number;
  activeCaloriesBurned?: number;
}

export interface DayConsistency {
  date: string; // YYYY-MM-DD
  dayLabel: string; // "M", "T", "W", "T", "F", "S", "S"
  dayName: string; // "Sun"
  caloriesHit: boolean;
  stepsHit: boolean;
  supplementsHit: boolean;
  caloriesLogged: number;
  stepsLogged: number;
}
