import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  Text,
  StatusBar,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

// Screens
import HomeScreen from './screens/HomeScreen';
import InfoScreen from './screens/InfoScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/Signup';
import AddDeviceScreen from './screens/AddDeviceScreen';
import WeightGraphScreen from './screens/WeightGraphScreen';
import BookingScreen from './screens/BookingScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ===================
// 1️⃣ Bottom Tab Navigation (CLEANED)
// ===================
function BottomTabs() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#010A18' }}>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#9ab3c9',
          tabBarStyle: {
            backgroundColor: '#010A18',
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 90 : 65,
            paddingBottom: Platform.OS === 'ios' ? 30 : 8,
            paddingTop: 6,
            elevation: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            marginBottom: 2,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="home-variant" color={color} size={26} />
            ),
          }}
        />
        <Tab.Screen
          name="Analytics"
          component={WeightGraphScreen}
          options={{
            tabBarLabel: 'Usage',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="chart-bar" color={color} size={26} />
            ),
          }}
        />
        <Tab.Screen
          name="Booking"
          component={BookingScreen}
          options={{
            tabBarLabel: 'Book',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="gas-cylinder" color={color} size={26} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="cog" color={color} size={26} />
            ),
          }}
        />
        {/* 🟢 REMOVED the hidden 'AddDevice' tab from here. 
            It's already correctly defined in AppStack.
        */}
      </Tab.Navigator>
    </SafeAreaView>
  );
}



// ===================
// 2️⃣ Auth Stack
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
// 3️⃣ App Stack (This is correct)
// ===================
function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        component={BottomTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddDevice"
        component={AddDeviceScreen}
        options={{
          headerShown: false,
          presentation: 'card', 
        }}
      />
    </Stack.Navigator>
  );
}

// ===================
// 4️⃣ Notification Helper
// ===================
async function requestUserPermissionAndSaveToken(userId: string) {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      // 1. Initial Token Fetch and Save
      const initialToken = await messaging().getToken();
      if (initialToken) {
        await firestore().collection('users').doc(userId).set(
          { fcmToken: initialToken, updatedAt: firestore.FieldValue.serverTimestamp() },
          { merge: true }
        );
        console.log('✅ Initial FCM Token saved.');
      }
      
      // 2. Persistent Listener for Token Refresh
      const unsubscribeRefresh = messaging().onTokenRefresh(async (refreshedToken) => {
        await firestore().collection('users').doc(userId).set(
          { fcmToken: refreshedToken, updatedAt: firestore.FieldValue.serverTimestamp() },
          { merge: true }
        );
        console.log('🔄 FCM Token refreshed and saved successfully!');
      });
      
      return unsubscribeRefresh; // Cleanup function return karein
    } 
  } catch (error) {
    console.error('❌ Error in requestUserPermissionAndSaveToken:', error);
  }
  return () => {}; // Agar permission nahi mili, toh empty cleanup function return karein
}

// ===================
// 5️⃣ Main App
// ===================
function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasViewedInfo, setHasViewedInfo] = useState(false);

  useEffect(() => {
    let tokenRefreshCleanup: (() => void) | undefined;
    
    // Foreground listener
    const foregroundListener = messaging().onMessage(async remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title || 'New Alert',
        remoteMessage.notification?.body || 'Check your device!'
      );
    });

    const authSubscriber = auth().onAuthStateChanged(async (userState) => {
      setUser(userState);
      try {
        if (userState) {
          // Jab user login karega, tab listener start hoga
          tokenRefreshCleanup = await requestUserPermissionAndSaveToken(userState.uid);
        } else {
          // Logout par, purana listener band kar de
          if (tokenRefreshCleanup) {
             tokenRefreshCleanup();
             tokenRefreshCleanup = undefined;
          }
          const viewed = await AsyncStorage.getItem('hasViewedInfo');
          setHasViewedInfo(!!viewed);
        }
      } catch (err) {
        console.log('❌ Error checking auth/onboarding:', err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      authSubscriber();
      foregroundListener();
      if (tokenRefreshCleanup) {
        tokenRefreshCleanup(); // Final cleanup
      }
    };
  }, []);

  if (isLoading) {
    return (
      <LinearGradient colors={['#000428', '#004e92']} style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading your Smart Guardian...</Text>
      </LinearGradient>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack hasViewedInfo={hasViewedInfo} />}
    </NavigationContainer>
  );
}

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
  },
});

export default App;