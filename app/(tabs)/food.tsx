import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FOOD_PRESETS, CATEGORY_LABELS } from '../../src/data/foodPresets';
import { FoodCategory, FoodPreset } from '../../src/types';
import { useFitnessStore } from '../../src/store/useFitnessStore';
import { GramCalculatorModal } from '../../src/components/food/GramCalculatorModal';
import { CustomFoodModal } from '../../src/components/food/CustomFoodModal';
import { Search, Plus, Scale, ChevronRight, Sparkles } from 'lucide-react-native';
import { triggerLightHaptic, triggerSelectionHaptic } from '../../src/utils/haptics';

export default function LogFoodScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeFood, setActiveFood] = useState<FoodPreset | null>(null);
  const [customModalVisible, setCustomModalVisible] = useState(false);

  const customPresets = useFitnessStore((state) => state.customPresets);
  const addFoodLog = useFitnessStore((state) => state.addFoodLog);
  const addCustomPreset = useFitnessStore((state) => state.addCustomPreset);

  const allPresets = useMemo(() => {
    return [...FOOD_PRESETS, ...customPresets];
  }, [customPresets]);

  const categories = [
    { key: 'all', label: 'All Items' },
    { key: 'protein', label: 'Proteins' },
    { key: 'carbs', label: 'Carbs' },
    { key: 'dairy-fats', label: 'Dairy & Fats' },
    { key: 'produce-drinks', label: 'Produce' },
    { key: 'custom', label: 'Custom' },
  ];

  const filteredFoods = useMemo(() => {
    return allPresets.filter((food) => {
      const matchesCategory =
        selectedCategory === 'all' || food.category === selectedCategory;
      const matchesSearch = food.name
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allPresets, selectedCategory, searchQuery]);

  const handleSelectFood = (food: FoodPreset) => {
    triggerLightHaptic();
    setActiveFood(food);
  };

  const handleCategoryPress = (key: string) => {
    triggerSelectionHaptic();
    setSelectedCategory(key);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3 mt-2">
          <View>
            <Text style={styles.pageTitle}>Log Food</Text>
            <Text style={styles.pageSubtitle}>Kitchen Scale Gram Calculator</Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              triggerLightHaptic();
              setCustomModalVisible(true);
            }}
            activeOpacity={0.7}
            style={styles.addCustomButton}
            className="flex-row items-center"
          >
            <Plus size={14} color="#007AFF" strokeWidth={2.5} style={{ marginRight: 3 }} />
            <Text style={styles.addCustomText}>Custom</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchBar} className="flex-row items-center mb-3">
          <Search size={16} color="#8E8E93" strokeWidth={2} style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search staples (chicken, rice, yogurt...)"
            placeholderTextColor="#8E8E93"
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 4, marginBottom: 12 }}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => handleCategoryPress(cat.key)}
                activeOpacity={0.7}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Food List Card */}
        <View className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden mb-6">
          {filteredFoods.length === 0 ? (
            <View className="p-8 items-center justify-center">
              <Scale size={32} color="#C7C7CC" strokeWidth={1.5} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>No matching food found</Text>
              <Text style={styles.emptySubtitle}>
                Try another keyword or add a custom food item
              </Text>
            </View>
          ) : (
            filteredFoods.map((food, index) => (
              <TouchableOpacity
                key={food.id}
                onPress={() => handleSelectFood(food)}
                activeOpacity={0.7}
                style={[
                  styles.foodRow,
                  index !== filteredFoods.length - 1 && styles.foodRowBorder,
                ]}
              >
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center">
                    <Text style={styles.foodName}>{food.name}</Text>
                    {food.category === 'custom' && (
                      <View style={styles.customBadge}>
                        <Sparkles size={9} color="#AF52DE" strokeWidth={2} style={{ marginRight: 2 }} />
                        <Text style={styles.customBadgeText}>Custom</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.foodMacroSummary}>
                    {Math.round(food.caloriesPer100g)} kcal • {food.proteinPer100g}P • {food.carbsPer100g}C • {food.fatPer100g}F / 100g
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <View className="items-end mr-2">
                    <Text style={styles.portionText}>
                      Default {food.defaultGrams}g
                    </Text>
                    {food.unitLabel && (
                      <Text style={styles.unitText}>1 {food.unitLabel}</Text>
                    )}
                  </View>
                  <ChevronRight size={16} color="#C7C7CC" strokeWidth={2} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Instant Gram Calculator Sheet Modal */}
      <GramCalculatorModal
        visible={!!activeFood}
        food={activeFood}
        onClose={() => setActiveFood(null)}
        onLog={(item) => addFoodLog(item)}
      />

      {/* Custom Food Preset Modal */}
      <CustomFoodModal
        visible={customModalVisible}
        onClose={() => setCustomModalVisible(false)}
        onSave={(preset) => addCustomPreset(preset)}
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
  addCustomButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  addCustomText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    padding: 0,
  },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoryPillActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3C3C43',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  foodRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.08)',
  },
  foodName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  foodMacroSummary: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  portionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    fontVariant: ['tabular-nums'],
  },
  unitText: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 1,
  },
  customBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(175, 82, 222, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  customBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#AF52DE',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
    textAlign: 'center',
  },
});
