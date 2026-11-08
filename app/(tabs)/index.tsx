import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { formatHeaderDate } from '../../src/utils/date';
import { WeightPillModal } from '../../src/components/today/WeightPillModal';
import { MacroHeroCard } from '../../src/components/today/MacroHeroCard';
import { ActivityCard } from '../../src/components/today/ActivityCard';
import { HydrationSupplementsCard } from '../../src/components/today/HydrationSupplementsCard';
import { SettingsModal } from '../../src/components/common/SettingsModal';
import { useHealthKit } from '../../src/hooks/useHealthKit';
import { useFitnessStore } from '../../src/store/useFitnessStore';
import { Trash2, Utensils, Settings } from 'lucide-react-native';
import { triggerLightHaptic } from '../../src/utils/haptics';

export default function TodayScreen() {
  const { isMockMode, logDedicatedWorkout, refreshHealthData, syncWeightToHealthKit } =
    useHealthKit();

  const [settingsVisible, setSettingsVisible] = useState(false);

  const selectedDate = useFitnessStore((state) => state.selectedDate);
  const foodLogs = useFitnessStore((state) =>
    state.foodLogs.filter((l) => l.date === selectedDate)
  );
  const removeFoodLog = useFitnessStore((state) => state.removeFoodLog);

  const handleDeleteFood = (id: string) => {
    triggerLightHaptic();
    removeFoodLog(id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimal Header */}
        <View className="flex-row items-center justify-between mb-4 mt-2">
          <View>
            <Text style={styles.dateHeader}>{formatHeaderDate()}</Text>
            <Text style={styles.subGreeting}>Executive Summary</Text>
          </View>

          <View className="flex-row items-center">
            <WeightPillModal onSyncHealthKit={syncWeightToHealthKit} />
            <TouchableOpacity
              onPress={() => {
                triggerLightHaptic();
                setSettingsVisible(true);
              }}
              style={styles.settingsButton}
              activeOpacity={0.7}
            >
              <Settings size={18} color="#8E8E93" strokeWidth={1.75} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. Macro Hero Card */}
        <MacroHeroCard />

        {/* 2. Activity & Cardio Card (Apple Health Synced + Quick PWA Steps) */}
        <ActivityCard
          onLogWorkout={logDedicatedWorkout}
          onRefresh={refreshHealthData}
          isMockMode={isMockMode}
        />

        {/* 3. Hydration & Daily Stack Card */}
        <HydrationSupplementsCard />

        {/* 4. Today's Logged Meals (if any) */}
        {foodLogs.length > 0 && (
          <View className="mt-2 mb-6">
            <View className="flex-row items-center mb-2 px-1">
              <Utensils size={14} color="#8E8E93" strokeWidth={2} style={{ marginRight: 6 }} />
              <Text style={styles.sectionHeaderTitle}>Today's Logged Items</Text>
            </View>

            <View className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
              {foodLogs.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.foodRow,
                    index !== foodLogs.length - 1 && styles.foodRowBorder,
                  ]}
                >
                  <View className="flex-1 mr-2">
                    <Text style={styles.foodName}>{item.name}</Text>
                    <Text style={styles.foodMeta}>
                      {item.grams}g • {item.protein}P • {item.carbs}C • {item.fat}F
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Text style={styles.foodCalories}>{item.calories} kcal</Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteFood(item.id)}
                      style={styles.deleteButton}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={15} color="#8E8E93" strokeWidth={1.75} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Settings & Backup Modal */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
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
  dateHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 1,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  foodRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.08)',
  },
  foodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  foodMeta: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF9500',
    fontVariant: ['tabular-nums'],
    marginRight: 12,
  },
  deleteButton: {
    padding: 4,
  },
});
