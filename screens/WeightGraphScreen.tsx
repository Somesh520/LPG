// screens/WeightGraphScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function WeightGraphScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Cylinder Usage Analytics</Text>
      <View style={styles.graphPlaceholder}>
        <Text style={styles.placeholderText}>
          [Graph Yahaan Banega - Din Bhar Ka Gas Consumption]
        </Text>
      </View>
      <Text style={styles.infoText}>
        Aap dekh sakte hain ki din bhar mein kitna gas use ua (kg).
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  graphPlaceholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  }
});