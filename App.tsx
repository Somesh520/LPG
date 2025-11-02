// App.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // <-- NEW IMPORT
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Icon library (install kar lena: npm install react-native-vector-icons)
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; 

// Sabhi screens import karo
import HomeScreen from './screens/HomeScreen';
import InfoScreen from './screens/InfoScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/Signup'; 
import AddDeviceScreen from './screens/AddDeviceScreen';
// --- NAYE TAB SCREENS ---
import WeightGraphScreen from './screens/WeightGraphScreen'; // Usage/Graph
import BookingScreen from './screens/BookingScreen';         // Booking
import SettingsScreen from './screens/SettingsScreen';       // Settings

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator(); // <-- Tab Navigator Instanc

// --- 1. BOTTOM TAB NAVIGATOR (LOGGED-IN Screens) --
function BottomTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false, // Tabs ke upar koi header nahi chahiye
        tabBarActiveTintColor: '#007AFF', // Blue color
        tabBarStyle: { height: 60, paddingBottom: 5 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
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
    </Tab.Navigator>
  );
}


// --- 2. LOGGED-OUT USERS KE LIYE Screens ---
function AuthStack({ hasViewedInfo }: { hasViewedInfo: boolean }) {
  return (
    <Stack.Navigator 
      initialRouteName={hasViewedInfo ? 'Login' : 'Info'}
    >
      <Stack.Screen name="Info" component={InfoScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// --- 3. LOGGED-IN USERS KE LIYE Screens (Jo Tabs ko load karega) ---
function MainStack({ hasDevice }: { hasDevice: boolean }) {
  return (
    <Stack.Navigator
      // Agar device nahi hai toh AddDevice se shuru karo
      initialRouteName={hasDevice ? 'AppTabs' : 'AddDevice'} 
    >
      <Stack.Screen name="AddDevice" component={AddDeviceScreen} options={{ title: 'Add Your Device' }} />
      {/* Tab Navigator ko load karna */}
      <Stack.Screen name="AppTabs" component={BottomTabs} options={{ headerShown: false }} /> 
    </Stack.Navigator>
  );
}

// --- 4. Main App Component ---
function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null); 
  const [hasViewedInfo, setHasViewedInfo] = useState(false); 
  const [hasDevice, setHasDevice] = useState(false); 

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (userState) => {
      setUser(userState);

      try {
        if (userState) {
          // --- User Logged In Hai: Check Device ---
          const deviceQuery = await firestore()
            .collection('devices')
            .where('ownerId', '==', userState.uid)
            .limit(1)
            .get();
          
          setHasDevice(!deviceQuery.empty); 
        
        } else {
          // --- User Logged Out Hai: Check Onboarding ---
          const viewed = await AsyncStorage.getItem('hasViewedInfo');
          setHasViewedInfo(!!viewed); 
        }
      } catch (e) {
        console.log("Error during auth state check:", e);
      } finally {
        setIsLoading(false);
      }
    });

    return subscriber; 
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* Conditional Rendering: User logged in hai toh MainStack (Tabs) dikhao, warna AuthStack */}
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