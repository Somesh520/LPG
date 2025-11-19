// screens/SettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Modal from 'react-native-modal';

const DEFAULT_LOW_GAS_KG = 2.0;

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const user = auth().currentUser;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || user?.email || 'Guest');
  const [device, setDevice] = useState<any>(null);

  // --- MODAL STATES ---
  const [isInputModalVisible, setInputModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputTitle, setInputTitle] = useState('');
  const [inputMode, setInputMode] = useState<'threshold' | 'tare' | 'name'>('threshold');
  const [keyboardType, setKeyboardType] = useState<'default' | 'decimal-pad'>('default');

  const [isStatusModalVisible, setStatusModalVisible] = useState(false);
  const [statusTitle, setStatusTitle] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const userSub = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          setDisplayName(data?.displayName || user?.email || 'Guest');
        } else {
          setDisplayName(user?.email || 'Guest');
        }
      });

    const deviceSub = firestore()
      .collection('devices')
      .where('ownerId', '==', user.uid)
      .limit(1)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            setDevice({ id: doc.id, ...doc.data() });
          } else {
            setDevice(null);
          }
          setIsLoading(false);
        },
        (error) => {
          console.error('Error fetching device:', error);
          setIsLoading(false);
        }
      );

    return () => {
      userSub();
      deviceSub();
    };
  }, [user]);

  // Status modal helper
  const showStatusModal = (type: 'success' | 'error', title: string, message: string) => {
    setStatusType(type);
    setStatusTitle(title);
    setStatusMessage(message);
    setStatusModalVisible(true);
  };

  const handleDialogSave = async () => {
    const input = inputValue.trim();

    if (inputMode === 'name') {
      if (input.length < 3) {
        showStatusModal('error', 'Invalid Name', 'Name must be at least 3 characters long.');
        return;
      }

      setIsSaving(true);
      try {
        await user?.updateProfile({ displayName: input });
        await firestore().collection('users').doc(user!.uid).set({ displayName: input }, { merge: true });
        if (device) {
          await firestore().collection('devices').doc(device.id).update({ ownerName: input });
        }
        setInputModalVisible(false);
        showStatusModal('success', 'Success', 'Profile name updated!');
      } catch (e: any) {
        setInputModalVisible(false);
        showStatusModal('error', 'Error', e.message);
      } finally {
        setIsSaving(false);
      }
    } else if (inputMode === 'threshold' || inputMode === 'tare') {
      const val = parseFloat(input);
      if (isNaN(val) || val <= 0) {
        showStatusModal('error', 'Invalid Input', 'Please enter a valid number.');
        return;
      }

      setIsSaving(true);
      try {
        const field = inputMode === 'threshold' ? 'lowGasThreshold' : 'tareWeight';
        await firestore().collection('devices').doc(device.id).update({ [field]: val });

        const successMessage =
          inputMode === 'threshold'
            ? `Low gas alert set to ${val} KG.`
            : `Tare weight set to ${val} KG.`;

        setInputModalVisible(false);
        showStatusModal('success', 'Success', successMessage);
      } catch (e: any) {
        setInputModalVisible(false);
        showStatusModal('error', 'Error', e.message);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDialogCancel = () => {
    if (isSaving) return;
    setInputModalVisible(false);
  };

  // --- SETTINGS ACTION HANDLERS ---
  const handleUpdateProfile = () => {
    setInputTitle('Update Name');
    setInputMode('name');
    setInputValue(displayName);
    setKeyboardType('default');
    setInputModalVisible(true);
  };

  const handleUpdateThreshold = () => {
    if (!device) return;
    setInputTitle('Low Gas Alert (KG)');
    setInputMode('threshold');
    setInputValue(device.lowGasThreshold?.toString() || DEFAULT_LOW_GAS_KG.toString());
    setKeyboardType('decimal-pad');
    setInputModalVisible(true);
  };

  const handleSetTareWeight = () => {
    if (!device) {
      showStatusModal('error', 'Error', 'Device not found. Please add a device first.');
      return;
    }
    setInputTitle('Set Empty (Tare) Weight (KG)');
    setInputMode('tare');
    setInputValue(device.tareWeight?.toString() || '5.5');
    setKeyboardType('decimal-pad');
    setInputModalVisible(true);
  };

  // 🗑️ NEW: Delete Device Handler
  const handleDeleteDevice = async () => {
    if (!device) {
      showStatusModal('error', 'Error', 'No device found to delete.');
      return;
    }

    Alert.alert(
      'Delete Device',
      'Are you sure you want to delete this device? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              await firestore().collection('devices').doc(device.id).delete();
              setDevice(null);
              showStatusModal('success', 'Deleted', 'Device removed successfully.');
            } catch (e: any) {
              showStatusModal('error', 'Error', e.message || 'Failed to delete device.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => auth().signOut() },
    ]);
  };

  const isActionLoading = isSaving;

  if (isLoading) {
    return (
      <LinearGradient colors={['#000428', '#004e92']} style={styles.center}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading Settings...</Text>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#000428', '#004e92']} style={StyleSheet.absoluteFillObject} />
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Settings</Text>

        {/* Profile Section */}
        <Text style={styles.sectionTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.profileCard}
          onPress={handleUpdateProfile}
          disabled={isActionLoading}>
          <Icon name="account-circle" size={50} color="#fff" style={styles.profileIcon} />
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileLabel}>{user?.email}</Text>
          </View>
          <Icon name="pencil" size={22} color="#ccc" />
        </TouchableOpacity>

        {/* My Device Section */}
        <Text style={styles.sectionTitle}>My Device</Text>
        {device ? (
          <View style={styles.settingsGroup}>
            <TouchableOpacity style={styles.settingItem} disabled={isActionLoading} onPress={handleUpdateThreshold}>
              <Icon name="fuel" size={24} color="#FFA000" style={styles.settingIcon} />
              <Text style={styles.settingText}>Low Gas Alert At</Text>
              <Text style={styles.settingValue}>
                {device.lowGasThreshold || DEFAULT_LOW_GAS_KG} KG
              </Text>
              <Icon name="chevron-right" size={22} color="#777" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} disabled={isActionLoading} onPress={handleSetTareWeight}>
              <Icon name="scale-balance" size={24} color="#007AFF" style={styles.settingIcon} />
              <Text style={styles.settingText}>Set Empty (Tare) Weight</Text>
              <Text style={styles.settingValue}>
                {device.tareWeight ? `${device.tareWeight.toFixed(2)} KG` : 'Not Set'}
              </Text>
              <Icon name="chevron-right" size={22} color="#777" />
            </TouchableOpacity>

            {/* 🗑️ DELETE DEVICE BUTTON */}
            <TouchableOpacity
              style={[styles.deleteButton, isActionLoading && styles.buttonDisabled]}
              disabled={isActionLoading}
              onPress={handleDeleteDevice}>
              <Icon name="delete-outline" size={24} color="#E53935" style={{ marginRight: 10 }} />
              <Text style={styles.deleteButtonText}>Delete Device</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noDeviceCard}>
            <Text style={styles.noDeviceText}>No device found.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddDevice')}>
              <Text style={styles.noDeviceLink}>Add one now</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.logoutButton, isActionLoading && styles.buttonDisabled]}
          disabled={isActionLoading}
          onPress={handleLogout}>
          <Icon name="logout" size={20} color="#DB4437" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ===== INPUT MODAL ===== */}
      <Modal isVisible={isInputModalVisible} onBackdropPress={handleDialogCancel} animationIn="zoomIn" animationOut="zoomOut" backdropOpacity={0.7}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{inputTitle}</Text>
          <TextInput
            style={styles.modalInput}
            value={inputValue}
            onChangeText={setInputValue}
            keyboardType={keyboardType}
            placeholder="Enter value"
            placeholderTextColor="#777"
            autoCapitalize={keyboardType === 'default' ? 'words' : 'none'}
          />
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleDialogCancel} disabled={isSaving}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleDialogSave} disabled={isSaving}>
              {isSaving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.modalButtonText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===== STATUS MODAL ===== */}
      <Modal isVisible={isStatusModalVisible} onBackdropPress={() => setStatusModalVisible(false)} animationIn="zoomIn" animationOut="zoomOut" backdropOpacity={0.7}>
        <View style={styles.modalContent}>
          <Icon
            name={statusType === 'success' ? 'check-circle' : 'alert-circle'}
            size={50}
            color={statusType === 'success' ? '#4CAF50' : '#E53935'}
            style={{ alignSelf: 'center', marginBottom: 15 }}
          />
          <Text style={styles.modalTitle}>{statusTitle}</Text>
          <Text style={styles.statusModalMessage}>{statusMessage}</Text>
          <TouchableOpacity style={[styles.modalButton, styles.saveButton, { width: '100%' }]} onPress={() => setStatusModalVisible(false)}>
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ---------- STYLES ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000428' },
  scrollContainer: { padding: 20, paddingBottom: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', marginTop: 10, fontSize: 16 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: { marginRight: 15 },
  profileTextContainer: { flex: 1 },
  profileName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  profileLabel: { color: '#ccc', fontSize: 14 },
  sectionTitle: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 20,
  },
  settingsGroup: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    overflow: 'hidden',
    paddingBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingIcon: { marginRight: 15 },
  settingText: { color: '#fff', fontSize: 16, flex: 1 },
  settingValue: { color: '#ccc', fontSize: 16, marginRight: 10 },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderColor: '#E53935',
    borderWidth: 1,
    borderRadius: 30,
    paddingVertical: 12,
    marginHorizontal: 18,
    marginTop: 15,
  },
  deleteButtonText: {
    color: '#E53935',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noDeviceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  noDeviceText: { color: '#ccc', fontSize: 16 },
  noDeviceLink: { color: '#007AFF', fontSize: 16, fontWeight: 'bold', marginTop: 5 },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#DB4437',
    borderWidth: 2,
    padding: 15,
    borderRadius: 30,
    marginTop: 30,
    height: 50,
  },
  logoutButtonText: { color: '#DB4437', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  buttonDisabled: { opacity: 0.5 },
  modalContent: {
    backgroundColor: '#1A233C',
    padding: 22,
    borderRadius: 15,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 15, textAlign: 'center' },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginLeft: 10, minWidth: 80, alignItems: 'center' },
  cancelButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  saveButton: { backgroundColor: '#007AFF' },
  modalButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  statusModalMessage: { color: '#ccc', fontSize: 16, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
});
