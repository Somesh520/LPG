import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Yeh aapka "Info Page" hai
export default function InfoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Info Page</Text>
      <Text style={styles.infoText}>
        Yeh app LPG gas leaks ko detect karne ke liye banayi gayi hai.
      </Text>
      <Text style={styles.infoText}>
        Hum MQ-6 sensor aur Load cell ka use kar rahe hain. (CLI Project)
      </Text>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  }
});