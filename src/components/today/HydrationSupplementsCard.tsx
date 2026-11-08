import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from '../common/Card';
import { useFitnessStore } from '../../store/useFitnessStore';
import { Droplets, Pill, Check, Plus, RotateCcw } from 'lucide-react-native';
import { triggerLightHaptic, triggerSelectionHaptic } from '../../utils/haptics';
import { DailySupplements } from '../../types';

export const HydrationSupplementsCard: React.FC = () => {
  const waterMl = useFitnessStore((state) => state.getWaterForDate());
  const waterTarget = useFitnessStore((state) => state.targets.waterMl);
  const addWater = useFitnessStore((state) => state.addWater);
  const setWater = useFitnessStore((state) => state.setWater);

  const supplements = useFitnessStore((state) => state.getSupplementsForDate());
  const toggleSupplement = useFitnessStore((state) => state.toggleSupplement);

  const waterPercent = Math.min(100, Math.round((waterMl / waterTarget) * 100));

  const handleAddWater = (ml: number) => {
    triggerLightHaptic();
    addWater(ml);
  };

  const handleResetWater = () => {
    triggerLightHaptic();
    setWater(0);
  };

  const handleToggleSupplement = (key: keyof DailySupplements) => {
    triggerSelectionHaptic();
    toggleSupplement(key);
  };

  return (
    <Card className="mb-4">
      {/* --- HYDRATION SECTION --- */}
      <View className="mb-5">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View style={styles.waterIconBadge}>
              <Droplets size={16} color="#32ADE6" strokeWidth={2} />
            </View>
            <Text style={styles.cardHeaderTitle}>Hydration</Text>
          </View>

          <View className="flex-row items-center">
            <Text style={styles.waterTargetLabel}>
              <Text style={styles.waterCurrentNum}>{waterMl.toLocaleString()}</Text> / {waterTarget.toLocaleString()} ml
            </Text>
            {waterMl > 0 && (
              <TouchableOpacity
                onPress={handleResetWater}
                style={{ marginLeft: 8 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <RotateCcw size={13} color="#8E8E93" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.waterTrack} className="mb-3">
          <View
            style={[
              styles.waterFill,
              { width: `${waterPercent}%`, backgroundColor: '#32ADE6' },
            ]}
          />
        </View>

        {/* Quick Stepper Buttons */}
        <View className="flex-row items-center justify-end">
          <TouchableOpacity
            onPress={() => handleAddWater(250)}
            activeOpacity={0.7}
            style={styles.waterQuickButton}
            className="flex-row items-center mr-2"
          >
            <Plus size={13} color="#32ADE6" strokeWidth={2.5} style={{ marginRight: 3 }} />
            <Text style={styles.waterQuickText}>250 ml</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleAddWater(500)}
            activeOpacity={0.7}
            style={styles.waterQuickButton}
            className="flex-row items-center"
          >
            <Plus size={13} color="#32ADE6" strokeWidth={2.5} style={{ marginRight: 3 }} />
            <Text style={styles.waterQuickText}>500 ml</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* --- SUPPLEMENT CHECKLIST --- */}
      <View className="pt-1">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View style={styles.suppIconBadge}>
              <Pill size={15} color="#007AFF" strokeWidth={2} />
            </View>
            <Text style={styles.cardHeaderTitle}>Daily Stack</Text>
          </View>
          <Text style={styles.autoResetLabel}>Resets at midnight</Text>
        </View>

        {/* Checklist Rows */}
        <View>
          {/* Creatine */}
          <TouchableOpacity
            onPress={() => handleToggleSupplement('creatine')}
            activeOpacity={0.7}
            style={styles.suppRow}
          >
            <View className="flex-row items-center">
              <View
                style={[
                  styles.suppCheckbox,
                  supplements.creatine && styles.suppCheckboxChecked,
                ]}
              >
                {supplements.creatine && <Check size={13} color="#FFFFFF" strokeWidth={2.5} />}
              </View>
              <View>
                <Text
                  style={[
                    styles.suppItemName,
                    supplements.creatine && styles.suppItemNameChecked,
                  ]}
                >
                  Creatine Monohydrate
                </Text>
                <Text style={styles.suppItemDosage}>5g daily scoop</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Vitamins */}
          <TouchableOpacity
            onPress={() => handleToggleSupplement('vitamins')}
            activeOpacity={0.7}
            style={styles.suppRow}
          >
            <View className="flex-row items-center">
              <View
                style={[
                  styles.suppCheckbox,
                  supplements.vitamins && styles.suppCheckboxChecked,
                ]}
              >
                {supplements.vitamins && <Check size={13} color="#FFFFFF" strokeWidth={2.5} />}
              </View>
              <View>
                <Text
                  style={[
                    styles.suppItemName,
                    supplements.vitamins && styles.suppItemNameChecked,
                  ]}
                >
                  Daily Multivitamin
                </Text>
                <Text style={styles.suppItemDosage}>Morning with breakfast</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Electrolytes */}
          <TouchableOpacity
            onPress={() => handleToggleSupplement('electrolytes')}
            activeOpacity={0.7}
            style={[styles.suppRow, { borderBottomWidth: 0, paddingBottom: 0 }]}
          >
            <View className="flex-row items-center">
              <View
                style={[
                  styles.suppCheckbox,
                  supplements.electrolytes && styles.suppCheckboxChecked,
                ]}
              >
                {supplements.electrolytes && <Check size={13} color="#FFFFFF" strokeWidth={2.5} />}
              </View>
              <View>
                <Text
                  style={[
                    styles.suppItemName,
                    supplements.electrolytes && styles.suppItemNameChecked,
                  ]}
                >
                  Vitamins & Electrolytes
                </Text>
                <Text style={styles.suppItemDosage}>Sodium, Potassium, Magnesium</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  waterIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: 'rgba(50, 173, 230, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  suppIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
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
  waterTargetLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontVariant: ['tabular-nums'],
  },
  waterCurrentNum: {
    color: '#000000',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  waterTrack: {
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  waterFill: {
    height: '100%',
    borderRadius: 4,
  },
  waterQuickButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  waterQuickText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#32ADE6',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(60, 60, 67, 0.08)',
    marginBottom: 14,
  },
  autoResetLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  suppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.06)',
  },
  suppCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suppCheckboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  suppItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  suppItemNameChecked: {
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  suppItemDosage: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
});
