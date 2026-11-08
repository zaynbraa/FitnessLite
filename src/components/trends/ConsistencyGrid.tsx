import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../common/Card';
import { useFitnessStore } from '../../store/useFitnessStore';
import { CheckCircle2, Flame, Footprints, Pill } from 'lucide-react-native';

export const ConsistencyGrid: React.FC = () => {
  const foodLogs = useFitnessStore((state) => state.foodLogs);
  const history = useFitnessStore((state) => state.history);
  const stepsByDate = useFitnessStore((state) => state.stepsByDate);
  const supplements = useFitnessStore((state) => state.supplements);
  const targets = useFitnessStore((state) => state.targets);
  const currentDate = useFitnessStore((state) => state.currentDate);
  const healthKitSteps = useFitnessStore((state) => state.healthKitSteps);
  const getWeeklyConsistency = useFitnessStore((state) => state.getWeeklyConsistency);

  const weeklyData = useMemo(() => {
    return getWeeklyConsistency();
  }, [
    foodLogs,
    history,
    stepsByDate,
    supplements,
    targets,
    currentDate,
    healthKitSteps,
    getWeeklyConsistency,
  ]);

  return (
    <Card className="mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View style={styles.iconBadge}>
            <CheckCircle2 size={16} color="#007AFF" strokeWidth={2} />
          </View>
          <Text style={styles.cardHeaderTitle}>Weekly Consistency</Text>
        </View>
        <Text style={styles.subBadgeText}>Past 7 Days</Text>
      </View>

      {/* 7-Day Matrix */}
      <View className="flex-row justify-between items-center py-2 px-1 bg-[#F2F2F7] rounded-xl">
        {weeklyData.map((day, idx) => (
          <View key={day.date} className="items-center flex-1">
            {/* Day Header */}
            <Text style={styles.dayLabelText}>{day.dayName}</Text>
            <Text style={styles.dayDateText}>{day.date.slice(8)}</Text>

            {/* 3 Metric Dots */}
            <View className="items-center my-2 space-y-2.5">
              {/* Calories Dot */}
              <View
                style={[
                  styles.metricDot,
                  day.caloriesHit
                    ? { backgroundColor: '#FF9500' }
                    : styles.metricDotMissed,
                ]}
              />

              {/* 10k Steps Dot */}
              <View
                style={[
                  styles.metricDot,
                  day.stepsHit
                    ? { backgroundColor: '#FF2D55' }
                    : styles.metricDotMissed,
                ]}
              />

              {/* Supplements Dot */}
              <View
                style={[
                  styles.metricDot,
                  day.supplementsHit
                    ? { backgroundColor: '#007AFF' }
                    : styles.metricDotMissed,
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Legend with Icons */}
      <View className="mt-4 pt-3 border-t border-black/[0.04] space-y-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
            <Text style={styles.legendLabel}>Calorie Target (2,200 kcal)</Text>
          </View>
          <Flame size={14} color="#FF9500" strokeWidth={2} />
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View style={[styles.legendDot, { backgroundColor: '#FF2D55' }]} />
            <Text style={styles.legendLabel}>Daily Steps (10,000 steps)</Text>
          </View>
          <Footprints size={14} color="#FF2D55" strokeWidth={2} />
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View style={[styles.legendDot, { backgroundColor: '#007AFF' }]} />
            <Text style={styles.legendLabel}>Daily Stack (Supplements)</Text>
          </View>
          <Pill size={14} color="#007AFF" strokeWidth={2} />
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
  subBadgeText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  dayLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 1,
  },
  dayDateText: {
    fontSize: 10,
    color: '#8E8E93',
    fontVariant: ['tabular-nums'],
    marginBottom: 6,
  },
  metricDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginVertical: 3,
  },
  metricDotMissed: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 12,
    color: '#3C3C43',
  },
});
