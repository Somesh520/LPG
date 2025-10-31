import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Dono screens ko import karo (screens/ folder se)
import HomeScreen from './screens/HomeScreen';
import InfoScreen from './screens/InfoScreen';

// Stack navigator banaya
const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        
        {/* Pehli Screen */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Dashboard' }} // Upar 'Dashboard' likha aayega
        />
        
        {/* Doosri Screen (Aapka Info Page) */}
        <Stack.Screen 
          name="Info" // Yeh naam 'navigation.navigate' se match hona chahiye
          component={InfoScreen} 
          options={{ title: 'App Ki Jaankari' }} // Upar 'App Ki Jaankari' likha aayega
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;