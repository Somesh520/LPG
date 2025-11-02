// App.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Sabhi screens import karo
import HomeScreen from './screens/HomeScreen';
import InfoScreen from './screens/InfoScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/Signup'; // Path check kar lena
import AddDeviceScreen from './screens/AddDeviceScreen';

const Stack = createNativeStackNavigator();

// --- Logged-Out users ke liye Screens ---
function AuthStack({ hasViewedInfo }: { hasViewedInfo: boolean }) {
  return (
    <Stack.Navigator 
      // Agar info dekh liya hai toh Login se, warna Info se shuru karo
      initialRouteName={hasViewedInfo ? 'Login' : 'Info'}
    >
      <Stack.Screen name="Info" component={InfoScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// --- Logged-In users ke liye Screens ---
function MainStack({ hasDevice }: { hasDevice: boolean }) {
  return (
    <Stack.Navigator
      // Agar device nahi hai toh AddDevice se, warna Home se shuru karo
      initialRouteName={hasDevice ? 'Home' : 'AddDevice'}
    >
      <Stack.Screen name="AddDevice" component={AddDeviceScreen} options={{ title: 'Add Your Device' }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard' }} />
      {/* Aap yahaan aur screens (jaise Profile, Settings) add kar sakte hain */}
    </Stack.Navigator>
  );
}

// --- Main App Component ---
function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null); // User ki login state
  const [hasViewedInfo, setHasViewedInfo] = useState(false); // Info screen dekhi ya nahi
  const [hasDevice, setHasDevice] = useState(false); // Device hai ya nahi

  useEffect(() => {
    // Firebase ka listener
    const subscriber = auth().onAuthStateChanged(async (userState) => {
      setUser(userState); // User ki state set karo (ya null)

      try {
        if (userState) {
          // --- User Logged In Hai ---
          // Check karo device hai ya nahi
          const deviceQuery = await firestore()
            .collection('devices')
            .where('ownerId', '==', userState.uid)
            .limit(1)
            .get();
          
          setHasDevice(!deviceQuery.empty); // Device state set karo
        
        } else {
          // --- User Logged Out Hai ---
          // Check karo Info screen dekhi hai ya nahi
          const viewed = await AsyncStorage.getItem('hasViewedInfo');
          setHasViewedInfo(!!viewed); // true/false set karo
        }
      } catch (e) {
        console.log("Error during auth state check:", e);
      } finally {
        // Sab kuch check ho gaya, loading band karo
        setIsLoading(false);
      }
    });

    return subscriber; // Cleanup
  }, []); // Yeh effect sirf ek baar app load par chalega

  if (isLoading) {
    // Jab tak sab check ho raha hai, loading dikhao
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* Yahaan hai Asli Logic:
        Agar 'user' object hai (logged in), toh 'MainStack' dikhao.
        Agar 'user' null hai (logged out), toh 'AuthStack' dikhao.
      */}
      {user ? <MainStack hasDevice={hasDevice} /> : <AuthStack hasViewedInfo={hasViewedInfo} />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  }
});

export default App;