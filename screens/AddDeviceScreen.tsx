// screens/AddDeviceScreen.tsx ka poora code, jismein Platform import ho chuka hai
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
  Platform // <-- YEH ZAROORI HAI
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import * as Animatable from 'react-native-animatable';

export default function AddDeviceScreen({ navigation }: { navigation: any }) {
  
  const [deviceName, setDeviceName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState(1);
  
  const [homeWifiSsid, setHomeWifiSsid] = useState('');
  const [homeWifiPassword, setHomeWifiPassword] = useState('');

  const DEVICE_IP = 'http://192.168.4.1';
  
  const user = auth().currentUser;
  const userName = user ? (user.displayName || user.email || 'User') : 'Friend';

  // --- PHASE 1 LOGIC (SAME) ---
  const handleNextPhase = () => {
    if (deviceName.length < 3) {
      Alert.alert('Error', 'Please enter a valid device name.');
      return;
    }
    setPhase(2);
  };
  
  // --- PROVISIONING LOGIC (SAME) ---
  const handleProvisioning = async () => {
    
    if (!user) { 
      Alert.alert('Error', 'Aap logged in nahi hain.');
      return;
    }
    
    setLoading(true);

    try {
      const macResponse = await fetch(`${DEVICE_IP}/mac`); 
      const macAddress = await macResponse.text(); 

      if (!macAddress || macAddress.length < 15) {
        throw new Error('Could not get MAC. Check Wi-Fi connection.');
      }

      const configResponse = await fetch(`${DEVICE_IP}/save_wifi?ssid=${homeWifiSsid}&pass=${homeWifiPassword}`);
      const configStatus = await configResponse.text();

      if (configStatus.trim() !== 'SUCCESS') {
        throw new Error('Failed to send Wi-Fi credentials.');
      }
      
      const formattedDeviceId = macAddress.toUpperCase().trim();

      await firestore().collection('devices').doc(formattedDeviceId).set({
        ownerId: user.uid, 
        ownerName: userName, 
        name: deviceName,
        createdAt: firestore.FieldValue.serverTimestamp(),
        gasLevel: null,
        weight: null,
        lastUpdated: null,
      });

      Alert.alert('Success', 'Device is configured and added! It will connect soon.');
      navigation.replace('Home'); 

    } catch (error: any) {
      console.log('Provisioning Error:', error.message || error);
      Alert.alert('Error', `Provisioning Failed: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  // --- Render Functions ---
  
  const renderPhase1 = () => (
    <>
      <Animatable.Text animation="fadeInUp" delay={200} style={styles.subtitle}>
        Step 1: Apne device ko ek naam dein.
      </Animatable.Text>

      <Animatable.View animation="fadeInUp" delay={400} style={styles.inputContainer}>
        <Text style={styles.label}>Device Name</Text> 
        <TextInput
          style={styles.input}
          placeholder="e.g., Kitchen Cylinder"
          value={deviceName}
          onChangeText={setDeviceName}
        />
      </Animatable.View>
      
      <Animatable.View animation="fadeIn" delay={600} style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleNextPhase} 
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </Animatable.View>
    </>
  );

  // --- FIXED RENDER PHASE 2 ---
  const renderPhase2 = () => (
    <>
      <Animatable.Text animation="fadeInUp" delay={100} style={styles.subtitle}>
        Step 2: Device ke Wi-Fi se connect karein.
      </Animatable.Text>
      
      <View style={styles.instructionBox}>
        <Text style={styles.instructionText}>1. Apne **ESP8266** device ko on karein.</Text>
        <Text style={styles.instructionText}>2. Phone ki **Wi-Fi settings** mein jaakar **LPG\_SETUP\_XXXX** network dhoondein.</Text>
        <Text style={styles.instructionText}>3. Us network se **connect** karein (koi password nahi hai).</Text>
        <Text style={[styles.instructionText, {marginTop: 10, fontWeight: 'bold'}]}>*Zaroori: Connect hone ke baad app par waapas aayen.*</Text>
      </View>
      
      <Animatable.View animation="fadeIn" delay={500} style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, {backgroundColor: '#DB4437'}]} 
          onPress={() => {
            if (Platform.OS === 'ios') {
                // iOS ke liye specific URL scheme (settings kholne ke liye)
                Linking.openURL('App-Prefs:root=WIFI');
            } else {
                // Android ke liye specific Intent, jo seedha Wi-Fi settings kholta hai
                Linking.sendIntent('android.settings.WIFI_SETTINGS');
            }
            
            // 5 second baad next phase par jaao
            setTimeout(() => setPhase(3), 5000); 
          }}
        >
          <Text style={styles.buttonText}>Open Wi-Fi Settings</Text>
        </TouchableOpacity>
      </Animatable.View>
      <TouchableOpacity 
          style={{marginTop: 10}}
          onPress={() => setPhase(1)} 
      >
          <Text style={{color: '#007AFF'}}>Back to Step 1</Text>
      </TouchableOpacity>
    </>
  );
  
  // Phase 3: Send Home Wi-Fi Credentials (Same)
  const renderPhase3 = () => (
    <>
      <Animatable.Text animation="fadeInUp" delay={100} style={styles.subtitle}>
        Step 3: Device ko ghar ka Wi-Fi batayein.
      </Animatable.Text>

      <Animatable.View animation="fadeInUp" delay={300} style={styles.inputContainer}>
        <Text style={styles.label}>Home Wi-Fi Name (SSID)</Text> 
        <TextInput
          style={styles.input}
          placeholder="Apne ghar ke Wi-Fi ka naam"
          value={homeWifiSsid}
          onChangeText={setHomeWifiSsid}
        />
      </Animatable.View>
      
      <Animatable.View animation="fadeInUp" delay={500} style={styles.inputContainer}>
        <Text style={styles.label}>Wi-Fi Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={homeWifiPassword}
          onChangeText={setHomeWifiPassword}
        />
      </Animatable.View>
      
      <Animatable.View animation="fadeIn" delay={700} style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleProvisioning} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Configure & Finish Setup</Text>
          )}
        </TouchableOpacity>
      </Animatable.View>
      <TouchableOpacity 
          style={{marginTop: 10}}
          onPress={() => setPhase(2)} 
      >
          <Text style={{color: '#007AFF'}}>Back to Step 2</Text>
      </TouchableOpacity>
    </>
  );


  return (
    <SafeAreaView style={styles.container}>
      <Animatable.Text animation="fadeInDown" style={styles.title}>
        Hello {userName}!
      </Animatable.Text>
      
      {phase === 1 && renderPhase1()}
      {phase === 2 && renderPhase2()}
      {phase === 3 && renderPhase3()}
      
    </SafeAreaView>
  );
}

// --- Styles (Same as before) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginLeft: 5,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructionBox: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    marginBottom: 30,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 25,
    color: '#444',
    fontWeight: '500',
  }
});