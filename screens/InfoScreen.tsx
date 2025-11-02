// screens/InfoScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';

export default function InfoScreen({ navigation }: { navigation: any }) {

  const handleGetStarted = async () => {
    try {
      // 1. Save karo ki user ne info dekh li hai
      await AsyncStorage.setItem('hasViewedInfo', 'true');
      
      // 2. User ko 'Login' page par bhejo (Home ki jagah)
      navigation.replace('Login'); // <-- YEH CHANGE KIYA HAI

    } catch (e) {
      console.log("AsyncStorage error", e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      <Animatable.View animation="fadeInDown" duration={1000}>
        <Text style={styles.title}>Smart Guardian</Text>
      </Animatable.View>
      
      <Animatable.Text style={styles.infoText} animation="fadeInUp" delay={500}>
        Aapki suraksha, hamari zimmedari.
      </Animatable.Text>
      
      <Animatable.Text style={styles.description} animation="fadeInUp" delay={800}>
        Yeh app LPG gas leaks ko detect karke aapko alert karegi aur cylinder ka weight track karegi.
      </Animatable.Text>

      <Animatable.View animation="fadeIn" delay={1200} style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </Animatable.View>
      
    </SafeAreaView>
  );
}

// Styles (Same as before)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 18,
    color: '#555',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});