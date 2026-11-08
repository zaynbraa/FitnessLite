import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Card } from '../common/Card';
import { useFitnessStore } from '../../store/useFitnessStore';
import { TrendingDown, Target, Award } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const WeightChart: React.FC = () => {
  const weightLogs = useFitnessStore((state) => state.weightLogs);
  const targetWeight = useFitnessStore((state) => state.targets.targetWeightKg);
  const currentWeight = useFitnessStore((state) => state.getCurrentWeight());
  const rollingAvg = useFitnessStore((state) => state.get7DayRollingAverage());

  // Metrics
  const startWeight = weightLogs.length > 0 ? weightLogs[0].weightKg : 85.0;
  const totalLost = Number((startWeight - currentWeight).toFixed(1));
  const remaining = Number((currentWeight - targetWeight).toFixed(1));

  // Chart Dimensions
  const chartWidth = SCREEN_WIDTH - 64; // Account for screen & card padding
  const chartHeight = 180;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 28;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Use up to last 10-14 data points
  const displayLogs = (weightLogs || []).slice(-10);

  // Compute 7-day moving average array
  const movingAvgData = displayLogs.map((item, idx) => {
    const startIdx = Math.max(0, idx - 6);
    const subset = displayLogs.slice(startIdx, idx + 1);
    const avg = subset.reduce((sum, d) => sum + d.weightKg, 0) / (subset.length || 1);
    return { date: item.date, avg: Number(avg.toFixed(2)) };
  });

  // Min and max for scaling
  const allWeights = [
    ...(displayLogs.length > 0 ? displayLogs.map((d) => d.weightKg) : [80]),
    ...(movingAvgData.length > 0 ? movingAvgData.map((d) => d.avg) : [80]),
    targetWeight || 77,
  ];
  const minWeight = Math.floor(Math.min(...allWeights) - 0.5);
  const maxWeight = Math.ceil(Math.max(...allWeights) + 0.5);
  const weightRange = Math.max(1, maxWeight - minWeight);

  const getX = (index: number) => {
    if (displayLogs.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / Math.max(1, displayLogs.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return (
      paddingTop +
      innerHeight -
      ((val - minWeight) / weightRange) * innerHeight
    );
  };

  // Build raw weight path
  let rawWeightPath = '';
  displayLogs.forEach((item, i) => {
    const x = getX(i);
    const y = getY(item.weightKg);
    rawWeightPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });

  // Build 7-day rolling average path
  let rollingAvgPath = '';
  movingAvgData.forEach((item, i) => {
    const x = getX(i);
    const y = getY(item.avg);
    rollingAvgPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });

  // Target 77 kg Y
  const targetY = getY(targetWeight);

  return (
    <Card className="mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View style={styles.iconBadge}>
            <TrendingDown size={16} color="#34C759" strokeWidth={2} />
          </View>
          <Text style={styles.cardHeaderTitle}>Weight Trend (85 → 77 kg)</Text>
        </View>

        <View className="flex-row items-center">
          <Target size={13} color="#34C759" strokeWidth={2} style={{ marginRight: 4 }} />
          <Text style={styles.targetBadgeText}>Goal: {targetWeight} kg</Text>
        </View>
      </View>

      {/* KPI Stats Bar */}
      <View className="flex-row justify-between my-2 p-3 bg-[#F2F2F7] rounded-xl">
        <View>
          <Text style={styles.kpiLabel}>Current</Text>
          <Text style={styles.kpiValue}>{currentWeight.toFixed(1)} kg</Text>
        </View>
        <View className="border-l border-black/[0.08] pl-3">
          <Text style={styles.kpiLabel}>7-Day Moving Avg</Text>
          <Text style={[styles.kpiValue, { color: '#007AFF' }]}>
            {rollingAvg.toFixed(1)} kg
          </Text>
        </View>
        <View className="border-l border-black/[0.08] pl-3">
          <Text style={styles.kpiLabel}>To 77kg Target</Text>
          <Text style={[styles.kpiValue, { color: '#34C759' }]}>
            {remaining > 0 ? `-${remaining} kg` : 'Target Hit!'}
          </Text>
        </View>
      </View>

      {/* SVG Line Chart */}
      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Target 77 kg Reference Line */}
          <Line
            x1={paddingLeft}
            y1={targetY}
            x2={chartWidth - paddingRight}
            y2={targetY}
            stroke="#34C759"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            opacity={0.6}
          />
          <SvgText
            x={paddingLeft - 4}
            y={targetY + 4}
            fill="#34C759"
            fontSize={10}
            fontWeight="600"
            textAnchor="end"
          >
            {targetWeight}
          </SvgText>

          {/* Min & Max Y-Axis Labels */}
          <SvgText
            x={paddingLeft - 4}
            y={paddingTop + 4}
            fill="#8E8E93"
            fontSize={10}
            textAnchor="end"
          >
            {maxWeight}
          </SvgText>
          <SvgText
            x={paddingLeft - 4}
            y={paddingTop + innerHeight}
            fill="#8E8E93"
            fontSize={10}
            textAnchor="end"
          >
            {minWeight}
          </SvgText>

          {/* Raw Bodyweight Path (Subtle Grey Line) */}
          <Path
            d={rawWeightPath}
            fill="none"
            stroke="#C7C7CC"
            strokeWidth={1.5}
            strokeDasharray="2 2"
          />

          {/* 7-Day Moving Average Line (Solid iOS Blue) */}
          <Path
            d={rollingAvgPath}
            fill="none"
            stroke="#007AFF"
            strokeWidth={2.5}
          />

          {/* Data Points on Raw Weights */}
          {displayLogs.map((item, i) => (
            <Circle
              key={item.id}
              cx={getX(i)}
              cy={getY(item.weightKg)}
              r={3}
              fill="#FFFFFF"
              stroke="#007AFF"
              strokeWidth={2}
            />
          ))}

          {/* X-Axis Date Labels (First & Last) */}
          {displayLogs.length > 0 && (
            <>
              <SvgText
                x={getX(0)}
                y={chartHeight - 6}
                fill="#8E8E93"
                fontSize={10}
                textAnchor="start"
              >
                {displayLogs[0].date.slice(5)}
              </SvgText>
              <SvgText
                x={getX(displayLogs.length - 1)}
                y={chartHeight - 6}
                fill="#8E8E93"
                fontSize={10}
                textAnchor="end"
              >
                Today
              </SvgText>
            </>
          )}
        </Svg>
      </View>

      {/* Chart Legend */}
      <View className="flex-row items-center justify-center mt-3 pt-2 border-t border-black/[0.04]">
        <View className="flex-row items-center mr-4">
          <View className="w-3 h-0.5 bg-[#007AFF] mr-1.5" />
          <Text style={styles.legendText}>7-Day Moving Avg</Text>
        </View>
        <View className="flex-row items-center mr-4">
          <View className="w-2 h-2 rounded-full border border-[#007AFF] bg-white mr-1.5" />
          <Text style={styles.legendText}>Daily Scale</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-0.5 bg-[#34C759] mr-1.5" style={{ borderStyle: 'dashed' }} />
          <Text style={styles.legendText}>77 kg Target</Text>
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
  targetBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
    fontVariant: ['tabular-nums'],
  },
  kpiLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
    marginTop: 2,
  },
  legendText: {
    fontSize: 11,
    color: '#8E8E93',
  },
});
