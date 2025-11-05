// screens/InfoScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar, // Add this
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Add this

export default function InfoScreen({ navigation }: { navigation: any }) {
  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('hasViewedInfo', 'true');
      navigation.replace('Login');
    } catch (e) {
      console.log('AsyncStorage error', e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 🔹 Dark Gradient Background (Matches Login Screen) */}
      <LinearGradient
        colors={['#000428', '#004e92']}
        style={StyleSheet.absoluteFillObject}
      />
      <StatusBar barStyle="light-content" />

      {/* 🔹 Background Logo (Fades in) */}
      <Animatable.View
        animation="fadeIn"
        duration={1500}
        delay={200}
        style={styles.backgroundIconContainer}
      >
        {/* Aap icon badal sakte hain (e.g., 'shield-home', 'security') */}
        <Icon name="shield-check-outline" size={250} color="rgba(255,255,255,0.05)" />
      </Animatable.View>

      {/* 🔹 Content Sheet (Slides up from bottom) */}
      <Animatable.View
        animation="slideInUp"
        duration={1000}
        delay={300}
        style={styles.contentSheet}
      >
        <Text style={styles.title}>
          Welcome to{'\n'}
          <Text style={{ color: '#004e92' }}>Smart Guardian</Text> 🛡️
        </Text>

        <Text style={styles.description}>
          Your complete home safety solution. We keep you protected with:
        </Text>

        {/* 🔹 Feature List (Clearer than a paragraph) */}
        <View style={styles.featureItem}>
          <Icon name="gas-cylinder" size={30} color="#004e92" style={styles.featureIcon} />
          <View>
            <Text style={styles.featureTitle}>LPG Leak Detection</Text>
            <Text style={styles.featureDescription}>Get instant alerts before it's too late.</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Icon name="weight-kilogram" size={30} color="#004e92" style={styles.featureIcon} />
          <View>
            <Text style={styles.featureTitle}>Cylinder Weight Monitoring</Text>
            <Text style={styles.featureDescription}>Know exactly when you're running low.</Text>
          </View>
        </View>

        {/* 🔹 Get Started Button (Matches Login Screen) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleGetStarted}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
        
        <Text style={styles.footerText}>Powered by AlphaNexus</Text>

      </Animatable.View>
    </SafeAreaView>
  );
}

// --- NAYE CREATIVE STYLES ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000428', // Background color for notch/safe area
  },
  backgroundIconContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: '50%', // Icon ko thoda upar rakhta hai
  },
  contentSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingVertical: 40,
    marginTop: '50%', // Top se 50% neeche shuru hoga
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#333',
    lineHeight: 40,
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 25,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f5f8ff', // Thoda highlight
    borderRadius: 10,
    padding: 15,
  },
  featureIcon: {
    marginRight: 15,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  button: {
    backgroundColor: '#004e92', // Main theme color
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20, // Space from feature list
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerText: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 'auto', // Button se neeche push karta hai
    paddingTop: 10,
  },
});