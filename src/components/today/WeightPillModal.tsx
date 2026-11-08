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
} from 'react-native';
import { Scale, Check, X, Plus, Minus } from 'lucide-react-native';
import { useFitnessStore } from '../../store/useFitnessStore';
import { triggerLightHaptic, triggerSuccessHaptic } from '../../utils/haptics';

interface WeightPillModalProps {
  onSyncHealthKit?: (weight: number) => Promise<boolean>;
}

export const WeightPillModal: React.FC<WeightPillModalProps> = ({ onSyncHealthKit }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const weightLogs = useFitnessStore((state) => state.weightLogs);
  const targetWeight = useFitnessStore((state) => state.targets.targetWeightKg);
  const addWeightEntry = useFitnessStore((state) => state.addWeightEntry);

  const currentWeight = useMemo(() => {
    if (!weightLogs || weightLogs.length === 0) return 80.0;
    return weightLogs[weightLogs.length - 1].weightKg;
  }, [weightLogs]);

  const rollingAvg = useMemo(() => {
    if (!weightLogs || weightLogs.length === 0) return 80.0;
    const last7 = weightLogs.slice(-7);
    const sum = last7.reduce((acc, curr) => acc + curr.weightKg, 0);
    return Number((sum / last7.length).toFixed(1));
  }, [weightLogs]);

  const [inputWeight, setInputWeight] = useState(currentWeight.toFixed(1));

  // Delta to 77 kg target
  const deltaToGoal = Number((currentWeight - targetWeight).toFixed(1));

  const handleOpen = () => {
    setInputWeight(currentWeight.toFixed(1));
    triggerLightHaptic();
    setModalVisible(true);
  };

  const handleSave = async () => {
    const val = parseFloat(inputWeight);
    if (!isNaN(val) && val > 30 && val < 250) {
      addWeightEntry(val);
      triggerSuccessHaptic();
      if (onSyncHealthKit) {
        onSyncHealthKit(val);
      }
    }
    setModalVisible(false);
  };

  const adjustWeight = (delta: number) => {
    triggerLightHaptic();
    const curr = parseFloat(inputWeight) || currentWeight;
    const next = Math.max(30, Math.min(250, curr + delta));
    setInputWeight(next.toFixed(1));
  };

  return (
    <>
      {/* Morning Weight Pill */}
      <TouchableOpacity
        onPress={handleOpen}
        activeOpacity={0.7}
        style={styles.pillContainer}
        className="flex-row items-center bg-white px-3 py-1.5 rounded-full border border-black/[0.06]"
      >
        <Scale size={14} color="#34C759" strokeWidth={2} />
        <Text style={styles.pillText} className="text-black font-semibold text-xs ml-1.5">
          {currentWeight.toFixed(1)} kg
        </Text>
        <View className="w-1 h-1 rounded-full bg-black/20 mx-1.5" />
        <Text style={styles.deltaText} className="text-[#8E8E93] text-xs">
          {deltaToGoal > 0 ? `+${deltaToGoal} kg` : `${deltaToGoal} kg`} to {targetWeight} kg
        </Text>
      </TouchableOpacity>

      {/* Entry Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContentWrapper}
            >
              <View style={styles.sheetContent}>
                {/* Sheet Header */}
                <View className="flex-row justify-between items-center mb-4">
                  <View>
                    <Text style={styles.sheetTitle}>Morning Bodyweight</Text>
                    <Text style={styles.sheetSubtitle}>
                      7-day avg: {rollingAvg.toFixed(1)} kg • Goal: {targetWeight} kg
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <X size={18} color="#8E8E93" strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                {/* Weight Stepper & Input */}
                <View className="flex-row items-center justify-center my-6">
                  <TouchableOpacity
                    onPress={() => adjustWeight(-0.1)}
                    style={styles.stepperButton}
                  >
                    <Minus size={20} color="#007AFF" strokeWidth={2} />
                  </TouchableOpacity>

                  <View className="mx-6 items-center">
                    <View className="flex-row items-baseline">
                      <TextInput
                        value={inputWeight}
                        onChangeText={setInputWeight}
                        keyboardType="decimal-pad"
                        style={styles.weightInput}
                        maxLength={5}
                        selectTextOnFocus
                      />
                      <Text style={styles.weightUnit}>kg</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => adjustWeight(0.1)}
                    style={styles.stepperButton}
                  >
                    <Plus size={20} color="#007AFF" strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleSave}
                  style={styles.saveButton}
                  activeOpacity={0.8}
                >
                  <Check size={18} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
                  <Text style={styles.saveButtonText}>Log Weight</Text>
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
  pillContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  pillText: {
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  deltaText: {
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  modalContentWrapper: {
    width: '100%',
  },
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.4,
  },
  sheetSubtitle: {
    fontSize: 13,
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
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightInput: {
    fontSize: 44,
    fontWeight: '700',
    color: '#000000',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    textAlign: 'center',
    minWidth: 100,
  },
  weightUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
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
