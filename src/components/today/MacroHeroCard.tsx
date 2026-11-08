import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../common/Card';
import { useFitnessStore } from '../../store/useFitnessStore';
import { Flame } from 'lucide-react-native';

export const MacroHeroCard: React.FC = () => {
  const totals = useFitnessStore((state) => state.getTotalsForDate());
  const targets = useFitnessStore((state) => state.targets);

  const calPercent = Math.min(100, Math.round((totals.calories / targets.calories) * 100));
  const proteinPercent = Math.min(100, Math.round((totals.protein / targets.protein) * 100));
  const carbsPercent = Math.min(100, Math.round((totals.carbs / targets.carbs) * 100));
  const fatPercent = Math.min(100, Math.round((totals.fat / targets.fat) * 100));

  return (
    <Card className="mb-4">
      {/* Card Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View style={styles.iconBadge}>
            <Flame size={16} color="#FF9500" strokeWidth={2} />
          </View>
          <Text style={styles.cardHeaderTitle}>Energy & Macros</Text>
        </View>
        <Text style={styles.targetLabel}>Target: {targets.calories.toLocaleString()} kcal</Text>
      </View>

      {/* Hero Calorie Readout */}
      <View className="flex-row items-baseline justify-between mt-1 mb-2">
        <View>
          <Text style={styles.remainingCaloriesNumber}>
            {totals.remainingCalories.toLocaleString()}
          </Text>
          <Text style={styles.remainingCaloriesLabel}>kcal remaining</Text>
        </View>
        <View className="items-end">
          <Text style={styles.consumedNumber}>
            {totals.calories.toLocaleString()} <Text style={styles.consumedTotal}>/ {targets.calories.toLocaleString()} kcal</Text>
          </Text>
          <Text style={styles.percentageText}>{calPercent}% of daily budget</Text>
        </View>
      </View>

      {/* Primary Energy Bar */}
      <View style={styles.macroTrack} className="mb-5">
        <View
          style={[
            styles.macroFill,
            {
              width: `${calPercent}%`,
              backgroundColor: totals.calories > targets.calories ? '#FF3B30' : '#FF9500',
            },
          ]}
        />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* 3 Clean Micro-Bars Below */}
      <View className="flex-row justify-between pt-1">
        {/* Protein */}
        <View style={styles.macroCol}>
          <View className="flex-row items-center justify-between mb-1.5">
            <Text style={styles.macroName}>Protein</Text>
            <Text style={styles.macroAmount}>
              <Text style={{ color: '#007AFF', fontWeight: '700' }}>{totals.protein}</Text>
              <Text style={styles.macroTarget}>/{targets.protein}g</Text>
            </Text>
          </View>
          <View style={styles.microTrack}>
            <View
              style={[
                styles.microFill,
                { width: `${proteinPercent}%`, backgroundColor: '#007AFF' },
              ]}
            />
          </View>
        </View>

        {/* Carbs */}
        <View style={styles.macroCol}>
          <View className="flex-row items-center justify-between mb-1.5">
            <Text style={styles.macroName}>Carbs</Text>
            <Text style={styles.macroAmount}>
              <Text style={{ color: '#FF9500', fontWeight: '700' }}>{totals.carbs}</Text>
              <Text style={styles.macroTarget}>/{targets.carbs}g</Text>
            </Text>
          </View>
          <View style={styles.microTrack}>
            <View
              style={[
                styles.microFill,
                { width: `${carbsPercent}%`, backgroundColor: '#FF9500' },
              ]}
            />
          </View>
        </View>

        {/* Fat */}
        <View style={styles.macroCol}>
          <View className="flex-row items-center justify-between mb-1.5">
            <Text style={styles.macroName}>Fat</Text>
            <Text style={styles.macroAmount}>
              <Text style={{ color: '#AF52DE', fontWeight: '700' }}>{totals.fat}</Text>
              <Text style={styles.macroTarget}>/{targets.fat}g</Text>
            </Text>
          </View>
          <View style={styles.microTrack}>
            <View
              style={[
                styles.microFill,
                { width: `${fatPercent}%`, backgroundColor: '#AF52DE' },
              ]}
            />
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
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
  targetLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontVariant: ['tabular-nums'],
  },
  remainingCaloriesNumber: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  remainingCaloriesLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    letterSpacing: -0.2,
  },
  consumedNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  consumedTotal: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
  },
  percentageText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  macroTrack: {
    height: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 5,
    overflow: 'hidden',
    width: '100%',
  },
  macroFill: {
    height: '100%',
    borderRadius: 5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(60, 60, 67, 0.08)',
    marginBottom: 14,
  },
  macroCol: {
    flex: 1,
    marginHorizontal: 4,
  },
  macroName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  macroAmount: {
    fontSize: 12,
    color: '#000000',
    fontVariant: ['tabular-nums'],
  },
  macroTarget: {
    color: '#8E8E93',
    fontSize: 11,
  },
  microTrack: {
    height: 5,
    backgroundColor: '#F2F2F7',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  microFill: {
    height: '100%',
    borderRadius: 3,
  },
});
