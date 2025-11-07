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
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// ⭐️⭐️⭐️ YEH RAHA FIX ⭐️⭐️⭐️
// 1. Purana (WEB) import HATA DEIN:
// import { getFunctions, httpsCallable } from 'firebase/functions';

// 2. Naya (NATIVE) import ADD KAREIN:
import functions from '@react-native-firebase/functions';
// ⭐️⭐️⭐️ FIX KHATAM ⭐️⭐️⭐️


export default function SettingsScreen({ navigation }: { navigation: any }) {
  const user = auth().currentUser;
  const userName = user ? user.email : 'Guest';
  
  const [isTestLoading, setIsTestLoading] = useState(false); 
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isDeviceLoading, setIsDeviceLoading] = useState(true);

  // Device ID fetch (Delete button ke liye)
  useEffect(() => {
    const fetchDeviceId = async () => {
      if (!user) {
        setIsDeviceLoading(false);
        return;
      }
      try {
        const snapshot = await firestore()
          .collection('devices')
          .where('ownerId', '==', user.uid)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          setDeviceId(snapshot.docs[0].id);
        }
      } catch (e) {
        console.error("Error fetching device ID:", e);
      } finally {
        setIsDeviceLoading(false);
      }
    };
    
    fetchDeviceId();
  }, [user]);

  // Logout
  const handleLogout = () => {
    Alert.alert('Logout', 'Kya aap sach mein logout karna chahte hain?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', 
        onPress: () => {
          auth().signOut();
        } 
      },
    ]);
  };

  // Delete Device
  const handleDeleteDevice = async () => {
    if (!user || !deviceId) {
      Alert.alert('Error', 'Device not found.');
      return;
    }

    Alert.alert('Delete Device', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Delete',
        style: 'destructive',
        onPress: async () => {
          setIsDeleteLoading(true); // Delete loading state
          try {
            await firestore().collection('devices').doc(deviceId).delete();
            Alert.alert('Success', 'Device deleted successfully.');
            setDeviceId(null); // Device state update
          } catch (error: any) {
            console.error('Delete error:', error.message);
            Alert.alert('Error', 'Device delete karte waqt error aaya.');
          } finally {
            setIsDeleteLoading(false);
          }
        },
      },
    ]);
  };

  // ⭐️⭐️ YEH HAI NAYI LOGIC (NATIVE SDK ke saath) ⭐️⭐️
  const handleSendTestNotification = async () => {
    if (isTestLoading) return;
    setIsTestLoading(true); // Test loading state
    
    try {
      // 1. @react-native-firebase/functions ka istemaal karein
      // Isse getFunctions() ki zaroorat nahi hai
      const sendTestNotification = functions().httpsCallable('sendTestNotification');
      
      console.log('Calling cloud function "sendTestNotification"...');
      
      // 3. Function ko call karo
      const result: any = await sendTestNotification();
      
      console.log('Cloud function response:', result.data);

      if (result.data.success) {
        Alert.alert('✅ Success', 'Test notification sent successfully! Check your phone.');
      } else {
        throw new Error(result.data.error || 'Cloud function returned an error.');
      }

    } catch (err: any) {
      console.error('Notification error:', err.message);
      if(err.message.includes("not-found")) {
        Alert.alert('Error', 'Function not found. Please deploy your "sendTestNotification" cloud function.');
      } else {
        Alert.alert('Error', `Failed to send notification: ${err.message}`);
      }
    } finally {
      setIsTestLoading(false);
    }
  };

  // Koi bhi action chal raha ho toh buttons disable karein
  const isActionLoading = isTestLoading || isDeleteLoading;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#000428', '#004e92']}
        style={StyleSheet.absoluteFillObject}
      />
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Settings</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Icon name="account-circle" size={50} color="#fff" style={styles.profileIcon} />
          <View>
            <Text style={styles.profileEmail}>{userName}</Text>
            <Text style={styles.profileLabel}>Logged In User</Text>
          </View>
        </View>
        
        {/* General Settings */}
        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity
            style={styles.settingItem}
            disabled={isActionLoading}
            onPress={() => Alert.alert('Coming Soon', 'Yeh feature jald hi aa raha hai.')}
          >
            <Icon name="wifi-cog" size={24} color="#007AFF" style={styles.settingIcon} />
            <Text style={styles.settingText}>Change Device Wi-Fi</Text>
            <Icon name="chevron-right" size={22} color="#777" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            disabled={isActionLoading}
            onPress={() => Alert.alert('Coming Soon', 'Yeh feature jald hi aa raha hai.')}
          >
            <Icon name="account-edit" size={24} color="#4CAF50" style={styles.settingIcon} />
            <Text style={styles.settingText}>Update Profile</Text>
            <Icon name="chevron-right" size={22} color="#777" />
          </TouchableOpacity>
        </View>

        {/* Developer Settings */}
        <Text style={styles.sectionTitle}>Developer</Text>
        <TouchableOpacity
          style={styles.testButton}
          disabled={isActionLoading}
          onPress={handleSendTestNotification}
        >
          {isTestLoading ? ( // Sirf test loading check
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="bell-check" size={20} color="#fff" />
              <Text style={styles.buttonText}>Send Test Notification</Text>
            </>
          )}
        </TouchableOpacity>
        
        {/* Danger Zone */}
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          // ⭐️ FIX: Delete button ki sahi disabled logic
          disabled={isActionLoading || isDeviceLoading || !deviceId} 
          onPress={handleDeleteDevice}
        >
          {isDeleteLoading ? ( // Sirf delete loading check
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="delete-forever" size={20} color="#fff" />
              <Text style={styles.buttonText}>Delete My Device</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          disabled={isActionLoading}
          onPress={handleLogout}
        >
          <Icon name="logout" size={20} color="#fff" />
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- STYLES ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000428',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  profileIcon: {
    marginRight: 15,
  },
  profileEmail: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  sectionTitle: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 10,
  },
  settingsGroup: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingIcon: {
    marginRight: 15,
  },
  settingText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  testButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 30,
    marginTop: 10,
    height: 50,
  },
  deleteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E53935',
    padding: 15,
    borderRadius: 30,
    marginTop: 10,
    height: 50,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: '#DB4437',
    borderWidth: 2,
    padding: 15,
    borderRadius: 30,
    marginTop: 30,
    height: 50,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});