import React, { useState } from 'react';
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
import { X, Check } from 'lucide-react-native';
import { triggerLightHaptic, triggerSuccessHaptic } from '../../utils/haptics';

interface CustomFoodModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (preset: {
    name: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    defaultGrams: number;
  }) => void;
}

export const CustomFoodModal: React.FC<CustomFoodModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [defaultGrams, setDefaultGrams] = useState('100');

  const handleSave = () => {
    if (!name.trim()) return;
    triggerSuccessHaptic();
    onSave({
      name: name.trim(),
      caloriesPer100g: parseFloat(calories) || 0,
      proteinPer100g: parseFloat(protein) || 0,
      carbsPer100g: parseFloat(carbs) || 0,
      fatPer100g: parseFloat(fat) || 0,
      defaultGrams: parseFloat(defaultGrams) || 100,
    });
    // Reset fields
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setDefaultGrams('100');
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
              <View className="flex-row items-center justify-between mb-4">
                <Text style={styles.sheetTitle}>Add Custom Food</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={18} color="#8E8E93" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Food Name */}
                <View className="mb-3">
                  <Text style={styles.inputLabel}>Food Name</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Protein Bar, Greek Salad"
                    placeholderTextColor="#C7C7CC"
                    style={styles.textInput}
                  />
                </View>

                {/* Per 100g Inputs */}
                <Text style={[styles.inputLabel, { marginTop: 4 }]}>Values per 100g (or 100ml)</Text>
                <View className="flex-row justify-between mb-3">
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.subInputLabel}>Calories (kcal)</Text>
                    <TextInput
                      value={calories}
                      onChangeText={setCalories}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#C7C7CC"
                      style={styles.textInput}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subInputLabel}>Default Grams (g)</Text>
                    <TextInput
                      value={defaultGrams}
                      onChangeText={setDefaultGrams}
                      keyboardType="numeric"
                      placeholder="100"
                      placeholderTextColor="#C7C7CC"
                      style={styles.textInput}
                    />
                  </View>
                </View>

                {/* Macros */}
                <View className="flex-row justify-between mb-5">
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <Text style={[styles.subInputLabel, { color: '#007AFF' }]}>Protein (g)</Text>
                    <TextInput
                      value={protein}
                      onChangeText={setProtein}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#C7C7CC"
                      style={styles.textInput}
                    />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 3 }}>
                    <Text style={[styles.subInputLabel, { color: '#FF9500' }]}>Carbs (g)</Text>
                    <TextInput
                      value={carbs}
                      onChangeText={setCarbs}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#C7C7CC"
                      style={styles.textInput}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <Text style={[styles.subInputLabel, { color: '#AF52DE' }]}>Fat (g)</Text>
                    <TextInput
                      value={fat}
                      onChangeText={setFat}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#C7C7CC"
                      style={styles.textInput}
                    />
                  </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={!name.trim()}
                  style={[
                    styles.saveButton,
                    !name.trim() && { opacity: 0.5 },
                  ]}
                  activeOpacity={0.8}
                >
                  <Check size={18} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
                  <Text style={styles.saveButtonText}>Save Food Preset</Text>
                </TouchableOpacity>
              </ScrollView>
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
    maxHeight: '85%',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  subInputLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000000',
    fontVariant: ['tabular-nums'],
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
