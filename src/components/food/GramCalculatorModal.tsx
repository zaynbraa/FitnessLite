import React, { useState, useEffect } from 'react';
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
  ScrollView,
} from 'react-native';
import { X, Check, Plus, Minus, Scale } from 'lucide-react-native';
import { FoodCategory, FoodPreset } from '../../types';
import { triggerLightHaptic, triggerSelectionHaptic, triggerSuccessHaptic } from '../../utils/haptics';

interface GramCalculatorModalProps {
  visible: boolean;
  food: FoodPreset | null;
  onClose: () => void;
  onLog: (item: {
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
  }) => void;
}

export const GramCalculatorModal: React.FC<GramCalculatorModalProps> = ({
  visible,
  food,
  onClose,
  onLog,
}) => {
  const [gramsInput, setGramsInput] = useState<string>('100');

  useEffect(() => {
    if (food) {
      setGramsInput(String(food.defaultGrams || 100));
    }
  }, [food]);

  if (!food) return null;

  const currentGrams = Math.max(0, parseFloat(gramsInput) || 0);

  // Live Real-Time Macro Formula: Macro = (grams / 100) * per100gValue
  const liveCalories = Math.round((currentGrams / 100) * food.caloriesPer100g);
  const liveProtein = Number(((currentGrams / 100) * food.proteinPer100g).toFixed(1));
  const liveCarbs = Number(((currentGrams / 100) * food.carbsPer100g).toFixed(1));
  const liveFat = Number(((currentGrams / 100) * food.fatPer100g).toFixed(1));

  // If item has a unit representation (e.g. 1 skewer = 100g, 1 egg = 50g)
  const unitCount = food.unitGrams ? Number((currentGrams / food.unitGrams).toFixed(1)) : undefined;

  const handleAdjustGrams = (delta: number) => {
    triggerLightHaptic();
    const next = Math.max(0, Math.round(currentGrams + delta));
    setGramsInput(String(next));
  };

  const handleSetGrams = (val: number) => {
    triggerSelectionHaptic();
    setGramsInput(String(val));
  };

  const handleLog = () => {
    if (currentGrams <= 0) return;
    triggerSuccessHaptic();
    onLog({
      presetId: food.id,
      name: food.name,
      category: food.category,
      grams: currentGrams,
      calories: liveCalories,
      protein: liveProtein,
      carbs: liveCarbs,
      fat: liveFat,
      unitCount,
      unitLabel: food.unitLabel,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContentWrapper}
          >
            <View style={styles.sheetContent}>
              {/* Header */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-1 mr-2">
                  <Text style={styles.foodTitle} numberOfLines={1}>
                    {food.name}
                  </Text>
                  <Text style={styles.foodPer100g}>
                    {Math.round(food.caloriesPer100g)} kcal • {food.proteinPer100g}P • {food.carbsPer100g}C • {food.fatPer100g}F per 100g
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <X size={18} color="#8E8E93" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* Kitchen Scale Gram Readout & Stepper */}
              <View className="items-center my-4 py-3 bg-[#F2F2F7] rounded-2xl">
                <View className="flex-row items-center mb-1">
                  <Scale size={14} color="#8E8E93" strokeWidth={2} style={{ marginRight: 4 }} />
                  <Text style={styles.scaleLabel}>Kitchen Scale Weight</Text>
                </View>

                <View className="flex-row items-center justify-center">
                  <TouchableOpacity
                    onPress={() => handleAdjustGrams(-10)}
                    style={styles.stepperButton}
                  >
                    <Minus size={18} color="#007AFF" strokeWidth={2.5} />
                  </TouchableOpacity>

                  <View className="flex-row items-baseline mx-4">
                    <TextInput
                      value={gramsInput}
                      onChangeText={setGramsInput}
                      keyboardType="numeric"
                      style={styles.gramsInput}
                      maxLength={5}
                      selectTextOnFocus
                    />
                    <Text style={styles.gramsUnit}>g</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleAdjustGrams(10)}
                    style={styles.stepperButton}
                  >
                    <Plus size={18} color="#007AFF" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                {food.unitLabel && food.unitGrams && (
                  <Text style={styles.unitEquivText}>
                    ≈ {unitCount} {food.unitLabel}{unitCount !== 1 ? 's' : ''} ({food.unitGrams}g each)
                  </Text>
                )}
              </View>

              {/* Quick-Tap Chips */}
              <View className="mb-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 2 }}>
                  <TouchableOpacity
                    onPress={() => handleSetGrams(food.defaultGrams)}
                    style={[
                      styles.chip,
                      currentGrams === food.defaultGrams && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        currentGrams === food.defaultGrams && styles.chipTextActive,
                      ]}
                    >
                      Default ({food.defaultGrams}g)
                    </Text>
                  </TouchableOpacity>

                  {food.unitLabel && food.unitGrams && (
                    <TouchableOpacity
                      onPress={() => handleSetGrams(food.unitGrams || 100)}
                      style={[
                        styles.chip,
                        currentGrams === food.unitGrams && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          currentGrams === food.unitGrams && styles.chipTextActive,
                        ]}
                      >
                        1 {food.unitLabel} ({food.unitGrams}g)
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => handleAdjustGrams(50)}
                    style={styles.chip}
                  >
                    <Text style={styles.chipText}>+50g</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleAdjustGrams(100)}
                    style={styles.chip}
                  >
                    <Text style={styles.chipText}>+100g</Text>
                  </TouchableOpacity>

                  {food.quickChips?.map((chipGrams) => {
                    if (chipGrams === food.defaultGrams) return null;
                    return (
                      <TouchableOpacity
                        key={chipGrams}
                        onPress={() => handleSetGrams(chipGrams)}
                        style={[
                          styles.chip,
                          currentGrams === chipGrams && styles.chipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            currentGrams === chipGrams && styles.chipTextActive,
                          ]}
                        >
                          {chipGrams}g
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Real-Time Live Calculated Macro Grid */}
              <View className="flex-row justify-between mb-5 bg-[#F9F9FB] p-3 rounded-xl border border-black/[0.04]">
                {/* Calories */}
                <View className="items-center flex-1">
                  <Text style={styles.macroCalcLabel}>Calories</Text>
                  <Text style={[styles.macroCalcValue, { color: '#FF9500' }]}>
                    {liveCalories}
                  </Text>
                  <Text style={styles.macroCalcUnit}>kcal</Text>
                </View>

                {/* Protein */}
                <View className="items-center flex-1 border-l border-black/[0.06]">
                  <Text style={styles.macroCalcLabel}>Protein</Text>
                  <Text style={[styles.macroCalcValue, { color: '#007AFF' }]}>
                    {liveProtein}
                  </Text>
                  <Text style={styles.macroCalcUnit}>g</Text>
                </View>

                {/* Carbs */}
                <View className="items-center flex-1 border-l border-black/[0.06]">
                  <Text style={styles.macroCalcLabel}>Carbs</Text>
                  <Text style={[styles.macroCalcValue, { color: '#FF9500' }]}>
                    {liveCarbs}
                  </Text>
                  <Text style={styles.macroCalcUnit}>g</Text>
                </View>

                {/* Fat */}
                <View className="items-center flex-1 border-l border-black/[0.06]">
                  <Text style={styles.macroCalcLabel}>Fat</Text>
                  <Text style={[styles.macroCalcValue, { color: '#AF52DE' }]}>
                    {liveFat}
                  </Text>
                  <Text style={styles.macroCalcUnit}>g</Text>
                </View>
              </View>

              {/* Log Food Button */}
              <TouchableOpacity
                onPress={handleLog}
                disabled={currentGrams <= 0}
                style={[
                  styles.logButton,
                  currentGrams <= 0 && { opacity: 0.5 },
                ]}
                activeOpacity={0.8}
              >
                <Check size={18} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
                <Text style={styles.logButtonText}>
                  Log {currentGrams}g ({liveCalories} kcal)
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  foodTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.4,
  },
  foodPer100g: {
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
  scaleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  gramsInput: {
    fontSize: 40,
    fontWeight: '700',
    color: '#000000',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    textAlign: 'center',
    minWidth: 90,
  },
  gramsUnit: {
    fontSize: 22,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 3,
  },
  unitEquivText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  chip: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    fontVariant: ['tabular-nums'],
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  macroCalcLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 2,
  },
  macroCalcValue: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  macroCalcUnit: {
    fontSize: 10,
    color: '#8E8E93',
  },
  logButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
