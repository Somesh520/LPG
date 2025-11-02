// screens/SignUpScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert } from 'react-native';
import * as Animatable from 'react-native-animatable';
import auth from '@react-native-firebase/auth';

export default function SignUpScreen({ navigation }: { navigation: any }) {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- Sign Up Function ---
  const handleSignUp = async () => {
    if (email.length === 0 || password.length === 0) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    
    try {
      await auth().createUserWithEmailAndPassword(email, password);
      Alert.alert('Success', 'Account created successfully! Logging in...');
      // --- FIX: Yahaan se navigation.replace('Home') HATA DIYA HAI ---
      // App.tsx ab navigation sambhaalega
    } catch (error: any) { 
      console.log(error);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'That email address is already in use!');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Error', 'Password should be at least 6 characters.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'Please enter a valid email address.');
      } else {
        Alert.alert('Error', 'An error occurred. Please try again.');
      }
    }
  };

  // --- UI (Same) ---
  return (
    <SafeAreaView style={styles.container}>
      <Animatable.Text animation="fadeInDown" style={styles.title}>
        Create Account
      </Animatable.Text>
      
      <Animatable.View animation="fadeInUp" delay={300} style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
      </Animatable.View>
      <Animatable.View animation="fadeInUp" delay={500} style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </Animatable.View>
      <Animatable.View animation="fadeInUp" delay={700} style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </Animatable.View>

      <Animatable.View animation="fadeIn" delay={900} style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </Animatable.View>

      <Animatable.View animation="fadeIn" delay={1100} style={styles.signupContainer}>
        <Text style={styles.signupText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.signupButtonText}>Login</Text>
        </TouchableOpacity>
      </Animatable.View>
      
    </SafeAreaView>
  );
}

// --- Styles (Same) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  signupText: {
    fontSize: 16,
    color: '#555',
  },
  signupButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});