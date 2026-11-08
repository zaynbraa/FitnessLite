import React, { useState } from 'react';
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
} from 'react-native';
import { Card } from '../common/Card';
import { useFitnessStore } from '../../store/useFitnessStore';
import { Footprints, HeartPulse, Check, RefreshCw, Plus, Minus, X, Edit3 } from 'lucide-react-native';
import { triggerLightHaptic, triggerSelectionHaptic, triggerSuccessHaptic } from '../../utils/haptics';
import { CardioType } from '../../types';

interface ActivityCardProps {
  onLogWorkout?: (type: CardioType) => Promise<boolean>;
  onRefresh?: () => Promise<void>;
  isMockMode?: boolean;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  onLogWorkout,
  onRefresh,
  isMockMode = true,
}) => {
  const selectedDate = useFitnessStore((state) => state.selectedDate);
  const steps = useFitnessStore((state) => state.getStepsForDate(selectedDate));
  const activeEnergy = useFitnessStore((state) => state.healthKitActiveEnergy);
  const stepTarget = useFitnessStore((state) => state.targets.steps);
  const cardioLogs = useFitnessStore((state) => state.cardioLogs);
  const setSteps = useFitnessStore((state) => state.setSteps);

  const [refreshing, setRefreshing] = useState(false);
  const [stepModalVisible, setStepModalVisible] = useState(false);
  const [stepInputVal, setStepInputVal] = useState<string>(String(steps || 0));

  // Check if workouts were logged today
  const hasWalkToday = cardioLogs.some((c) => c.date === selectedDate && c.type === 'walk');
  const hasBasketballToday = cardioLogs.some(
    (c) => c.date === selectedDate && c.type === 'basketball'
  );

  const stepPercent = Math.min(100, Math.round((steps / stepTarget) * 100));

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
    setStepInputVal(String(curr + delta));
  };

  const handleToggleCardio = async (type: CardioType) => {
    triggerLightHaptic();
    if (onLogWorkout) {
      await onLogWorkout(type);
      triggerSuccessHaptic();
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
            <Text style={styles.cardHeaderTitle}>Activity & Cardio</Text>
          </View>

          {/* Sync Status Badge */}
          <TouchableOpacity
            onPress={handleManualRefresh}
            activeOpacity={0.7}
            className="flex-row items-center bg-[#F2F2F7] px-2.5 py-1 rounded-full"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#FF2D55" style={{ marginRight: 4 }} />
            ) : (
              <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
            )}
            <Text style={styles.syncStatusText}>
              {Platform.OS === 'web' ? 'PWA Quick Log' : (isMockMode ? 'HealthKit Preview' : 'Apple Health')}
            </Text>
            <RefreshCw size={11} color="#8E8E93" strokeWidth={2} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* Live Steps & Active Calories (Tappable Steps for instant 2-second mirror) */}
        <View className="flex-row items-baseline justify-between mt-1 mb-2">
          <TouchableOpacity
            onPress={handleOpenStepModal}
            activeOpacity={0.7}
            style={styles.stepsTouchArea}
          >
            <View className="flex-row items-center">
              <Text style={styles.stepsNumber}>{steps.toLocaleString()}</Text>
              <Edit3 size={14} color="#8E8E93" strokeWidth={2} style={{ marginLeft: 6, marginBottom: 4 }} />
            </View>
            <Text style={styles.stepsLabel}>of {stepTarget.toLocaleString()} steps • <Text style={{ color: '#007AFF' }}>Tap to edit</Text></Text>
          </TouchableOpacity>

          <View className="items-end">
            <View className="flex-row items-center">
              <HeartPulse size={14} color="#FF2D55" strokeWidth={2} style={{ marginRight: 4 }} />
              <Text style={styles.energyNumber}>{activeEnergy.toLocaleString()} kcal</Text>
            </View>
            <Text style={styles.energyLabel}>active energy burned</Text>
          </View>
        </View>

        {/* Progress Track */}
        <View style={styles.stepTrack} className="mb-4">
          <View
            style={[
              styles.stepFill,
              { width: `${stepPercent}%`, backgroundColor: '#FF2D55' },
            ]}
          />
        </View>

        {/* Cardio Quick-Toggle Pills */}
        <View className="pt-1">
          <Text style={styles.sectionCaption}>Quick-Log Dedicated Cardio</Text>
          <View className="flex-row mt-2">
            {/* 40-Min Walk */}
            <TouchableOpacity
              onPress={() => handleToggleCardio('walk')}
              activeOpacity={0.7}
              style={[
                styles.cardioPill,
                hasWalkToday && styles.cardioPillActive,
                { marginRight: 8 },
              ]}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text
                    style={[
                      styles.cardioTitle,
                      hasWalkToday && styles.cardioTitleActive,
                    ]}
                  >
                    40-Min Walk
                  </Text>
                  <Text style={styles.cardioSubtitle}>+210 kcal • +4.2k steps</Text>
                </View>
                <View
                  style={[
                    styles.checkboxCircle,
                    hasWalkToday && styles.checkboxCircleActive,
                  ]}
                >
                  {hasWalkToday && <Check size={12} color="#FFFFFF" strokeWidth={2.5} />}
                </View>
              </View>
            </TouchableOpacity>

            {/* Basketball */}
            <TouchableOpacity
              onPress={() => handleToggleCardio('basketball')}
              activeOpacity={0.7}
              style={[
                styles.cardioPill,
                hasBasketballToday && styles.cardioPillActive,
              ]}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text
                    style={[
                      styles.cardioTitle,
                      hasBasketballToday && styles.cardioTitleActive,
                    ]}
                  >
                    Basketball (30-60m)
                  </Text>
                  <Text style={styles.cardioSubtitle}>+420 kcal • High Intensity</Text>
                </View>
                <View
                  style={[
                    styles.checkboxCircle,
                    hasBasketballToday && styles.checkboxCircleActive,
                  ]}
                >
                  {hasBasketballToday && <Check size={12} color="#FFFFFF" strokeWidth={2.5} />}
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* Quick Step Input Sheet Modal */}
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
                {/* Header */}
                <View className="flex-row justify-between items-center mb-3">
                  <View>
                    <Text style={styles.sheetTitle}>Update Step Count</Text>
                    <Text style={styles.sheetSubtitle}>
                      Mirror from Apple Fitness or pedometer
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setStepModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <X size={18} color="#8E8E93" strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                {/* Stepper + Input */}
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
                    <Text style={styles.stepsInputLabel}>steps today</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleAdjustSteps(500)}
                    style={styles.stepperButton}
                  >
                    <Plus size={18} color="#FF2D55" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                {/* Quick Add Pills */}
                <View className="flex-row justify-between mb-4">
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
                    onPress={() => handleQuickAdd(5000)}
                    style={styles.quickPill}
                  >
                    <Text style={styles.quickPillText}>+5,000</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      triggerSelectionHaptic();
                      setStepInputVal('10000');
                    }}
                    style={[styles.quickPill, { backgroundColor: 'rgba(255, 45, 85, 0.12)' }]}
                  >
                    <Text style={[styles.quickPillText, { color: '#FF2D55' }]}>10k Goal</Text>
                  </TouchableOpacity>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleSaveSteps}
                  style={styles.saveButton}
                  activeOpacity={0.8}
                >
                  <Check size={18} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
                  <Text style={styles.saveButtonText}>Set Steps</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
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
  stepsTouchArea: {
    paddingVertical: 2,
  },
  stepsNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  stepsLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  energyNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  energyLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
  stepTrack: {
    height: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 5,
    overflow: 'hidden',
    width: '100%',
  },
  stepFill: {
    height: '100%',
    borderRadius: 5,
  },
  sectionCaption: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    letterSpacing: -0.2,
  },
  cardioPill: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardioPillActive: {
    backgroundColor: 'rgba(255, 45, 85, 0.08)',
    borderColor: 'rgba(255, 45, 85, 0.3)',
  },
  cardioTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  cardioTitleActive: {
    color: '#FF2D55',
  },
  cardioSubtitle: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleActive: {
    backgroundColor: '#FF2D55',
    borderColor: '#FF2D55',
  },
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
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
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
  stepsInput: {
    fontSize: 36,
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
  saveButton: {
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
});
