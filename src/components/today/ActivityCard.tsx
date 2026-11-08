import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Card } from '../common/Card';
import { useFitnessStore } from '../../store/useFitnessStore';
import { Footprints, HeartPulse, Check, RefreshCw } from 'lucide-react-native';
import { triggerLightHaptic, triggerSuccessHaptic } from '../../utils/haptics';
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
  const steps = useFitnessStore((state) => state.healthKitSteps);
  const activeEnergy = useFitnessStore((state) => state.healthKitActiveEnergy);
  const stepTarget = useFitnessStore((state) => state.targets.steps);
  const cardioLogs = useFitnessStore((state) => state.cardioLogs);
  const selectedDate = useFitnessStore((state) => state.selectedDate);

  const [refreshing, setRefreshing] = useState(false);

  // Check if workouts were logged today
  const hasWalkToday = cardioLogs.some((c) => c.date === selectedDate && c.type === 'walk');
  const hasBasketballToday = cardioLogs.some(
    (c) => c.date === selectedDate && c.type === 'basketball'
  );

  const stepPercent = Math.min(100, Math.round((steps / stepTarget) * 100));

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
            {isMockMode ? 'HealthKit Preview' : 'Apple Health'}
          </Text>
          <RefreshCw size={11} color="#8E8E93" strokeWidth={2} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Live Steps & Active Calories */}
      <View className="flex-row items-baseline justify-between mt-1 mb-2">
        <View>
          <Text style={styles.stepsNumber}>{steps.toLocaleString()}</Text>
          <Text style={styles.stepsLabel}>of {stepTarget.toLocaleString()} steps</Text>
        </View>

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
                <Text style={styles.cardioSubtitle}>+210 kcal • ~4.2k steps</Text>
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
});
