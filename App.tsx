// ===========================================
// ======== ✅ FINAL App.tsx (Splash Screen) ========
// ===========================================

import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  Text,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import * as Animatable from 'react-native-animatable'; // ⭐️ 1. YEH IMPORT ADD KIYA HAI

// Screens
import HomeScreen from './screens/HomeScreen';
import InfoScreen from './screens/InfoScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/Signup';
import AddDeviceScreen from './screens/AddDeviceScreen';
import WeightGraphScreen from './screens/WeightGraphScreen';
import BookingScreen from './screens/BookingScreen';
import SettingsScreen from './screens/SettingsScreen';
import ChatScreen from './screens/ChatScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ===========================================
// 1️⃣ Bottom Tabs (No Change)
// ===========================================
function BottomTabs() {
  // ... (Aapka code - No Change)
  return (
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
    </Tab.Navigator>
  );
}

// ===========================================
// 2️⃣ Auth Stack (No Change)
// ===========================================
function AuthStack({ hasViewedInfo }: { hasViewedInfo: boolean }) {
  // ... (Aapka code - No Change)
  return (
    <Stack.Navigator initialRouteName={hasViewedInfo ? 'Login' : 'Info'}>
      <Stack.Screen name="Info" component={InfoScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// ===========================================
// 3️⃣ App Stack (No Change)
// ===========================================
function AppStack() {
  // ... (Aapka code - No Change)
   return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={BottomTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="AddDevice"
        component={AddDeviceScreen}
        options={{ headerShown: false, presentation: 'card' }}
      />
      <Stack.Screen
        name="Chatbot"
        component={ChatScreen}
        options={{ 
          headerShown: true, 
          title: 'Guardian Bot', 
          headerStyle: { backgroundColor: '#010A18' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { color: '#FFFFFF' },
        }}
      />
    </Stack.Navigator>
  );
}

// ===========================================
// 4️⃣ Notification + FCM helper (No Change)
// ===========================================
async function requestUserPermissionAndSaveToken(userId: string) {
  // ... (Aapka code - No Change)
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      const token = await messaging().getToken();
      if (token) {
        await firestore().collection('users').doc(userId).set(
          { fcmToken: token, updatedAt: firestore.FieldValue.serverTimestamp() },
          { merge: true }
        );
      }

      const unsubscribe = messaging().onTokenRefresh(async (refreshedToken) => {
        await firestore().collection('users').doc(userId).set(
          { fcmToken: refreshedToken, updatedAt: firestore.FieldValue.serverTimestamp() },
          { merge: true }
        );
      });

      return unsubscribe;
    }
  } catch (error) {
    console.error('Error requesting FCM permission:', error);
  }
  return () => {};
}

// ===========================================
// 5️⃣ Main App Component (⭐️ LOGIC UPDATE HUA HAI ⭐️)
// ===========================================
function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasViewedInfo, setHasViewedInfo] = useState(false);

  // ⭐️ YEH POORA useEffect UPDATE HUA HAI ⭐️
  useEffect(() => {
    let tokenCleanup: (() => void) | undefined;

    const foregroundListener = messaging().onMessage(async remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title || 'New Alert',
        remoteMessage.notification?.body || 'Check your device!'
      );
    });

    // Loading shuru hone ka time
    const startTime = Date.now();
    const MIN_SPLASH_TIME = 1500; // 1.5 second (animation poora dikhane ke liye)

    // Auth check (login) turant shuru karo
    const authSubscriber = auth().onAuthStateChanged(async (userState) => {
      setUser(userState);
      try {
        if (userState) {
          tokenCleanup = await requestUserPermissionAndSaveToken(userState.uid);
        } else {
          if (tokenCleanup) tokenCleanup();
          const viewed = await AsyncStorage.getItem('hasViewedInfo');
          setHasViewedInfo(!!viewed);
        }
      } catch (err) {
        console.log('Error in auth flow:', err);
      } finally {
        // Auth check poora ho gaya
        const timePassed = Date.now() - startTime;
        
        if (timePassed < MIN_SPLASH_TIME) {
          // Agar auth jaldi ho gaya, toh animation poora hone tak ruko
          const remainingTime = MIN_SPLASH_TIME - timePassed;
          setTimeout(() => {
            setIsLoading(false);
          }, remainingTime);
        } else {
          // Agar auth mein time laga, toh turant splash hatao
          setIsLoading(false);
        }
      }
    });

    return () => {
      authSubscriber();
      foregroundListener();
      if (tokenCleanup) tokenCleanup();
    };
  }, []);

  // ⭐️ YEH BLOCK UPDATE HUA HAI (Splash Screen UI) ⭐️
  if (isLoading) {
    return (
      <LinearGradient colors={['#000428', '#004e92']} style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* 1. Cylinder (Hamesha jhoomta rahega) */}
        <Animatable.View
          animation="swing" 
          easing="ease-in-out" 
          iterationCount="infinite" 
          style={{ marginBottom: 20 }} 
        >
          <MaterialCommunityIcons 
            name="gas-cylinder" 
            size={100} 
            color="#FFFFFF" 
          />
        </Animatable.View>
  
        {/* 2. App Name (Neeche se upar aayega) */}
        <Animatable.Text 
          animation="fadeInUp"
          delay={200}
          duration={1500}
          style={styles.logoText}
        >
          LPGParent
        </Animatable.Text>

        {/* 3. Tagline (Dheere se dikhega) */}
        <Animatable.Text 
          animation="fadeIn"
          delay={600}
          duration={1500}
          style={styles.subText}
        >
          Your Smart Gas Guardian
        </Animatable.Text>
  
      </LinearGradient>
    );
  }

  // Jab loading poori, tab normal app
  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack hasViewedInfo={hasViewedInfo} />}
    </NavigationContainer>
  );
}

// ⭐️ STYLESHEET UPDATE HUI HAI ⭐️
const styles = StyleSheet.create({
  // 'loadingContainer' ko 'container' kar diya
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  // 'loadingText' hata diya, yeh naye styles add kiye
  logoText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  subText: {
    fontSize: 18,
    marginTop: 15,
    color: '#ccc',
  },
});

export default App;