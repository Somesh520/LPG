// screens/BookingScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Linking } from 'react-native';

const GAS_PROVIDER_URL = 'https://portal.indianoil.in/sbw/Mobile/LPG/'; // Example UR

const handleBookNow = () => {
    Linking.canOpenURL(GAS_PROVIDER_URL).then(supported => {
        if (supported) {
            Linking.openURL(GAS_PROVIDER_URL);
        } else {
            Alert.alert("Error", "Booking portal is not accessible.");
        }
    });
};

export default function BookingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Cylinder Book Service</Text>
      <Text style={styles.infoText}>
        Aap yahaan se naya LPG cylinder book kar sakte hain. Hum aapko seedha official portal par bhejenge.
      </Text>

      <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
        <Text style={styles.bookButtonText}>Go to Booking Portal</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 40,
  },
  bookButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 5,
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});