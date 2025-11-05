// App.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, StyleSheet, Text, StatusBar } from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

// Screens
import HomeScreen from './screens/HomeScreen';
import InfoScreen from './screens/InfoScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/Signup'; // Using your file name 'Signup'
import AddDeviceScreen from './screens/AddDeviceScreen';
import WeightGraphScreen from './screens/WeightGraphScreen';
import BookingScreen from './screens/BookingScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ===================
// 1️⃣ Bottom Tab Navigation
// ===================
function BottomTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#88a1b9',
        tabBarStyle: {
          backgroundColor: '#000428',
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={WeightGraphScreen}
        options={{
          tabBarLabel: 'Usage',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Booking"
        component={BookingScreen}
        options={{
          tabBarLabel: 'Book',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="gas-cylinder" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />

      {/* 🔧 Hidden AddDevice screen */}
      <Tab.Screen
        name="AddDevice"
        component={AddDeviceScreen}
        options={{
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' },
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

// ===================
// 2️⃣ Auth Stack (Login / Onboarding)
// ===================
function AuthStack({ hasViewedInfo }: { hasViewedInfo: boolean }) {
  return (
    <Stack.Navigator initialRouteName={hasViewedInfo ? 'Login' : 'Info'}>
      <Stack.Screen name="Info" component={InfoScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// ===================
// 4️⃣ Notification Helper Function
// ===================
async function requestUserPermissionAndSaveToken(userId: string) {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('🔔 Notification permission granted.');
      const fcmToken = await messaging().getToken();

      if (fcmToken) {
        console.log('User FCM Token:', fcmToken);
        await firestore().collection('users').doc(userId).set({
          fcmToken: fcmToken,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log('✅ FCM Token saved to Firestore.');
      }
    } else {
      console.warn('Notification permission denied.');
    }
  } catch (error) {
    console.error("❌ Error in requestUserPermissionAndSaveToken: ", error);
  }
}

// ===================
// 5️⃣ Main App Component
// ===================
function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasViewedInfo, setHasViewedInfo] = useState(false);

  useEffect(() => {
    console.log('🟡 App started → Checking login state...');

    const authSubscriber = auth().onAuthStateChanged(async (userState) => {
      console.log('👤 Firebase Auth Changed:', userState ? 'LOGGED IN ✅' : 'LOGGED OUT ❌');
      setUser(userState);

      try {
        if (userState) {
          // User is logged in
          requestUserPermissionAndSaveToken(userState.uid).catch(err => console.log(err));
        } else {
          // User is logged out
          const viewed = await AsyncStorage.getItem('hasViewedInfo');
          setHasViewedInfo(!!viewed);
          console.log('📘 Onboarding Viewed?', !!viewed);
        }
      } catch (err) {
        console.log('❌ Error checking auth/onboarding:', err);
      } finally {
        setIsLoading(false);
      }
    });

    return authSubscriber; // Cleanup
  }, []);

  // 🌀 Loading UI
  if (isLoading) {
    return (
      <LinearGradient colors={['#000428', '#004e92']} style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading your Smart Guardian...</Text>
      </LinearGradient>
    );
  }

  // 🧭 Main Navigation
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      {user ? <BottomTabs /> : <AuthStack hasViewedInfo={hasViewedInfo} />}
    </NavigationContainer>
  );
}

// ===================
// Styles
// ===================
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#ccc',
  }
});

export default App;