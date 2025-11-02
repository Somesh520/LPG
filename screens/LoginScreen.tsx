// screens/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert } from 'react-native';
import * as Animatable from 'react-native-animatable';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function LoginScreen({ navigation }: { navigation: any }) {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Google Sign-In ko configure karo
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '328780906303-pa0qqqkh1b9b3bnnaj2h7tg88u8overg.apps.googleusercontent.com',
    });
  }, []);

  // --- Email/Password Login Function ---
  const handleLogin = async () => {
    if (email.length === 0 || password.length === 0) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    try {
      await auth().signInWithEmailAndPassword(email, password);
      // --- FIX: Yahaan se navigation.replace('Home') HATA DIYA HAI ---
      // App.tsx ab navigation sambhaalega
    } catch (error: any) {
      console.log(error);
      if (error.code === 'auth/wrong-password' || 
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'Invalid email or password.');
      } else {
        Alert.alert('Error', 'An error occurred. Please try again.');
      }
    }
  };

  // --- Google Sign-In Function ---
  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo: any = await GoogleSignin.signIn(); 
      if (!userInfo || !userInfo.data || !userInfo.data.idToken) { 
        throw new Error('Google Sign-In failed: No ID Token found.');
      }
      const googleCredential = auth.GoogleAuthProvider.credential(userInfo.data.idToken);
      await auth().signInWithCredential(googleCredential);
      Alert.alert('Success', 'Logged in with Google!');
      // --- FIX: Yahaan se navigation.replace('Home') HATA DIYA HAI ---
      // App.tsx ab navigation sambhaalega
    } catch (error: any) {
      console.log('Google Sign-In Error:', error);
      if (error.code === 'SIGN_IN_CANCELLED') {
        Alert.alert('Cancelled', 'Google Sign-In was cancelled.');
      } else {
        Alert.alert('Error', error.message || 'Google Sign-In failed. Please try again.');
      }
    }
  };

  // --- UI (Same) ---
  return (
    <SafeAreaView style={styles.container}>
      <Animatable.Text animation="fadeInDown" style={styles.title}>
        Welcome Back!
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

      <Animatable.View animation="fadeIn" delay={800} style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </Animatable.View>

      <Animatable.View animation="fadeIn" delay={1000} style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.signupButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </Animatable.View>

      <Animatable.View animation="fadeIn" delay={1200} style={styles.separatorContainer}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>OR</Text>
        <View style={styles.separatorLine} />
      </Animatable.View>

      <Animatable.View animation="fadeIn" delay={1400} style={styles.buttonContainer}>
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
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
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  separatorText: {
    marginHorizontal: 10,
    color: '#888',
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: '#DB4437',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 8,
  },
  googleButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});