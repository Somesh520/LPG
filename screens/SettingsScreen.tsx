// screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView, // 🎨 Naya import
  StatusBar,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient'; // 🎨 Naya import
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // 🎨 Naya import

// ⚠️⚠️⚠️ BOHOT ZAROORI WARNING ⚠️⚠️⚠️
// Apna server key app mein store karna ek BADA SECURITY RISK hai.
// Koi bhi aapki app ko decompile karke yeh key chura sakta hai aur aapke sabhi users ko faltu notifications bhej sakta hai.
// Sahi tareeka: Ek Cloud Function banayein jo app se request le aur *server par* yeh key istemaal karke notification bhej
const FCM_SERVER_KEY =
  'YOUR_SERVER_KEY_HERE';
// ------------------------------------------

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const user = auth().currentUser;
  const userName = user ? user.email : 'Guest';
  
  // 🎨 Sirf ek loading state rakhein
  const [isLoading, setIsLoading] = useState(false); 

  // 🔹 Logout
  const handleLogout = () => {
    Alert.alert('Logout', 'Kya aap sach mein logout karna chahte hain?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', 
        onPress: () => {
          auth().signOut();
          // Login screen par le jaayein (App.tsx state change se handle kar lega)
        } 
      },
    ]);
  };

  // 🔹 Delete Device (FIXED LOGIC)
  const handleDeleteDevice = async () => {
    if (!user) return Alert.alert('Error', 'Please login first.');

    Alert.alert('Delete Device', 'Kya aap apna device permanently delete karna chahte hain? Yeh action reverse nahi ho sakta.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Delete',
        style: 'destructive',
        onPress: async () => {
          setIsLoading(true);
          try {
            const snapshot = await firestore()
              .collection('devices')
              .where('ownerId', '==', user.uid)
              .get();

            if (snapshot.empty) {
              return Alert.alert('Info', 'Koi device linked nahi hai.');
            }

            const deviceDoc = snapshot.docs[0];
            const deviceId = deviceDoc.id;
            console.log('Deleting device:', deviceId);

            // --- LOGIC FIX ---
            // Woh 192.168.4.1 wala fetch hata diya hai kyunki woh 99% fail hoga.
            // Factory reset cloud se trigger hona chahiye (e.g., Firestore mein ek 'command' field set karke).
            console.log('Device factory reset signal cloud (MQTT/Firestore) se bhejna chahiye.');

            // Firestore se device delete karein
            await firestore().collection('devices').doc(deviceId).delete();

            Alert.alert('Success', 'Device deleted successfully.');
            // 'AddDevice' par bhejne ki zaroorat nahi, 'Home' screen ab empty state dikhayegi.
          } catch (error: any) {
            console.error('Delete error:', error.message);
            Alert.alert('Error', 'Device delete karte waqt error aaya.');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  // 🔔 Manual FCM Notification Test (FIXED)
  const handleSendTestNotification = async () => {
    if (isLoading) return;

    // --- SECURITY CHECK ---
    if (FCM_SERVER_KEY === 'YOUR_SERVER_KEY_HERE') {
      Alert.alert(
        'Warning',
        'Please add your FCM Server Key in the SettingsScreen.tsx file first.'
      );
      return;
    }

    if (!user) return Alert.alert('Error', 'Please login first.');
    
    setIsLoading(true);
    try {
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const fcmToken = userDoc.data()?.fcmToken;

      if (!fcmToken) {
        return Alert.alert(
          'Error',
          'No FCM token found. Try logging out and back in.'
        );
      }

      const notificationPayload = {
        to: fcmToken,
        notification: {
          title: '🔥 Smart Guardian Test',
          body: 'This is a test notification from your app!',
          sound: 'default',
        },
      };

      await axios.post('https://fcm.googleapis.com/fcm/send', notificationPayload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${FCM_SERVER_KEY}`,
        },
      });

      Alert.alert('✅ Success', 'Test notification sent successfully!');
    } catch (err: any) {
      console.error('Notification error:', err.message);
      Alert.alert('Error', 'Failed to send notification. Check your server key.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 🎨 NAYA CREATIVE UI ---
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
            disabled={isLoading}
            onPress={() => Alert.alert('Coming Soon', 'Yeh feature jald hi aa raha hai.')}
          >
            <Icon name="wifi-cog" size={24} color="#007AFF" style={styles.settingIcon} />
            <Text style={styles.settingText}>Change Device Wi-Fi</Text>
            <Icon name="chevron-right" size={22} color="#777" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            disabled={isLoading}
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
          disabled={isLoading}
          onPress={handleSendTestNotification}
        >
          {isLoading ? (
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
          disabled={isLoading}
          onPress={handleDeleteDevice}
        >
          {isLoading ? (
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
          disabled={isLoading}
          onPress={handleLogout}
        >
          <Icon name="logout" size={20} color="#fff" />
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- NAYE CREATIVE STYLES ----------
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
    overflow: 'hidden', // Taaki items ke corner bhi round hon
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    // Neeche waali item ke liye border
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingIcon: {
    marginRight: 15,
  },
  settingText: {
    color: '#fff',
    fontSize: 16,
    flex: 1, // Taaki text poori jagah le
  },
  
  // Action Buttons
  testButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 30,
    marginTop: 10,
    height: 50, // Fix height taaki loading mein jump na ho
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