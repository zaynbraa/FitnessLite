import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Card } from '../common/Card';
import { useFitnessStore } from '../../store/useFitnessStore';
import {
  Footprints,
  Flame,
  Dumbbell,
  Trophy,
  Check,
  RefreshCw,
  Plus,
  Minus,
  X,
  Edit3,
  Trash2,
  Zap,
  Copy,
  Info,
  ChevronRight,
} from 'lucide-react-native';
import {
  triggerLightHaptic,
  triggerSelectionHaptic,
  triggerSuccessHaptic,
} from '../../utils/haptics';
import { CardioLog, CardioType } from '../../types';

interface ActivityCardProps {
  onLogWorkout?: (type: CardioType) => Promise<boolean>;
  onRefresh?: () => Promise<void>;
  isMockMode?: boolean;
}

interface ActivityIntensityOption {
  id: string;
  label: string;
  met: number;
  description: string;
}

interface ActivityTypeConfig {
  type: CardioType;
  label: string;
  badgeEmoji: string;
  accentColor: string;
  intensities: ActivityIntensityOption[];
  defaultDuration: number;
}

const ACTIVITY_CONFIGS: Record<CardioType, ActivityTypeConfig> = {
  basketball: {
    type: 'basketball',
    label: 'Basketball',
    badgeEmoji: '🏀',
    accentColor: '#FF9500',
    defaultDuration: 45,
    intensities: [
      { id: 'casual', label: 'Shootaround / Casual', met: 4.5, description: 'Free throws, light half-court' },
      { id: 'half-court', label: 'Half-Court / Drills', met: 6.5, description: 'Moderate pace drills or 3v3' },
      { id: 'full-court', label: 'Full-Court / Competitive', met: 8.0, description: 'High-intensity 5v5 game' },
    ],
  },
  gym: {
    type: 'gym',
    label: 'Gym (Strength)',
    badgeEmoji: '🏋️',
    accentColor: '#007AFF',
    defaultDuration: 45,
    intensities: [
      { id: 'standard', label: 'Standard / Hypertrophy', met: 4.5, description: 'Machines, dumbbells, normal rest' },
      { id: 'heavy', label: 'Heavy Compound / Short Rest', met: 6.0, description: 'Squats, deadlifts, high density' },
    ],
  },
  walk: {
    type: 'walk',
    label: 'Walking / Cardio',
    badgeEmoji: '🚶',
    accentColor: '#34C759',
    defaultDuration: 30,
    intensities: [
      { id: 'normal', label: 'Normal Pace', met: 3.5, description: 'Casual stroll (~4.0 km/h)' },
      { id: 'brisk', label: 'Brisk Pace', met: 4.3, description: 'Purposeful pace (~5.5 km/h)' },
      { id: 'incline', label: 'Incline / Fast Walk', met: 6.0, description: 'Steep hill or treadmill incline' },
    ],
  },
};

export const ActivityCard: React.FC<ActivityCardProps> = ({
  onRefresh,
  isMockMode = true,
}) => {
  const selectedDate = useFitnessStore((state) => state.selectedDate);
  const currentDate = useFitnessStore((state) => state.currentDate);
  const stepsByDate = useFitnessStore((state) => state.stepsByDate);
  const healthKitSteps = useFitnessStore((state) => state.healthKitSteps);
  const stepTarget = useFitnessStore((state) => state.targets.steps);
  const cardioLogs = useFitnessStore((state) => state.cardioLogs);
  const weightLogs = useFitnessStore((state) => state.weightLogs);
  const setSteps = useFitnessStore((state) => state.setSteps);
  const logCardioWorkout = useFitnessStore((state) => state.logCardioWorkout);
  const updateCardioLog = useFitnessStore((state) => state.updateCardioLog);
  const removeCardioLog = useFitnessStore((state) => state.removeCardioLog);

  // Bodyweight basis (defaults to 85.0 kg if none logged yet)
  const currentWeight = useMemo(() => {
    if (!weightLogs || weightLogs.length === 0) return 85.0;
    return weightLogs[weightLogs.length - 1].weightKg;
  }, [weightLogs]);

  // Stable steps calculation
  const steps = useMemo(() => {
    if (selectedDate === currentDate && healthKitSteps > 0) {
      return healthKitSteps;
    }
    return (stepsByDate || {})[selectedDate] || 0;
  }, [selectedDate, currentDate, healthKitSteps, stepsByDate]);

  // Steps calorie formula: Math.round(steps * (currentWeight * 0.00053))
  const stepCaloriesBurned = useMemo(() => {
    return Math.round(steps * (currentWeight * 0.00053));
  }, [steps, currentWeight]);

  // Logged workouts for selected date
  const todayWorkouts = useMemo(() => {
    return (cardioLogs || []).filter((c) => c.date === selectedDate);
  }, [cardioLogs, selectedDate]);

  // Sum of workout calories
  const workoutCaloriesBurned = useMemo(() => {
    return todayWorkouts.reduce((sum, c) => sum + (c.caloriesBurned || 0), 0);
  }, [todayWorkouts]);

  // Total daily active burn
  const totalActiveBurn = stepCaloriesBurned + workoutCaloriesBurned;
  const stepPercent = Math.min(100, Math.round((steps / (stepTarget || 10000)) * 100));

  // --- Modal States ---
  const [refreshing, setRefreshing] = useState(false);
  const [stepModalVisible, setStepModalVisible] = useState(false);
  const [stepInputVal, setStepInputVal] = useState<string>(String(steps || 0));

  const [workoutModalVisible, setWorkoutModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<CardioType>('basketball');
  const [selectedIntensityIdx, setSelectedIntensityIdx] = useState<number>(1);
  const [durationInputVal, setDurationInputVal] = useState<string>('45');

  const [editingWorkout, setEditingWorkout] = useState<CardioLog | null>(null);
  const [editDurationVal, setEditDurationVal] = useState<string>('45');

  const [guideModalVisible, setGuideModalVisible] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // --- Step Modal Handlers ---
  const handleOpenStepModal = () => {
    triggerLightHaptic();
    setStepInputVal(String(steps));
    setStepModalVisible(true);
  };

  const handleSaveSteps = () => {
    const val = parseInt(stepInputVal, 10);
    if (!isNaN(val) && val >= 0) {
      triggerSuccessHaptic();
      setSteps(val);
    }
    setStepModalVisible(false);
  };

  const handleAdjustSteps = (delta: number) => {
    triggerLightHaptic();
    const curr = parseInt(stepInputVal, 10) || steps;
    const next = Math.max(0, curr + delta);
    setStepInputVal(String(next));
  };

  const handleQuickAdd = (delta: number) => {
    triggerSelectionHaptic();
    const curr = parseInt(stepInputVal, 10) || steps;
    setStepInputVal(String(Math.max(0, curr + delta)));
  };

  // Preview calories for typed steps
  const previewStepBurn = useMemo(() => {
    const parsed = parseInt(stepInputVal, 10) || 0;
    return Math.round(parsed * (currentWeight * 0.00053));
  }, [stepInputVal, currentWeight]);

  // --- Workout Modal Handlers ---
  const handleOpenWorkoutModal = () => {
    triggerLightHaptic();
    setSelectedType('basketball');
    setSelectedIntensityIdx(1);
    setDurationInputVal('45');
    setWorkoutModalVisible(true);
  };

  const activeConfig = ACTIVITY_CONFIGS[selectedType];
  const activeIntensity = activeConfig.intensities[selectedIntensityIdx] || activeConfig.intensities[0];
  const parsedDuration = Math.max(1, parseInt(durationInputVal, 10) || activeConfig.defaultDuration);

  // Live ACSM MET formula: Math.round(((met * 3.5 * currentWeight) / 200) * durationMinutes)
  const previewWorkoutBurn = Math.round(
    ((activeIntensity.met * 3.5 * currentWeight) / 200) * parsedDuration
  );

  const handleSaveWorkout = () => {
    triggerSuccessHaptic();
    logCardioWorkout({
      type: selectedType,
      durationMinutes: parsedDuration,
      met: activeIntensity.met,
      intensityLabel: activeIntensity.label,
      date: selectedDate,
    });
    setWorkoutModalVisible(false);
  };

  // --- Edit Workout Handlers ---
  const handleOpenEditWorkout = (item: CardioLog) => {
    triggerLightHaptic();
    setEditingWorkout(item);
    setEditDurationVal(String(item.durationMinutes));
  };

  const handleSaveEditWorkout = () => {
    if (editingWorkout) {
      const mins = Math.max(1, parseInt(editDurationVal, 10) || editingWorkout.durationMinutes);
      triggerSuccessHaptic();
      updateCardioLog(editingWorkout.id, mins);
      setEditingWorkout(null);
    }
  };

  const handleDeleteWorkout = (id: string) => {
    triggerLightHaptic();
    removeCardioLog(id);
  };

  // --- Shortcut URL Copy ---
  const handleCopyShortcutUrl = async () => {
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://fitness-lite.vercel.app';
    const sampleUrl = `${origin}/?syncSteps=`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(sampleUrl);
      }
      setCopiedUrl(true);
      triggerSuccessHaptic();
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // safe fallback
    }
  };

  const handleManualRefresh = async () => {
    if (onRefresh) {
      triggerLightHaptic();
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  };

  return (
    <>
      <Card className="mb-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View style={styles.iconBadge}>
              <Footprints size={16} color="#FF2D55" strokeWidth={2} />
            </View>
            <Text style={styles.cardHeaderTitle}>Activity & Burn</Text>
          </View>

          <View className="flex-row items-center">
            {/* Apple Shortcut Guide Button */}
            <TouchableOpacity
              onPress={() => {
                triggerLightHaptic();
                setGuideModalVisible(true);
              }}
              activeOpacity={0.7}
              style={styles.shortcutGuideButton}
            >
              <Zap size={11} color="#FF9500" strokeWidth={2.5} style={{ marginRight: 3 }} />
              <Text style={styles.shortcutGuideButtonText}>iOS Sync</Text>
            </TouchableOpacity>

            {/* Sync Status Badge */}
            <TouchableOpacity
              onPress={handleManualRefresh}
              activeOpacity={0.7}
              className="flex-row items-center bg-[#F2F2F7] px-2.5 py-1 rounded-full ml-1.5"
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#FF2D55" style={{ marginRight: 4 }} />
              ) : (
                <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
              )}
              <Text style={styles.syncStatusText}>
                {Platform.OS === 'web'
                  ? 'PWA'
                  : isMockMode
                  ? 'Preview'
                  : 'HealthKit'}
              </Text>
              <RefreshCw size={11} color="#8E8E93" strokeWidth={2} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. TOTAL DAILY ACTIVE BURN SUMMARY BADGE */}
        <View style={styles.heroBurnBanner} className="mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View style={styles.burnIconCircle}>
                <Flame size={14} color="#FF9500" strokeWidth={2.5} />
              </View>
              <Text style={styles.heroBurnTitle}>Total Active Burn</Text>
            </View>
            <Text style={styles.heroBurnNumber}>
              {totalActiveBurn.toLocaleString()}{' '}
              <Text style={styles.heroBurnKcal}>kcal</Text>
            </Text>
          </View>
          <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-black/[0.04]">
            <Text style={styles.heroBurnBreakdown}>
              {stepCaloriesBurned.toLocaleString()} kcal steps • {workoutCaloriesBurned.toLocaleString()} kcal workouts
            </Text>
            <Text style={styles.weightBasisText}>at {currentWeight.toFixed(1)} kg</Text>
          </View>
        </View>

        {/* 2. STEPS SECTION (Tappable for instant adjustment + live step burn) */}
        <TouchableOpacity
          onPress={handleOpenStepModal}
          activeOpacity={0.7}
          style={styles.stepsTouchArea}
          className="mb-2"
        >
          <View className="flex-row items-baseline justify-between">
            <View>
              <View className="flex-row items-center">
                <Text style={styles.stepsNumber}>{steps.toLocaleString()}</Text>
                <Edit3
                  size={14}
                  color="#8E8E93"
                  strokeWidth={2}
                  style={{ marginLeft: 6, marginBottom: 4 }}
                />
              </View>
              <Text style={styles.stepsLabel}>
                of {stepTarget.toLocaleString()} steps •{' '}
                <Text style={{ color: '#007AFF' }}>Tap to edit</Text>
              </Text>
            </View>

            <View className="items-end">
              <View className="flex-row items-center">
                <Flame size={13} color="#FF2D55" strokeWidth={2} style={{ marginRight: 3 }} />
                <Text style={styles.stepBurnNumber}>
                  +{stepCaloriesBurned.toLocaleString()} kcal
                </Text>
              </View>
              <Text style={styles.stepBurnSub}>step energy</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Step Progress Track */}
        <View style={styles.stepTrack} className="mb-4">
          <View
            style={[
              styles.stepFill,
              { width: `${stepPercent}%`, backgroundColor: '#FF2D55' },
            ]}
          />
        </View>

        <View style={styles.divider} className="mb-4" />

        {/* 3. LOGGED WORKOUTS / CARDIO SECTION */}
        <View className="pt-0">
          <View className="flex-row items-center justify-between mb-2.5">
            <View className="flex-row items-center">
              <Trophy size={14} color="#000000" strokeWidth={2} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>
                Logged Workouts ({todayWorkouts.length})
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleOpenWorkoutModal}
              activeOpacity={0.7}
              style={styles.logWorkoutHeaderButton}
            >
              <Plus size={13} color="#007AFF" strokeWidth={2.5} style={{ marginRight: 3 }} />
              <Text style={styles.logWorkoutHeaderText}>Log Workout</Text>
            </TouchableOpacity>
          </View>

          {/* Workout List */}
          {todayWorkouts.length > 0 ? (
            <View style={styles.workoutsListContainer}>
              {todayWorkouts.map((item, idx) => {
                const config = ACTIVITY_CONFIGS[item.type] || ACTIVITY_CONFIGS.walk;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.workoutRow,
                      idx !== todayWorkouts.length - 1 && styles.workoutRowBorder,
                    ]}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <View
                        style={[
                          styles.workoutBadge,
                          { backgroundColor: `${config.accentColor}18` },
                        ]}
                      >
                        <Text style={{ fontSize: 14 }}>{config.badgeEmoji}</Text>
                      </View>
                      <View className="flex-1">
                        <Text style={styles.workoutItemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.workoutItemMeta}>
                          {item.durationMinutes} min • MET {item.met || 4.5}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center">
                      <Text style={styles.workoutBurnText}>
                        +{item.caloriesBurned} kcal
                      </Text>

                      <TouchableOpacity
                        onPress={() => handleOpenEditWorkout(item)}
                        style={styles.iconActionButton}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Edit3 size={14} color="#8E8E93" strokeWidth={1.75} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeleteWorkout(item.id)}
                        style={styles.iconActionButton}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Trash2 size={14} color="#FF3B30" strokeWidth={1.75} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleOpenWorkoutModal}
              activeOpacity={0.7}
              style={styles.emptyWorkoutBox}
            >
              <Text style={styles.emptyWorkoutText}>
                No workouts logged today. Tap here to log basketball, gym, or walking.
              </Text>
              <View className="flex-row items-center justify-center mt-2.5">
                <View style={styles.emptyLogPill}>
                  <Plus size={13} color="#007AFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
                  <Text style={styles.emptyLogPillText}>+ Log Workout / Cardio</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </Card>

      {/* --- MODAL 1: STEP ENTRY CONTROLS --- */}
      <Modal
        visible={stepModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStepModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContentWrapper}
            >
              <View style={styles.sheetContent}>
                <View className="flex-row justify-between items-center mb-3">
                  <View>
                    <Text style={styles.sheetTitle}>Update Step Count</Text>
                    <Text style={styles.sheetSubtitle}>
                      Live burn preview at {currentWeight.toFixed(1)} kg
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setStepModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <X size={18} color="#8E8E93" strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                {/* Big Number Stepper */}
                <View className="flex-row items-center justify-center my-4 py-3 bg-[#F2F2F7] rounded-2xl">
                  <TouchableOpacity
                    onPress={() => handleAdjustSteps(-500)}
                    style={styles.stepperButton}
                  >
                    <Minus size={18} color="#FF2D55" strokeWidth={2.5} />
                  </TouchableOpacity>

                  <View className="mx-4 items-center">
                    <TextInput
                      value={stepInputVal}
                      onChangeText={setStepInputVal}
                      keyboardType="number-pad"
                      style={styles.stepsInput}
                      maxLength={6}
                      selectTextOnFocus
                    />
                    <Text style={styles.stepsInputLabel}>
                      ~{previewStepBurn.toLocaleString()} kcal burned
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleAdjustSteps(500)}
                    style={styles.stepperButton}
                  >
                    <Plus size={18} color="#FF2D55" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                {/* Quick Increment Chips */}
                <View className="flex-row justify-between mb-4">
                  <TouchableOpacity
                    onPress={() => handleQuickAdd(-500)}
                    style={styles.quickPill}
                  >
                    <Text style={styles.quickPillText}>-500</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleQuickAdd(500)}
                    style={styles.quickPill}
                  >
                    <Text style={styles.quickPillText}>+500</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleQuickAdd(1000)}
                    style={styles.quickPill}
                  >
                    <Text style={styles.quickPillText}>+1,000</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleQuickAdd(2500)}
                    style={styles.quickPill}
                  >
                    <Text style={styles.quickPillText}>+2,500</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      triggerSelectionHaptic();
                      setStepInputVal('10000');
                    }}
                    style={[
                      styles.quickPill,
                      { backgroundColor: 'rgba(255, 45, 85, 0.12)' },
                    ]}
                  >
                    <Text style={[styles.quickPillText, { color: '#FF2D55' }]}>
                      10,000
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleSaveSteps}
                  style={styles.saveStepsButton}
                  activeOpacity={0.8}
                >
                  <Check
                    size={18}
                    color="#FFFFFF"
                    strokeWidth={2.5}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.saveButtonText}>Set Steps</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* --- MODAL 2: LOG WORKOUT / CARDIO SHEET --- */}
      <Modal
        visible={workoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWorkoutModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContentWrapper}
            >
              <View style={[styles.sheetContent, { maxHeight: '90%' }]}>
                <View className="flex-row justify-between items-center mb-3">
                  <View>
                    <Text style={styles.sheetTitle}>Log Workout / Cardio</Text>
                    <Text style={styles.sheetSubtitle}>
                      Calculated via ACSM MET formula at {currentWeight.toFixed(1)} kg
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setWorkoutModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <X size={18} color="#8E8E93" strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                {/* 1. Activity Type Selection Tabs */}
                <View className="flex-row justify-between mb-4">
                  {(['basketball', 'gym', 'walk'] as CardioType[]).map((type) => {
                    const cfg = ACTIVITY_CONFIGS[type];
                    const isSelected = selectedType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => {
                          triggerSelectionHaptic();
                          setSelectedType(type);
                          setSelectedIntensityIdx(0);
                          setDurationInputVal(String(cfg.defaultDuration));
                        }}
                        style={[
                          styles.activityTab,
                          isSelected && {
                            backgroundColor: cfg.accentColor,
                            borderColor: cfg.accentColor,
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 18, marginBottom: 2 }}>
                          {cfg.badgeEmoji}
                        </Text>
                        <Text
                          style={[
                            styles.activityTabText,
                            isSelected && styles.activityTabTextActive,
                          ]}
                        >
                          {cfg.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 2. Intensity Selection */}
                <View className="mb-4">
                  <Text style={styles.inputSectionHeader}>Select Intensity</Text>
                  <View className="space-y-1.5 mt-1.5">
                    {activeConfig.intensities.map((item, idx) => {
                      const isSelected = selectedIntensityIdx === idx;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => {
                            triggerSelectionHaptic();
                            setSelectedIntensityIdx(idx);
                          }}
                          style={[
                            styles.intensityOptionRow,
                            isSelected && styles.intensityOptionRowActive,
                          ]}
                        >
                          <View className="flex-1 mr-2">
                            <Text
                              style={[
                                styles.intensityLabel,
                                isSelected && { color: activeConfig.accentColor, fontWeight: '700' },
                              ]}
                            >
                              {item.label}
                            </Text>
                            <Text style={styles.intensityDesc}>
                              {item.description}
                            </Text>
                          </View>
                          <View style={styles.metBadge}>
                            <Text style={styles.metBadgeText}>MET {item.met}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 3. Duration Input & Chips */}
                <View className="mb-4">
                  <Text style={styles.inputSectionHeader}>Duration (Minutes)</Text>
                  <View className="flex-row items-center justify-center my-2.5 py-2.5 bg-[#F2F2F7] rounded-xl">
                    <TouchableOpacity
                      onPress={() => {
                        triggerLightHaptic();
                        const curr = parseInt(durationInputVal, 10) || 30;
                        setDurationInputVal(String(Math.max(5, curr - 5)));
                      }}
                      style={styles.stepperButtonSmall}
                    >
                      <Minus size={16} color="#000000" strokeWidth={2.5} />
                    </TouchableOpacity>

                    <View className="flex-row items-baseline mx-4">
                      <TextInput
                        value={durationInputVal}
                        onChangeText={setDurationInputVal}
                        keyboardType="number-pad"
                        style={styles.durationInput}
                        maxLength={3}
                        selectTextOnFocus
                      />
                      <Text style={styles.durationUnitText}>mins</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        triggerLightHaptic();
                        const curr = parseInt(durationInputVal, 10) || 30;
                        setDurationInputVal(String(Math.min(300, curr + 5)));
                      }}
                      style={styles.stepperButtonSmall}
                    >
                      <Plus size={16} color="#000000" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>

                  {/* Quick Chips */}
                  <View className="flex-row justify-between mt-1">
                    {[15, 30, 45, 60, 90].map((mins) => {
                      const isSelected = parseInt(durationInputVal, 10) === mins;
                      return (
                        <TouchableOpacity
                          key={mins}
                          onPress={() => {
                            triggerSelectionHaptic();
                            setDurationInputVal(String(mins));
                          }}
                          style={[
                            styles.durationChip,
                            isSelected && { backgroundColor: activeConfig.accentColor },
                          ]}
                        >
                          <Text
                            style={[
                              styles.durationChipText,
                              isSelected && { color: '#FFFFFF' },
                            ]}
                          >
                            {mins}m
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 4. Live Burn Preview Badge */}
                <View style={styles.workoutBurnPreviewBox} className="mb-4">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text style={styles.previewBoxLabel}>Calculated Energy Burn</Text>
                      <Text style={styles.previewFormulaText}>
                        (({activeIntensity.met} × 3.5 × {currentWeight.toFixed(1)}kg) ÷ 200) × {parsedDuration}m
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text style={styles.previewBurnNum}>
                        +{previewWorkoutBurn.toLocaleString()}{' '}
                        <Text style={{ fontSize: 13, fontWeight: '500' }}>kcal</Text>
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleSaveWorkout}
                  style={[
                    styles.saveWorkoutButton,
                    { backgroundColor: activeConfig.accentColor },
                  ]}
                  activeOpacity={0.8}
                >
                  <Check
                    size={18}
                    color="#FFFFFF"
                    strokeWidth={2.5}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.saveButtonText}>
                    Log Workout (+{previewWorkoutBurn} kcal)
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* --- MODAL 3: EDIT EXISTING WORKOUT DURATION --- */}
      <Modal
        visible={!!editingWorkout}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingWorkout(null)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContentWrapper}
            >
              <View style={styles.sheetContent}>
                <View className="flex-row justify-between items-center mb-3">
                  <View>
                    <Text style={styles.sheetTitle}>Edit Workout Minutes</Text>
                    <Text style={styles.sheetSubtitle}>
                      {editingWorkout?.title}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setEditingWorkout(null)}
                    style={styles.closeButton}
                  >
                    <X size={18} color="#8E8E93" strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                {/* Stepper */}
                <View className="flex-row items-center justify-center my-4 py-3 bg-[#F2F2F7] rounded-2xl">
                  <TouchableOpacity
                    onPress={() => {
                      triggerLightHaptic();
                      const curr = parseInt(editDurationVal, 10) || 30;
                      setEditDurationVal(String(Math.max(5, curr - 5)));
                    }}
                    style={styles.stepperButton}
                  >
                    <Minus size={18} color="#007AFF" strokeWidth={2.5} />
                  </TouchableOpacity>

                  <View className="mx-6 items-center">
                    <TextInput
                      value={editDurationVal}
                      onChangeText={setEditDurationVal}
                      keyboardType="number-pad"
                      style={styles.durationInput}
                      maxLength={3}
                      selectTextOnFocus
                    />
                    <Text style={styles.stepsInputLabel}>minutes</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      triggerLightHaptic();
                      const curr = parseInt(editDurationVal, 10) || 30;
                      setEditDurationVal(String(Math.min(300, curr + 5)));
                    }}
                    style={styles.stepperButton}
                  >
                    <Plus size={18} color="#007AFF" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                {/* Save Edit Button */}
                <TouchableOpacity
                  onPress={handleSaveEditWorkout}
                  style={styles.saveEditButton}
                  activeOpacity={0.8}
                >
                  <Check
                    size={18}
                    color="#FFFFFF"
                    strokeWidth={2.5}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.saveButtonText}>Update Duration</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* --- MODAL 4: APPLE HEALTH SHORTCUT GUIDE --- */}
      <Modal
        visible={guideModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGuideModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentWrapper}>
            <View style={styles.sheetContent}>
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <View style={styles.shortcutIconCircle}>
                    <Zap size={16} color="#FF9500" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.sheetTitle}>Apple Health Auto-Sync</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setGuideModalVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={18} color="#8E8E93" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <Text style={styles.guideSubtitle}>
                Sync steps automatically from Apple Health via iOS Shortcuts in 3 simple steps:
              </Text>

              {/* Steps Guide */}
              <View className="space-y-2.5 my-3">
                <View style={styles.guideStepCard}>
                  <Text style={styles.guideStepNum}>1</Text>
                  <View className="flex-1 ml-2.5">
                    <Text style={styles.guideStepTitle}>Find Health Samples</Text>
                    <Text style={styles.guideStepDesc}>
                      Action: <Text style={{ fontWeight: '600' }}>Find Health Samples</Text> • Type: Steps • Start Date: Today
                    </Text>
                  </View>
                </View>

                <View style={styles.guideStepCard}>
                  <Text style={styles.guideStepNum}>2</Text>
                  <View className="flex-1 ml-2.5">
                    <Text style={styles.guideStepTitle}>Calculate Statistics</Text>
                    <Text style={styles.guideStepDesc}>
                      Action: <Text style={{ fontWeight: '600' }}>Calculate Statistics</Text> • Function: Sum of Health Samples
                    </Text>
                  </View>
                </View>

                <View style={styles.guideStepCard}>
                  <Text style={styles.guideStepNum}>3</Text>
                  <View className="flex-1 ml-2.5">
                    <Text style={styles.guideStepTitle}>Open URL</Text>
                    <Text style={styles.guideStepDesc}>
                      Action: <Text style={{ fontWeight: '600' }}>Open URLs</Text> with your app URL plus query:
                    </Text>
                    <Text style={styles.guideUrlSnippet}>
                      https://[domain]/?syncSteps=[Sum]
                    </Text>
                  </View>
                </View>
              </View>

              {/* Copy URL Button */}
              <TouchableOpacity
                onPress={handleCopyShortcutUrl}
                activeOpacity={0.7}
                style={styles.copyUrlButton}
              >
                <Copy size={16} color="#007AFF" strokeWidth={2} style={{ marginRight: 6 }} />
                <Text style={styles.copyUrlButtonText}>
                  {copiedUrl ? 'Copied to Clipboard!' : 'Copy Shortcut URL Base'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.guideFooterTip}>
                Tip: In iOS Shortcuts &gt; Automation, set it to run "When FitnessLite is opened" or every evening for 100% background hands-free syncing!
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 45, 85, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.3,
  },
  shortcutGuideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shortcutGuideButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF9500',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  syncStatusText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
  },
  // Hero Burn Highlight Banner
  heroBurnBanner: {
    backgroundColor: '#F9F9FB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  burnIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  heroBurnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  heroBurnNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FF9500',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  heroBurnKcal: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  heroBurnBreakdown: {
    fontSize: 11,
    color: '#8E8E93',
    fontVariant: ['tabular-nums'],
  },
  weightBasisText: {
    fontSize: 10,
    color: '#C7C7CC',
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  // Steps
  stepsTouchArea: {
    paddingVertical: 2,
  },
  stepsNumber: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  stepsLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  stepBurnNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF2D55',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  stepBurnSub: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 1,
  },
  stepTrack: {
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  stepFill: {
    height: '100%',
    borderRadius: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(60, 60, 67, 0.08)',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  logWorkoutHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  logWorkoutHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  workoutsListContainer: {
    backgroundColor: '#F9F9FB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  workoutRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.08)',
  },
  workoutBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  workoutItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  workoutItemMeta: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  workoutBurnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF9500',
    fontVariant: ['tabular-nums'],
    marginRight: 6,
  },
  iconActionButton: {
    padding: 6,
    marginLeft: 2,
  },
  emptyWorkoutBox: {
    backgroundColor: '#F9F9FB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    alignItems: 'center',
  },
  emptyWorkoutText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 17,
  },
  emptyLogPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  emptyLogPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  // Modal Base
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContentWrapper: {
    width: '100%',
  },
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.4,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stepperButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stepsInput: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    textAlign: 'center',
    minWidth: 120,
  },
  stepsInputLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    fontVariant: ['tabular-nums'],
  },
  quickPill: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 9,
    borderRadius: 12,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    fontVariant: ['tabular-nums'],
  },
  saveStepsButton: {
    backgroundColor: '#FF2D55',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  // Workout Modal Specifics
  activityTab: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 10,
    borderRadius: 14,
    marginHorizontal: 3,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  activityTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  activityTabTextActive: {
    color: '#FFFFFF',
  },
  inputSectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  intensityOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: 6,
  },
  intensityOptionRowActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  intensityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  intensityDesc: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
  metBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000',
    fontVariant: ['tabular-nums'],
  },
  durationInput: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
    textAlign: 'center',
    minWidth: 70,
  },
  durationUnitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 4,
  },
  durationChip: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 8,
    borderRadius: 10,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    fontVariant: ['tabular-nums'],
  },
  workoutBurnPreviewBox: {
    backgroundColor: '#F9F9FB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  previewBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  previewFormulaText: {
    fontSize: 10,
    color: '#C7C7CC',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  previewBurnNum: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF9500',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  saveWorkoutButton: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveEditButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  // Shortcut Guide Modal
  shortcutIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  guideSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  guideStepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    marginBottom: 6,
  },
  guideStepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#007AFF',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  guideStepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  guideStepDesc: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
    lineHeight: 15,
  },
  guideUrlSnippet: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyUrlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 6,
  },
  copyUrlButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  guideFooterTip: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 15,
  },
});
