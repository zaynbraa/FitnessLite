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
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X, Download, Upload, Lock, ShieldCheck, Database, Check } from 'lucide-react-native';
import { useFitnessStore } from '../../store/useFitnessStore';
import { triggerLightHaptic, triggerSuccessHaptic } from '../../utils/haptics';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onRelock?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onRelock,
}) => {
  const exportStateAsJSON = useFitnessStore((state) => state.exportStateAsJSON);
  const importStateFromJSON = useFitnessStore((state) => state.importStateFromJSON);
  const foodLogsCount = useFitnessStore((state) => state.foodLogs.length);
  const weightLogsCount = useFitnessStore((state) => state.weightLogs.length);
  const historyDaysCount = useFitnessStore((state) => Object.keys(state.history).length);

  const [importText, setImportText] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState(false);

  const handleBackup = async () => {
    triggerLightHaptic();
    const jsonStr = exportStateAsJSON();

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(jsonStr);
        setCopiedStatus(true);
        triggerSuccessHaptic();
        setTimeout(() => setCopiedStatus(false), 3000);
      } catch (e) {
        console.error('Clipboard error:', e);
      }
    } else {
      Alert.alert(
        'Backup Generated',
        'Your local state has been exported. Copy and store this securely.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    triggerLightHaptic();
    const success = importStateFromJSON(importText.trim());
    if (success) {
      triggerSuccessHaptic();
      setImportText('');
      setShowImportArea(false);
      Alert.alert('Data Restored', 'Your FitnessLite data was successfully restored.');
      onClose();
    } else {
      Alert.alert('Invalid Backup', 'The provided JSON format is invalid or corrupted.');
    }
  };

  const handleLockApp = async () => {
    triggerLightHaptic();
    await AsyncStorage.removeItem('fitnesslite_unlocked');
    onClose();
    if (onRelock) {
      onRelock();
    } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    }
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
                <View>
                  <Text style={styles.sheetTitle}>Settings & Local Data</Text>
                  <Text style={styles.sheetSubtitle}>100% on-device private storage</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={18} color="#8E8E93" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Stats Summary */}
                <View className="bg-[#F2F2F7] rounded-xl p-3 mb-4 flex-row justify-between">
                  <View className="items-center flex-1">
                    <Text style={styles.statNum}>{foodLogsCount}</Text>
                    <Text style={styles.statLabel}>Meals</Text>
                  </View>
                  <View className="items-center flex-1 border-l border-black/[0.08]">
                    <Text style={styles.statNum}>{weightLogsCount}</Text>
                    <Text style={styles.statLabel}>Weights</Text>
                  </View>
                  <View className="items-center flex-1 border-l border-black/[0.08]">
                    <Text style={styles.statNum}>{historyDaysCount}</Text>
                    <Text style={styles.statLabel}>Archived Days</Text>
                  </View>
                </View>

                {/* Backup Button */}
                <TouchableOpacity
                  onPress={handleBackup}
                  activeOpacity={0.7}
                  style={styles.actionRow}
                >
                  <View className="flex-row items-center flex-1">
                    <View style={[styles.actionIconBadge, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
                      {copiedStatus ? (
                        <Check size={16} color="#007AFF" strokeWidth={2.5} />
                      ) : (
                        <Download size={16} color="#007AFF" strokeWidth={2} />
                      )}
                    </View>
                    <View>
                      <Text style={styles.actionTitle}>
                        {copiedStatus ? 'Copied to Clipboard!' : 'Backup Data (JSON)'}
                      </Text>
                      <Text style={styles.actionDesc}>
                        Copy full state to clipboard for safekeeping
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Restore Toggle */}
                <TouchableOpacity
                  onPress={() => setShowImportArea(!showImportArea)}
                  activeOpacity={0.7}
                  style={styles.actionRow}
                >
                  <View className="flex-row items-center flex-1">
                    <View style={[styles.actionIconBadge, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                      <Upload size={16} color="#34C759" strokeWidth={2} />
                    </View>
                    <View>
                      <Text style={styles.actionTitle}>Restore Data (JSON)</Text>
                      <Text style={styles.actionDesc}>Paste previous JSON backup to restore</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Import Text Input Area */}
                {showImportArea && (
                  <View className="my-2 p-3 bg-[#F2F2F7] rounded-xl">
                    <TextInput
                      value={importText}
                      onChangeText={setImportText}
                      placeholder="Paste JSON backup content here..."
                      placeholderTextColor="#8E8E93"
                      multiline
                      numberOfLines={4}
                      style={styles.jsonInput}
                    />
                    <TouchableOpacity
                      onPress={handleImport}
                      disabled={!importText.trim()}
                      style={[styles.importConfirmButton, !importText.trim() && { opacity: 0.5 }]}
                    >
                      <Text style={styles.importConfirmText}>Restore Now</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Re-Lock App Button */}
                <TouchableOpacity
                  onPress={handleLockApp}
                  activeOpacity={0.7}
                  style={[styles.actionRow, { borderBottomWidth: 0 }]}
                >
                  <View className="flex-row items-center flex-1">
                    <View style={[styles.actionIconBadge, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                      <Lock size={16} color="#FF3B30" strokeWidth={2} />
                    </View>
                    <View>
                      <Text style={[styles.actionTitle, { color: '#FF3B30' }]}>Lock App Now</Text>
                      <Text style={styles.actionDesc}>Requires 4-digit PIN to access again</Text>
                    </View>
                  </View>
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
  sheetSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.08)',
  },
  actionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  actionDesc: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
  jsonInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    color: '#000000',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  importConfirmButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  importConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
