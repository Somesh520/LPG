// screens/AddDeviceScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function AddDeviceScreen({ navigation }: { navigation: any }) {
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState(1); // 1: Name, 2: Connect, 3: Credentials

  const [homeWifiSsid, setHomeWifiSsid] = useState('');
  const [homeWifiPassword, setHomeWifiPassword] = useState('');

  const DEVICE_IP = 'http://192.168.4.1';
  const FETCH_TIMEOUT = 4000; // 4 second timeout

  // Step 1 -> 2
  const handleNextPhase = () => {
    if (deviceName.trim().length < 3) {
      Alert.alert('Error', 'Please enter a valid device name (at least 3 characters).');
      return;
    }
    setPhase(2);
  };

  // Logic: Step 2 -> 3
  // Yeh check karega ki phone ESP ke hotspot se connect hua ya nahi
  const handleVerifyConnection = async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const response = await fetch(`${DEVICE_IP}/mac`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const macText = await response.text();

      if (response.ok && macText && macText.length > 10) {
        setLoading(false);
        setPhase(3); // Success! Ab Step 3 par jaao
      } else {
        throw new Error('Device returned invalid response.');
      }
    } catch (err: any) {
      console.log('Verification failed:', err.message);
      setLoading(false);
      Alert.alert(
        'Connection Failed',
        'Could not find the device. Please make sure you are connected to the "LPG_SETUP_XXXX" Wi-Fi hotspot and try again.'
      );
    }
  };

  // Open Wi-Fi Settings
  const handleOpenWifiSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('App-Prefs:root=WIFI');
    } else {
      Linking.sendIntent('android.settings.WIFI_SETTINGS');
    }
  };

  // Step 3 - Provision device
  const handleProvisioning = async () => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert('Error', 'Login session expired. Please login again.');
      navigation.replace('Login');
      return;
    }
    if (!homeWifiSsid.trim() || homeWifiPassword.trim().length < 8) {
      Alert.alert('Error', 'Please enter valid Wi-Fi credentials (password 8+ characters).');
      return;
    }

    setLoading(true);

    try {
      console.log('📡 Fetching device MAC address...');
      const macController = new AbortController();
      const macTimeout = setTimeout(() => macController.abort(), FETCH_TIMEOUT);
      const macRes = await fetch(`${DEVICE_IP}/mac`, { signal: macController.signal });
      clearTimeout(macTimeout);
      const macText = await macRes.text();
      console.log('📍 MAC Response:', macText);

      if (!macRes.ok || !macText || macText.length < 10) {
        throw new Error('Failed to read MAC from device. Check Wi-Fi connection.');
      }

      console.log('📡 Sending Wi-Fi credentials...');
      const wifiController = new AbortController();
      const wifiTimeout = setTimeout(() => wifiController.abort(), 10000); // 10 sec timeout
      const wifiRes = await fetch(
        `${DEVICE_IP}/save_wifi?ssid=${encodeURIComponent(homeWifiSsid)}&pass=${encodeURIComponent(homeWifiPassword)}`,
        { signal: wifiController.signal }
      );
      clearTimeout(wifiTimeout);
      const wifiText = await wifiRes.text();
      console.log('📩 Device Response:', wifiText);

      // ⭐️⭐️⭐️ YEH RAHA AAPKA FIX ⭐️⭐️⭐️
      // Hum plain text "SUCCESS" check nahi kar rahe hain.
      // Hum check kar rahe hain ki response mein 'success', 'connected', ya '✅' hai ya nahi.
      const lowerCaseStatus = wifiText.toLowerCase();
      if (
        !wifiRes.ok ||
        (!lowerCaseStatus.includes('success') &&
         !lowerCaseStatus.includes('connected') &&
         !lowerCaseStatus.includes('✅'))
      ) {
        throw new Error(`Failed to send Wi-Fi credentials. Response: ${wifiText.trim()}`);
      }
      // ⭐️⭐️⭐️ FIX KHATAM ⭐️⭐️⭐️

      const formattedId = macText.trim().replace(/:/g, '_').toUpperCase();
      const userName = user.displayName || user.email || 'User';

      await firestore().collection('devices').doc(formattedId).set(
        {
          ownerId: user.uid,
          ownerName: userName,
          name: deviceName.trim(),
          createdAt: firestore.FieldValue.serverTimestamp(),
          gasLevel: 0,
          weight: 0,
          unit: 'kg',
          lastUpdated: null,
        },
        { merge: true }
      );

      saveTokenAfterSetup().catch(err => console.log('Token save failed in background', err));

      Alert.alert('✅ Success!', 'Device added successfully. It will now restart and connect to your home Wi-Fi.');

      // Home screen par waapas bhejo
      navigation.navigate('Home'); // 'AppTabs' ke andar 'Home' par jaao

    } catch (err: any) {
      console.error('❌ Provisioning Error:', err.message || err);
      Alert.alert(
        'Provisioning Failed',
        `Could not configure device. Please check your Wi-Fi password and try again.\n\nError: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Save FCM Token (Notification ke liye)
  const saveTokenAfterSetup = async () => {
    try {
      const user = auth().currentUser;
      if (!user) return;
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const fcmToken = await messaging().getToken();
        if (fcmToken) {
          await firestore().collection('users').doc(user.uid).set(
            { fcmToken },
            { merge: true }
          );
          console.log('✅ Token saved from AddDeviceScreen');
        }
      }
    } catch (error) {
      console.error('❌ Error saving token from AddDeviceScreen:', error);
    }
  };

  // --- Render Functions (NAYA DESIGN) ---

  // Phase 1: Name
  const renderPhase1 = () => (
    <>
      <Text style={styles.subtitle}>Step 1: Give your device a name</Text>
      <View style={styles.inputContainer}>
        <Icon name="rename-box" size={20} color="#ccc" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="e.g., Kitchen Cylinder"
          placeholderTextColor="#ccc"
          value={deviceName}
          onChangeText={setDeviceName}
        />
      </View>
      <TouchableOpacity style={styles.button} onPress={handleNextPhase}>
        <Text style={styles.buttonText}>Next Step</Text>
      </TouchableOpacity>
    </>
  );

  // Phase 2: Connect
  const renderPhase2 = () => (
    <>
      <Text style={styles.subtitle}>Step 2: Connect to the device hotspot</Text>
      <View style={styles.instructionBox}>
        <Text style={styles.instructionText}>1. Power on your Smart Guardian device.</Text>
        <Text style={styles.instructionText}>
          2. Go to your phone's Wi-Fi settings and connect to the network named:
        </Text>
        <Text style={styles.hotspotName}>"LPG_SETUP_XXXX"</Text>
        <Text style={styles.instructionText}>
          3. Once connected, return to this app and tap "Verify".
        </Text>
      </View>

      <TouchableOpacity
        style={styles.outlineButton}
        onPress={handleOpenWifiSettings}
      >
        <Icon name="wifi-settings" size={20} color="#FFFFFF" />
        <Text style={styles.outlineButtonText}>Open Wi-Fi Settings</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleVerifyConnection}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#004e92" />
        ) : (
          <>
            <Icon name="wifi-check" size={20} color="#004e92" />
            <Text style={styles.buttonText}>Verify Connection</Text>
          </>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.backButton} onPress={() => setPhase(1)}>
        <Text style={styles.backButtonText}>Back to Step 1</Text>
      </TouchableOpacity>
    </>
  );

  // Phase 3: Credentials
  const renderPhase3 = () => (
    <>
      <Text style={styles.subtitle}>Step 3: Enter your Home Wi-Fi details</Text>
      <View style={styles.inputContainer}>
        <Icon name="wifi" size={20} color="#ccc" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Your Home Wi-Fi Name (SSID)"
          placeholderTextColor="#ccc"
          value={homeWifiSsid}
          onChangeText={setHomeWifiSsid}
          autoCapitalize="none"
        />
      </View>
      <View style={styles.inputContainer}>
        <Icon name="lock-outline" size={20} color="#ccc" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Your Home Wi-Fi Password"
          placeholderTextColor="#ccc"
          secureTextEntry
          value={homeWifiPassword}
          onChangeText={setHomeWifiPassword}
          autoCapitalize="none"
        />
      </View>
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleProvisioning}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#004e92" />
        ) : (
          <Text style={styles.buttonText}>Configure & Finish Setup</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.backButton} onPress={() => setPhase(2)}>
        <Text style={styles.backButtonText}>Back to Step 2</Text>
      </TouchableOpacity>
    </>
  );

  const getUserName = () => {
    const user = auth().currentUser;
    return user ? user.email || 'User' : 'Friend';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#000428', '#004e92']}
        style={StyleSheet.absoluteFillObject}
      />
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Add New Device</Text>
        <View style={{ width: 40 }} /> 
      </View>
      
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.welcome}>Hello {getUserName()} 👋</Text>
        {phase === 1 && renderPhase1()}
        {phase === 2 && renderPhase2()}
        {phase === 3 && renderPhase3()}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- NAYE STYLES ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000428',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
  },
  headerBack: {
    padding: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  welcome: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#FFFFFF',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF', // Primary button
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    width: '100%',
    height: 50,
  },
  buttonText: {
    color: '#004e92', // Dark blue text
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  outlineButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    width: '100%',
    height: 50,
  },
  outlineButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  instructionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  instructionText: {
    fontSize: 15,
    color: '#ccc',
    marginBottom: 8,
    lineHeight: 22,
  },
  hotspotName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  backButton: {
    marginTop: 20,
    padding: 5,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
});