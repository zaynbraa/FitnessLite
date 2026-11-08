import React, { useMemo } from 'react';
import { View, Text, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WeightChart } from '../../src/components/trends/WeightChart';
import { ConsistencyGrid } from '../../src/components/trends/ConsistencyGrid';
import { useFitnessStore } from '../../src/store/useFitnessStore';
import { Card } from '../../src/components/common/Card';
import { Award, Sparkles, Flame, Check } from 'lucide-react-native';

export default function TrendsScreen() {
  const weightLogs = useFitnessStore((state) => state.weightLogs);
  const targetWeight = useFitnessStore((state) => state.targets.targetWeightKg);

  const currentWeight = useMemo(() => {
    if (!weightLogs || weightLogs.length === 0) return 80.0;
    return weightLogs[weightLogs.length - 1].weightKg;
  }, [weightLogs]);

  const startWeight = 85.0;

  const totalToLose = startWeight - targetWeight; // 8.0 kg
  const lostSoFar = Math.max(0, startWeight - currentWeight); // e.g. 5.5 kg
  const progressPercent = Math.min(100, Math.round((lostSoFar / totalToLose) * 100));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-4 mt-2">
          <Text style={styles.pageTitle}>Trends</Text>
          <Text style={styles.pageSubtitle}>Weight & Habit Consistency</Text>
        </View>

        {/* 1. Goal Overview Progress Card */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View style={styles.iconBadge}>
                <Award size={16} color="#34C759" strokeWidth={2} />
              </View>
              <Text style={styles.cardHeaderTitle}>85 kg → 77 kg Milestone</Text>
            </View>
            <Text style={styles.progressPercentText}>{progressPercent}% Done</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.goalTrack} className="mb-2">
            <View
              style={[
                styles.goalFill,
                { width: `${progressPercent}%`, backgroundColor: '#34C759' },
              ]}
            />
          </View>

          <View className="flex-row justify-between items-center">
            <Text style={styles.subGoalText}>
              Lost {lostSoFar.toFixed(1)} kg of {totalToLose.toFixed(1)} kg total
            </Text>
            <Text style={styles.subGoalRemaining}>
              {(currentWeight - targetWeight).toFixed(1)} kg to goal
            </Text>
          </View>
        </Card>

        {/* 2. Bodyweight vs 7-Day Moving Average Line Chart */}
        <WeightChart />

        {/* 3. Weekly Consistency Grid */}
        <ConsistencyGrid />

        {/* 4. Apple Health Intelligence Card */}
        <Card className="mb-6">
          <View className="flex-row items-center mb-2">
            <View style={styles.insightIconBadge}>
              <Sparkles size={14} color="#007AFF" strokeWidth={2} />
            </View>
            <Text style={styles.cardHeaderTitle}>Protocol Analysis</Text>
          </View>

          <Text style={styles.insightBody}>
            At your current 7-day rolling deficit of ~450 kcal and daily 10,000 steps, you are on track to achieve your <Text style={{ fontWeight: '700', color: '#000000' }}>77.0 kg</Text> target in approximately 3.5 weeks.
          </Text>

          <View className="flex-row items-center mt-3 pt-3 border-t border-black/[0.04]">
            <View className="w-1.5 h-1.5 rounded-full bg-[#34C759] mr-2" />
            <Text style={styles.insightFooterText}>
              Electrolytes & 175g protein targets preserve lean mass during deficit
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 1,
  },
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
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
  progressPercentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34C759',
    fontVariant: ['tabular-nums'],
  },
  goalTrack: {
    height: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 5,
    overflow: 'hidden',
    width: '100%',
  },
  goalFill: {
    height: '100%',
    borderRadius: 5,
  },
  subGoalText: {
    fontSize: 12,
    color: '#8E8E93',
    fontVariant: ['tabular-nums'],
  },
  subGoalRemaining: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    fontVariant: ['tabular-nums'],
  },
  insightIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  insightBody: {
    fontSize: 13,
    lineHeight: 18,
    color: '#3C3C43',
    letterSpacing: -0.1,
  },
  insightFooterText: {
    fontSize: 11,
    color: '#8E8E93',
    flex: 1,
  },
});
